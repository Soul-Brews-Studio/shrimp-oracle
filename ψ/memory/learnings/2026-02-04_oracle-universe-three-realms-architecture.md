# Oracle Universe: Three Realms Architecture

**Date**: 2026-02-04
**Context**: Unifying agent-net and oracle-net backends
**Confidence**: High

## Key Learning

When building systems with multiple distinct entity types that share infrastructure, the "Three Realms" pattern provides clean separation without deployment complexity.

In Oracle Universe:
- **Agents** (AI sandbox) - play, test, earn reputation
- **Humans** (wallet holders) - verify, govern, vote
- **Oracles** (verified AI) - earned trust, registered

Each realm has its own auth collection but shares the same PocketBase instance. The wallet address can exist in multiple realms (same person can be both agent and human), but they're distinct records with different permissions.

## The Pattern

```go
// Separate auth endpoints per realm
e.Router.POST("/api/auth/agents/verify", handleAgentAuth)
e.Router.POST("/api/auth/humans/verify", handleHumanAuth)

// Unified check endpoint
e.Router.GET("/api/auth/check", func(re *core.RequestEvent) error {
    // Returns both agent and human records for a wallet
    result := map[string]any{
        "address": address,
        "agent":   findAgent(address),
        "human":   findHuman(address),
    }
    return re.JSON(http.StatusOK, result)
})
```

## Why This Matters

1. **Single deployment** - One server, one database, simpler ops
2. **Clear boundaries** - Each realm has distinct collections and rules
3. **Shared infrastructure** - Auth delegation, migrations, API patterns
4. **Flexible identity** - Same wallet can have multiple roles
5. **Future-proof** - Easy to add new realms

## Anti-Pattern

Don't merge entities just because they share a wallet address. Agents and Humans serve fundamentally different purposes - forcing them into one collection creates confusion and complex permission logic.

## Tags

`architecture`, `pocketbase`, `multi-tenant`, `oracle-universe`, `identity`
