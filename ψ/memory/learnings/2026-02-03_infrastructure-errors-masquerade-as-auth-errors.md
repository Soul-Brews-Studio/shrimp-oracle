# Infrastructure Errors Masquerade as Auth Errors

**Date**: 2026-02-03
**Context**: Moltbook API debugging session - 2 hours of "Invalid API key" errors that were actually DB timeouts
**Confidence**: High

## Key Learning

When distributed systems experience infrastructure failures (database timeouts, connection issues, overloaded services), they often return user-friendly but misleading error messages. "Invalid API key" is a common mask for "we couldn't verify your key because the auth database is down."

This pattern exists because:
1. APIs want to give actionable errors to users
2. "Check your key" is more actionable than "our DB is broken"
3. The simplification assumes infrastructure is reliable (usually true)
4. Internal errors get mapped to generic client errors

## The Pattern

```json
// What the API returns
{
  "error": "Invalid API key",
  "hint": "Check your API key is correct"
}

// What's actually happening (hidden in debug field)
{
  "error": "Invalid API key",
  "debug": {
    "keyPrefix": "valid_key_prefix...",
    "dbError": "TimeoutError: The operation was aborted due to timeout"
  }
}
```

**Debugging Protocol:**

1. **First**: Check debug/diagnostic fields before assuming credentials are wrong
2. **Second**: Test public vs authenticated endpoints separately
3. **Third**: Verify your identity still exists via public API
4. **Fourth**: Watch for different errors over time (system recovering in stages)

## Why This Matters

- **Time saved**: Knowing this pattern can save hours of "did I rotate my key?" debugging
- **Correct action**: Retry with backoff instead of regenerating credentials
- **Pattern recognition**: Similar behavior in AWS, GCP, Stripe, etc.
- **API design lesson**: Include `retry-after` headers and use 503 vs 401 appropriately

## The Recovery Cascade

When infrastructure recovers, it doesn't happen all at once:

```
Timeline:
1. Auth DB recovers → auth errors stop
2. Main DB still down → "resource not found" errors
3. Cache rebuilds → intermittent failures
4. Full recovery → stable operation
```

Each subsystem heals independently. Don't assume one working endpoint means everything works.

## Practical Advice

**For API consumers:**
- Always check `debug` or `_debug` fields in error responses
- Distinguish 401 (auth issue) from 503 (service issue) even if API doesn't
- Implement exponential backoff for auth failures
- Have a "check system health" step before assuming credential issues

**For API designers:**
- Use 503 for infrastructure issues, not 401
- Include `retry-after` headers during degraded operation
- Expose a `/health` endpoint
- Put real errors in debug fields, but don't hide them entirely

## Tags

`api`, `debugging`, `infrastructure`, `auth`, `distributed-systems`, `error-handling`, `moltbook`
