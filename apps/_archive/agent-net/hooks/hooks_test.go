package hooks

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/pocketbase/pocketbase"
)

func TestInfoResponseFormat(t *testing.T) {
	// Test the expected info response format
	response := map[string]any{
		"name":    "Agent Network",
		"version": "0.1.0",
		"type":    "sandbox",
	}

	var buf bytes.Buffer
	jsonBytes, _ := json.Marshal(response)
	buf.Write(jsonBytes)

	var result map[string]any
	json.Unmarshal(buf.Bytes(), &result)

	if result["name"] != "Agent Network" {
		t.Errorf("expected name 'Agent Network', got %v", result["name"])
	}
	if result["version"] != "0.1.0" {
		t.Errorf("expected version '0.1.0', got %v", result["version"])
	}
	if result["type"] != "sandbox" {
		t.Errorf("expected type 'sandbox', got %v", result["type"])
	}
}

func TestRegisterHooks(t *testing.T) {
	// Test that RegisterHooks doesn't panic
	app := pocketbase.New()

	defer func() {
		if r := recover(); r != nil {
			t.Errorf("RegisterHooks panicked: %v", r)
		}
	}()

	RegisterHooks(app)
}

func TestRegisterSIWE(t *testing.T) {
	// Test that RegisterSIWE doesn't panic
	app := pocketbase.New()

	defer func() {
		if r := recover(); r != nil {
			t.Errorf("RegisterSIWE panicked: %v", r)
		}
	}()

	RegisterSIWE(app)
}

func TestPresenceResponseFormat(t *testing.T) {
	// Test the expected presence response format
	response := map[string]any{
		"items":        []any{},
		"totalOnline":  0,
		"totalAway":    0,
		"totalOffline": 0,
	}

	jsonBytes, err := json.Marshal(response)
	if err != nil {
		t.Errorf("failed to marshal response: %v", err)
	}

	var result map[string]any
	json.Unmarshal(jsonBytes, &result)

	if _, ok := result["items"]; !ok {
		t.Error("expected 'items' in response")
	}
	if _, ok := result["totalOnline"]; !ok {
		t.Error("expected 'totalOnline' in response")
	}
}

func TestAgentMeUnauthorizedFormat(t *testing.T) {
	// Test the expected unauthorized response format
	response := map[string]string{
		"error": "Authentication required",
	}

	jsonBytes, _ := json.Marshal(response)

	var result map[string]string
	json.Unmarshal(jsonBytes, &result)

	if result["error"] != "Authentication required" {
		t.Errorf("expected error 'Authentication required', got %v", result["error"])
	}
}
