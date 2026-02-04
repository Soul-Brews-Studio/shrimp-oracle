package hooks

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	siwe "github.com/spruceid/siwe-go"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

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

// verifySIWE verifies a SIWE signature locally using siwe-go
func verifySIWE(message, signature string, price float64) (*SiwerVerifyResponse, error) {
	// 1. Parse SIWE message
	siweMsg, err := siwe.ParseMessage(message)
	if err != nil {
		return nil, fmt.Errorf("invalid SIWE message: %w", err)
	}

	// 2. Verify signature (recovers address and checks)
	_, err = siweMsg.Verify(signature, nil, nil, nil)
	if err != nil {
		return &SiwerVerifyResponse{
			Verified: false,
			Error:    err.Error(),
		}, nil
	}

	// 3. Build ProofOfTime from price parameter
	now := time.Now()
	proofOfTime := &struct {
		Feed           string `json:"feed"`
		RoundID        string `json:"roundId"`
		Price          int64  `json:"price"`
		PriceFormatted string `json:"priceFormatted"`
		Timestamp      int64  `json:"timestamp"`
		TimestampISO   string `json:"timestampISO"`
		Summary        string `json:"summary"`
	}{
		Feed:           "BTC/USD",
		RoundID:        siweMsg.GetNonce(),
		Price:          int64(price * 100), // cents
		PriceFormatted: fmt.Sprintf("$%.2f", price),
		Timestamp:      now.Unix(),
		TimestampISO:   now.UTC().Format(time.RFC3339),
		Summary:        fmt.Sprintf("BTC was $%.2f at sign-in", price),
	}

	// 4. Return success response
	return &SiwerVerifyResponse{
		Verified:    true,
		Address:     siweMsg.GetAddress().Hex(),
		ChainID:     siweMsg.GetChainID(),
		Domain:      siweMsg.GetDomain(),
		IssuedAt:    siweMsg.GetIssuedAt(),
		ProofOfTime: proofOfTime,
	}, nil
}

// RegisterSIWE sets up SIWE authentication routes for both realms
// Note: /nonce endpoint removed - client calls Chainlink directly via viem
func RegisterSIWE(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// ========== AGENT AUTH ==========

		e.Router.POST("/api/auth/agents/verify", func(re *core.RequestEvent) error {
			var body struct {
				Message   string  `json:"message"`
				Signature string  `json:"signature"`
				Price     float64 `json:"price"`
				Name      string  `json:"name"`
			}
			if err := re.BindBody(&body); err != nil {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
			}

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
				collection, _ := app.FindCollectionByNameOrId("agents")
				agent = core.NewRecord(collection)
				agent.Set("wallet_address", address)
				agent.Set("email", fmt.Sprintf("%s@agent.oracle.universe", address))
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

			token, err := agent.NewAuthToken()
			if err != nil {
				return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to generate token"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"success":     true,
				"created":     created,
				"realm":       "agents",
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

		e.Router.GET("/api/auth/agents/check", func(re *core.RequestEvent) error {
			address := strings.ToLower(re.Request.URL.Query().Get("address"))
			if address == "" {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Address required"})
			}

			agent, err := app.FindFirstRecordByFilter("agents", fmt.Sprintf("wallet_address = '%s'", address))
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{"registered": false, "realm": "agents"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"registered": true,
				"realm":      "agents",
				"agent": map[string]any{
					"id":             agent.Id,
					"wallet_address": agent.GetString("wallet_address"),
					"display_name":   agent.GetString("display_name"),
					"verified":       agent.GetBool("verified"),
				},
			})
		})

		// ========== HUMAN AUTH ==========

		e.Router.POST("/api/auth/humans/verify", func(re *core.RequestEvent) error {
			var body struct {
				Message   string  `json:"message"`
				Signature string  `json:"signature"`
				Price     float64 `json:"price"`
				Name      string  `json:"name"`
			}
			if err := re.BindBody(&body); err != nil {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
			}

			verified, err := verifySIWE(body.Message, body.Signature, body.Price)
			if err != nil {
				return re.JSON(http.StatusBadGateway, map[string]string{"error": err.Error()})
			}

			if !verified.Verified {
				return re.JSON(http.StatusUnauthorized, map[string]string{"error": verified.Error})
			}

			address := strings.ToLower(verified.Address)

			// Find or create human
			human, err := app.FindFirstRecordByFilter("humans", fmt.Sprintf("wallet_address = '%s'", address))
			created := false

			if err != nil {
				collection, _ := app.FindCollectionByNameOrId("humans")
				human = core.NewRecord(collection)
				human.Set("wallet_address", address)
				human.Set("email", fmt.Sprintf("%s@human.oracle.universe", address))
				if body.Name != "" {
					human.Set("display_name", body.Name)
				}
				human.SetPassword(generatePassword())

				if err := app.Save(human); err != nil {
					return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create human"})
				}
				created = true
			}

			token, err := human.NewAuthToken()
			if err != nil {
				return re.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to generate token"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"success":     true,
				"created":     created,
				"realm":       "humans",
				"token":       token,
				"proofOfTime": verified.ProofOfTime,
				"human": map[string]any{
					"id":              human.Id,
					"wallet_address":  human.GetString("wallet_address"),
					"display_name":    human.GetString("display_name"),
					"github_username": human.GetString("github_username"),
				},
			})
		})

		e.Router.GET("/api/auth/humans/check", func(re *core.RequestEvent) error {
			address := strings.ToLower(re.Request.URL.Query().Get("address"))
			if address == "" {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Address required"})
			}

			human, err := app.FindFirstRecordByFilter("humans", fmt.Sprintf("wallet_address = '%s'", address))
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{"registered": false, "realm": "humans"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"registered": true,
				"realm":      "humans",
				"human": map[string]any{
					"id":             human.Id,
					"wallet_address": human.GetString("wallet_address"),
					"display_name":   human.GetString("display_name"),
				},
			})
		})

		// ========== UNIFIED CHECK ==========

		// Check both realms at once
		e.Router.GET("/api/auth/check", func(re *core.RequestEvent) error {
			address := strings.ToLower(re.Request.URL.Query().Get("address"))
			if address == "" {
				return re.JSON(http.StatusBadRequest, map[string]string{"error": "Address required"})
			}

			result := map[string]any{
				"address": address,
				"agent":   nil,
				"human":   nil,
			}

			if agent, err := app.FindFirstRecordByFilter("agents", fmt.Sprintf("wallet_address = '%s'", address)); err == nil {
				result["agent"] = map[string]any{
					"id":           agent.Id,
					"display_name": agent.GetString("display_name"),
					"reputation":   agent.GetInt("reputation"),
				}
			}

			if human, err := app.FindFirstRecordByFilter("humans", fmt.Sprintf("wallet_address = '%s'", address)); err == nil {
				result["human"] = map[string]any{
					"id":           human.Id,
					"display_name": human.GetString("display_name"),
				}
			}

			return re.JSON(http.StatusOK, result)
		})

		return e.Next()
	})
}
