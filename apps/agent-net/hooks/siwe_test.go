package hooks

import (
	"testing"
	"time"
)

func TestGenerateNonce(t *testing.T) {
	nonce1 := generateNonce()
	nonce2 := generateNonce()

	// Should be 32 hex characters (16 bytes)
	if len(nonce1) != 32 {
		t.Errorf("expected nonce length 32, got %d", len(nonce1))
	}

	// Should be unique
	if nonce1 == nonce2 {
		t.Error("expected unique nonces, got duplicates")
	}
}

func TestNonceStore_SetAndGet(t *testing.T) {
	s := &nonceStore{
		nonces: make(map[string]nonceEntry),
	}

	address := "0x1234567890abcdef1234567890abcdef12345678"
	nonce := "testnonce123"

	s.set(nonce, address)

	got, ok := s.get(nonce)
	if !ok {
		t.Error("expected to find nonce")
	}
	if got != address {
		t.Errorf("expected address %s, got %s", address, got)
	}
}

func TestNonceStore_GetExpired(t *testing.T) {
	s := &nonceStore{
		nonces: make(map[string]nonceEntry),
	}

	// Manually insert expired nonce
	s.Lock()
	s.nonces["expired"] = nonceEntry{
		address:   "0xabc",
		expiresAt: time.Now().Add(-1 * time.Minute), // Already expired
	}
	s.Unlock()

	_, ok := s.get("expired")
	if ok {
		t.Error("expected expired nonce to not be found")
	}
}

func TestNonceStore_GetNotFound(t *testing.T) {
	s := &nonceStore{
		nonces: make(map[string]nonceEntry),
	}

	_, ok := s.get("nonexistent")
	if ok {
		t.Error("expected nonexistent nonce to not be found")
	}
}

func TestNonceStore_Delete(t *testing.T) {
	s := &nonceStore{
		nonces: make(map[string]nonceEntry),
	}

	s.set("todelete", "0xabc")

	// Verify it exists
	_, ok := s.get("todelete")
	if !ok {
		t.Error("expected nonce to exist before delete")
	}

	s.delete("todelete")

	// Verify it's gone
	_, ok = s.get("todelete")
	if ok {
		t.Error("expected nonce to be deleted")
	}
}

func TestNonceStore_Concurrent(t *testing.T) {
	s := &nonceStore{
		nonces: make(map[string]nonceEntry),
	}

	done := make(chan bool)

	// Concurrent writes
	for i := 0; i < 100; i++ {
		go func(n int) {
			nonce := generateNonce()
			s.set(nonce, "0xabc")
			s.get(nonce)
			s.delete(nonce)
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 100; i++ {
		<-done
	}
}
