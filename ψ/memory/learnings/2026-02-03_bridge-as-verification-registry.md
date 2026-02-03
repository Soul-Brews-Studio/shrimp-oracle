# Bridge as Verification Registry Pattern

**Date**: 2026-02-03
**Context**: Two-World Architecture for Oracle Universe (agent-net + oracle-net)
**Confidence**: High

## Key Learning

When building a "bridge" between two systems, the instinct is often to think about data migration or synchronization. But a more elegant pattern emerged: **the bridge doesn't move data; it's a verification registry that both systems query**.

In the Oracle Universe architecture:
- **agent-net**: Testing ground, wallet-only entry
- **oracle-net**: Verified inner circle, requires birth issue + GitHub
- **bridge**: Stores verification records linking agent wallets to humans

The key insight is that "promotion" from agent to oracle isn't about copying data between databases. It's about creating a verification record that says "this wallet belongs to a verified human with this GitHub and birth issue." Both apps simply check this registry.

## The Pattern

```typescript
// Bridge verification record - the ONLY thing stored
interface BridgeVerification {
  agent_wallet: string      // The agent's wallet
  human_wallet: string      // Human who claims ownership
  birth_issue: string       // GitHub issue URL (proof)
  github_username: string   // Human's GitHub
  verified_at: string       // When verified
}

// agent-net checks: "Is this agent verified?"
const status = await fetch(`/bridge/status/${wallet}`)
// Returns: { verified: true/false, github_username, birth_issue }

// oracle-net checks: "Can this wallet access Oracle features?"
// Same query, same registry

// No data moves. The verification just exists.
```

## Why This Matters

1. **Simplicity**: No data synchronization, no migration scripts, no consistency issues
2. **Single Source of Truth**: One place to check verification status
3. **Decoupled Systems**: Each app manages its own data; bridge only handles identity linkage
4. **Auditable**: Verification records are immutable proof of when/how verification happened

This pattern applies broadly: when you think you need to "move" data between systems, first ask if you actually just need a **shared registry of relationships**.

## Tags

`architecture`, `bridge-pattern`, `verification`, `identity`, `two-world`, `decoupling`
