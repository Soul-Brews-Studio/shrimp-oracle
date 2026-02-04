package hooks

import (
	"encoding/json"
	"testing"
)

func TestGeneratePassword(t *testing.T) {
	pw1 := generatePassword()
	pw2 := generatePassword()

	// Should be 32 hex characters (16 bytes)
	if len(pw1) != 32 {
		t.Errorf("expected password length 32, got %d", len(pw1))
	}

	// Should be unique
	if pw1 == pw2 {
		t.Error("expected unique passwords, got duplicates")
	}
}

func TestSiwerVerifyResponseParsing(t *testing.T) {
	// Test parsing a successful response
	jsonData := `{
		"verified": true,
		"address": "0x1234567890abcdef1234567890abcdef12345678",
		"chainId": 1,
		"domain": "siwe-service.laris.workers.dev",
		"issuedAt": "2026-02-03T12:00:00.000Z",
		"proofOfTime": {
			"feed": "BTC/USD",
			"roundId": "110680464442257330541",
			"price": 9800000000000,
			"priceFormatted": "$98,000",
			"timestamp": 1738584000,
			"timestampISO": "2026-02-03T12:00:00.000Z",
			"summary": "Signed when BTC was $98,000"
		}
	}`

	var resp SiwerVerifyResponse
	err := json.Unmarshal([]byte(jsonData), &resp)
	if err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if !resp.Verified {
		t.Error("expected verified to be true")
	}
	if resp.Address != "0x1234567890abcdef1234567890abcdef12345678" {
		t.Errorf("unexpected address: %s", resp.Address)
	}
	if resp.ChainID != 1 {
		t.Errorf("expected chainId 1, got %d", resp.ChainID)
	}
	if resp.ProofOfTime == nil {
		t.Error("expected proofOfTime to be present")
	}
	if resp.ProofOfTime.Feed != "BTC/USD" {
		t.Errorf("unexpected feed: %s", resp.ProofOfTime.Feed)
	}
	if resp.ProofOfTime.PriceFormatted != "$98,000" {
		t.Errorf("unexpected priceFormatted: %s", resp.ProofOfTime.PriceFormatted)
	}
}

func TestSiwerVerifyResponseError(t *testing.T) {
	// Test parsing an error response
	jsonData := `{
		"verified": false,
		"error": "Invalid signature"
	}`

	var resp SiwerVerifyResponse
	err := json.Unmarshal([]byte(jsonData), &resp)
	if err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if resp.Verified {
		t.Error("expected verified to be false")
	}
	if resp.Error != "Invalid signature" {
		t.Errorf("unexpected error: %s", resp.Error)
	}
	if resp.ProofOfTime != nil {
		t.Error("expected proofOfTime to be nil on error")
	}
}

func TestSiwerURL(t *testing.T) {
	if siwerURL != "https://siwe-service.laris.workers.dev" {
		t.Errorf("unexpected siwerURL: %s", siwerURL)
	}
}
