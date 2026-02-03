package hooks

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

const siwerURL = "https://siwe-service.laris.workers.dev"

// SiwerVerifyResponse is the response from siwe-service /verify
type SiwerVerifyResponse struct {
	Verified    bool   `json:"verified"`
	Address     string `json:"address"`
	ChainID     int    `json:"chainId"`
	Domain      string `json:"domain"`
	IssuedAt    string `json:"issuedAt"`
	Error       string `json:"error,omitempty"`
	ProofOfTime *struct {
		Feed           string `json:"feed"`
		RoundID        string `json:"roundId"`
		Price          int64  `json:"price"`
		PriceFormatted string `json:"priceFormatted"`
		Timestamp      int64  `json:"timestamp"`
		TimestampISO   string `json:"timestampISO"`
		Summary        string `json:"summary"`
	} `json:"proofOfTime,omitempty"`
}

func generatePassword() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// verifySIWE calls the shared siwe-service to verify signature
func verifySIWE(message, signature string, price float64) (*SiwerVerifyResponse, error) {
	payload := map[string]any{
		"message":   message,
		"signature": signature,
		"price":     price,
	}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(siwerURL+"/verify", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to call siwer: %w", err)
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	var result SiwerVerifyResponse
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse siwer response: %w", err)
	}

	return &result, nil
}

// RegisterSIWE sets up SIWE authentication routes using shared siwer service
func RegisterSIWE(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Nonce endpoint - proxy to siwer /nonce
		e.Router.GET("/api/auth/siwe/nonce", func(re *core.RequestEvent) error {
			resp, err := http.Get(siwerURL + "/nonce")
			if err != nil {
				return re.JSON(http.StatusBadGateway, map[string]string{"error": "Failed to get nonce"})
			}
			defer resp.Body.Close()

			data, _ := io.ReadAll(resp.Body)
			var result map[string]any
			json.Unmarshal(data, &result)

			return re.JSON(http.StatusOK, result)
		})

		// Verify endpoint - verify via siwer, then create/find agent
		e.Router.POST("/api/auth/siwe/verify", func(re *core.RequestEvent) error {
			var body struct {
				Message   string  `json:"message"`
				Signature string  `json:"signature"`
				Price     float64 `json:"price"`
				Name      string  `json:"name"`
			}
			if err := re.BindBody(&body); err != nil {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
			}

			// Verify via shared siwer service
			verified, err := verifySIWE(body.Message, body.Signature, body.Price)
			if err != nil {
				return re.JSON(http.StatusBadGateway, map[string]string{"error": err.Error()})
			}

			if !verified.Verified {
				return re.JSON(http.StatusUnauthorized, map[string]string{"error": verified.Error})
			}

			address := strings.ToLower(verified.Address)

			// Find or create agent
			agent, err := app.FindFirstRecordByFilter("agents", fmt.Sprintf("wallet_address = '%s'", address))
			created := false

			if err != nil {
				// Create new agent
				collection, _ := app.FindCollectionByNameOrId("agents")
				agent = core.NewRecord(collection)
				agent.Set("wallet_address", address)
				agent.Set("email", fmt.Sprintf("%s@wallet.agentnet", address))
				agent.Set("reputation", 0)
				agent.Set("verified", false)
				if body.Name != "" {
					agent.Set("display_name", body.Name)
				}

				agent.SetPassword(generatePassword())

				if err := app.Save(agent); err != nil {
					return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create agent"})
				}
				created = true
			}

			// Generate auth token
			token, err := agent.NewAuthToken()
			if err != nil {
				return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to generate token"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"success":     true,
				"created":     created,
				"token":       token,
				"proofOfTime": verified.ProofOfTime,
				"agent": map[string]any{
					"id":             agent.Id,
					"wallet_address": agent.GetString("wallet_address"),
					"display_name":   agent.GetString("display_name"),
					"reputation":     agent.GetInt("reputation"),
					"verified":       agent.GetBool("verified"),
				},
			})
		})

		// Check endpoint
		e.Router.GET("/api/auth/siwe/check", func(re *core.RequestEvent) error {
			address := strings.ToLower(re.Request.URL.Query().Get("address"))
			if address == "" {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Address required"})
			}

			agent, err := app.FindFirstRecordByFilter("agents", fmt.Sprintf("wallet_address = '%s'", address))
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{
					"registered": false,
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"registered": true,
				"agent": map[string]any{
					"id":             agent.Id,
					"wallet_address": agent.GetString("wallet_address"),
					"display_name":   agent.GetString("display_name"),
					"verified":       agent.GetBool("verified"),
				},
			})
		})

		return e.Next()
	})
}
