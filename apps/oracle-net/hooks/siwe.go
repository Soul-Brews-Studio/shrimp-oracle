package hooks

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// Nonce store with expiry
type nonceStore struct {
	sync.RWMutex
	nonces map[string]nonceEntry
}

type nonceEntry struct {
	address   string
	expiresAt time.Time
}

var store = &nonceStore{
	nonces: make(map[string]nonceEntry),
}

func generateNonce() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func (s *nonceStore) set(nonce, address string) {
	s.Lock()
	defer s.Unlock()
	s.nonces[nonce] = nonceEntry{
		address:   address,
		expiresAt: time.Now().Add(5 * time.Minute),
	}
}

func (s *nonceStore) get(nonce string) (string, bool) {
	s.RLock()
	defer s.RUnlock()
	entry, ok := s.nonces[nonce]
	if !ok || time.Now().After(entry.expiresAt) {
		return "", false
	}
	return entry.address, true
}

func (s *nonceStore) delete(nonce string) {
	s.Lock()
	defer s.Unlock()
	delete(s.nonces, nonce)
}

// RegisterSIWE sets up SIWE authentication routes
func RegisterSIWE(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Nonce endpoint
		e.Router.POST("/api/auth/siwe/nonce", func(re *core.RequestEvent) error {
			var body struct {
				Address string `json:"address"`
			}
			if err := re.BindBody(&body); err != nil {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
			}

			address := strings.ToLower(body.Address)
			if !common.IsHexAddress(address) {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid address"})
			}

			nonce := generateNonce()
			store.set(nonce, address)

			message := fmt.Sprintf("Sign in to OracleNet\n\nNonce: %s\nAddress: %s\nTimestamp: %s",
				nonce, address, time.Now().UTC().Format(time.RFC3339))

			return re.JSON(http.StatusOK, map[string]any{
				"nonce":     nonce,
				"message":   message,
				"timestamp": time.Now().UTC().Format(time.RFC3339),
				"expiresIn": 300,
			})
		})

		// Verify endpoint
		e.Router.POST("/api/auth/siwe/verify", func(re *core.RequestEvent) error {
			var body struct {
				Address   string `json:"address"`
				Signature string `json:"signature"`
				Name      string `json:"name"`
			}
			if err := re.BindBody(&body); err != nil {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
			}

			address := strings.ToLower(body.Address)

			// Verify signature
			sigBytes, err := hex.DecodeString(strings.TrimPrefix(body.Signature, "0x"))
			if err != nil {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid signature format"})
			}

			if len(sigBytes) != 65 {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid signature length"})
			}

			if sigBytes[64] >= 27 {
				sigBytes[64] -= 27
			}

			// Find matching nonce
			var matchedNonce string
			store.RLock()
			for nonce, entry := range store.nonces {
				if entry.address == address && time.Now().Before(entry.expiresAt) {
					message := fmt.Sprintf("Sign in to OracleNet\n\nNonce: %s\nAddress: %s\nTimestamp: %s",
						nonce, address, entry.expiresAt.Add(-5*time.Minute).UTC().Format(time.RFC3339))
					messageHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)))

					pubKey, err := crypto.SigToPub(messageHash.Bytes(), sigBytes)
					if err == nil {
						recoveredAddr := crypto.PubkeyToAddress(*pubKey)
						if strings.EqualFold(recoveredAddr.Hex(), body.Address) {
							matchedNonce = nonce
							break
						}
					}
				}
			}
			store.RUnlock()

			if matchedNonce == "" {
				return re.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid signature or expired nonce"})
			}

			store.delete(matchedNonce)

			// Find or create human
			human, err := app.FindFirstRecordByFilter("humans", fmt.Sprintf("wallet_address = '%s'", address))
			created := false

			if err != nil {
				// Create new human
				collection, _ := app.FindCollectionByNameOrId("humans")
				human = core.NewRecord(collection)
				human.Set("wallet_address", address)
				human.Set("email", fmt.Sprintf("%s@wallet.oraclenet", address))
				if body.Name != "" {
					human.Set("display_name", body.Name)
				}

				human.SetPassword(generateNonce())

				if err := app.Save(human); err != nil {
					return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create human"})
				}
				created = true
			}

			// Generate auth token
			token, err := human.NewAuthToken()
			if err != nil {
				return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to generate token"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"success": true,
				"created": created,
				"token":   token,
				"human": map[string]any{
					"id":              human.Id,
					"wallet_address":  human.GetString("wallet_address"),
					"display_name":    human.GetString("display_name"),
					"github_username": human.GetString("github_username"),
				},
			})
		})

		// Check endpoint
		e.Router.GET("/api/auth/siwe/check", func(re *core.RequestEvent) error {
			address := strings.ToLower(re.Request.URL.Query().Get("address"))
			if !common.IsHexAddress(address) {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid address"})
			}

			human, err := app.FindFirstRecordByFilter("humans", fmt.Sprintf("wallet_address = '%s'", address))
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{
					"registered": false,
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"registered": true,
				"human": map[string]any{
					"id":             human.Id,
					"wallet_address": human.GetString("wallet_address"),
					"display_name":   human.GetString("display_name"),
				},
			})
		})

		return e.Next()
	})
}
