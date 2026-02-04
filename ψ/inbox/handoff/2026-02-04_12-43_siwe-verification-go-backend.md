# Handoff: Move SIWE Verification to Go Backend

**Date**: 2026-02-04 12:43
**Branch**: agents/1

## What We Did

- ✅ Landing page final polish - hide scrollbar on scroll-snap slideshow
- ✅ Committed all changes (103 files - unified architecture + archive)
- ✅ RRR with lesson learned: "Reuse existing CSS utilities"
- ✅ Traced siwe-service usage with /trace --deep
- ✅ Documented backend architecture (hooks.go, siwe.go)

## Key Discovery

**siwe-service.laris.workers.dev** is only used for:
- `/verify` endpoint - signature verification + proofOfTime generation
- `/nonce` is NOT used anymore (we use BTC price from Chainlink directly)

**Current Flow**:
```
Frontend → Chainlink (BTC price) → Sign with wallet
         → Backend /api/auth/*/verify
         → External siwe-service /verify (HTTP call)
         → Return token
```

**Problem**: External dependency = single point of failure

## Pending

- [ ] Move SIWE signature verification to Go backend
- [ ] Remove external siwe-service dependency
- [ ] Keep ProofOfTime generation (BTC price timestamp)

## Next Session

- [ ] Research Go SIWE libraries (go-ethereum, siwe-go)
- [ ] Implement `verifySIWE()` locally in hooks/siwe.go
- [ ] Remove HTTP call to siwe-service.laris.workers.dev
- [ ] Update AuthContext.tsx if needed (domain field)
- [ ] Test login flow still works

## Key Files

- `apps/oracle-universe/hooks/siwe.go` - Current SIWE implementation (calls external)
- `apps/oracle-universe/web/src/contexts/AuthContext.tsx` - Frontend auth flow
- `apps/oracle-universe/web/src/lib/api.ts` - API helpers

## Technical Notes

### Current siwe.go structure
```go
const siwerURL = "https://siwe-service.laris.workers.dev"

func verifySIWE(message, signature string, price float64) (*SiwerVerifyResponse, error) {
    // HTTP POST to external service
    resp, err := http.Post(siwerURL+"/verify", ...)
}
```

### What we need
```go
import "github.com/spruceid/siwe-go" // or similar

func verifySIWE(message, signature string, price float64) (*SiwerVerifyResponse, error) {
    // Local signature verification
    siweMsg, _ := siwe.ParseMessage(message)
    valid, _ := siweMsg.Verify(signature, nil, nil, nil)
    // Build proofOfTime from price parameter
}
```

### ProofOfTime
Frontend already sends BTC price - we just need to format it:
```go
ProofOfTime: {
    Feed: "BTC/USD",
    Price: price,
    Timestamp: time.Now().Unix(),
    Summary: fmt.Sprintf("BTC was $%.2f at sign-in", price)
}
```

## Reference

- Trace results: Oracle search + 5 parallel agents explored
- Backend overview in this session
- Retrospective: `ψ/memory/retrospectives/2026-02/04/12.36_landing-page-final-polish-scrollbar.md`
