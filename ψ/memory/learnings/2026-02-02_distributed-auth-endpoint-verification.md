# Distributed Auth Systems: Verify Endpoint Ownership Before URL Changes

**Date**: 2026-02-02
**Context**: OracleNet login fix - switching SIWE auth from Cloudflare Worker to PocketBase
**Confidence**: High

## Key Learning

When working with distributed authentication systems (multiple workers, backends, or microservices), always verify which system owns each endpoint before changing URLs. A seemingly simple URL change can break functionality if endpoints are split across systems.

In this session, changing `SIWER_URL` to point to PocketBase worked for basic SIWE (`/nonce`, `/verify`) because PocketBase has those routes built in. But `/verify-identity` is a custom Siwer-only endpoint that handles GitHub verification - it doesn't exist in PocketBase. Blindly changing all URLs would have broken the identity verification flow.

The key insight is that different auth systems often have overlapping capabilities (both can do SIWE) but also unique features (only Siwer does GitHub verification). Understanding this topology is essential before making changes.

## The Pattern

```typescript
// BAD: Single URL for everything assumes all endpoints exist everywhere
const AUTH_URL = 'https://backend.example.com'
fetch(`${AUTH_URL}/nonce`)       // Works
fetch(`${AUTH_URL}/verify`)      // Works
fetch(`${AUTH_URL}/custom-flow`) // BROKEN - endpoint doesn't exist here

// GOOD: Separate URLs for different capability domains
const BASIC_AUTH_URL = 'https://pocketbase.example.com'  // Has built-in SIWE
const GITHUB_VERIFY_URL = 'https://worker.example.com'   // Has GitHub APIs

fetch(`${BASIC_AUTH_URL}/api/auth/siwe/nonce`)     // PocketBase handles
fetch(`${BASIC_AUTH_URL}/api/auth/siwe/verify`)    // PocketBase handles
fetch(`${GITHUB_VERIFY_URL}/verify-identity`)       // Worker handles GitHub
```

## Why This Matters

- **Prevents silent failures**: URL changes might return 404s or unexpected behavior
- **Maintains separation of concerns**: Each system does what it's good at
- **Enables gradual migration**: Can move endpoints one at a time without breaking everything
- **Documents architecture**: Explicit URL constants make the system topology visible

## Application

Before changing authentication URLs:
1. List all endpoints currently being called
2. Verify which system(s) implement each endpoint
3. Group endpoints by capability domain
4. Use separate constants for different domains
5. Test each endpoint after changes

## Tags

`authentication`, `siwe`, `distributed-systems`, `pocketbase`, `cloudflare-workers`, `debugging`
