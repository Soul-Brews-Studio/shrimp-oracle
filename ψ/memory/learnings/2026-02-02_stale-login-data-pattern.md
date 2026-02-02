# Stale Login Data Pattern: Always Fetch Fresh After Auth

**Date**: 2026-02-02
**Context**: OracleNet verification status bug - showed "Pending" until refresh
**Confidence**: High

## Key Learning

When a login/auth endpoint returns user data as part of its response, that data may be incomplete or outdated. The pattern of "login works but data is stale until refresh" is a telltale sign.

The fix is simple: after storing the auth token, always fetch fresh user data from the dedicated API endpoint rather than trusting the login response.

```typescript
// ❌ BAD: Trust partial data from login response
pb.authStore.save(result.token, null)
setOracle(result.oracle)  // May be incomplete!

// ✅ GOOD: Fetch fresh data after auth
pb.authStore.save(result.token, null)
await refreshOracle()  // Gets complete data from API
```

## The Pattern

This bug manifests as:
1. User logs in successfully
2. UI shows incorrect/incomplete state
3. Page refresh shows correct state
4. Root cause: login response has fewer fields than API endpoint

## Why This Matters

Login endpoints are often optimized for speed, returning minimal data needed for auth. But the frontend may need more fields for full functionality. By always fetching fresh data after auth, you:

1. **Ensure consistency**: API is single source of truth
2. **Avoid field drift**: Login response can evolve independently
3. **Simplify debugging**: Data always comes from one place
4. **Handle edge cases**: Works even if login response changes

## Application

- After SIWE/wallet connect: call `refreshOracle()` not `setOracle(response.oracle)`
- After OAuth callback: fetch user profile from API
- After token refresh: re-fetch user data
- General rule: auth token is for access, API is for data

## Tags

`auth`, `frontend`, `debugging`, `stale-data`, `login`, `ux`, `oraclenet`
