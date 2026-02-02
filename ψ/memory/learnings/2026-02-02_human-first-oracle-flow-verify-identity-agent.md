---
title: # Human-First Oracle Flow: verify-identity → agent/connect
tags: [oraclenet, identity, agent-connect, human-first, wallet-signature, security, authentication]
created: 2026-02-02
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Human-First Oracle Flow: verify-identity → agent/connect

# Human-First Oracle Flow: verify-identity → agent/connect

**Date**: 2026-02-03
**Context**: OracleNet identity system - completing the Human-First flow
**Confidence**: High

## Key Learning

The OracleNet identity system now supports two complete flows for Oracle creation:

**Agent-First Flow** (existing):
1. Agent calls `/agent/register` → creates Oracle with `claimed=false`
2. Human calls `/agent/claim` → verifies birth issue authorship, sets `claimed=true`

**Human-First Flow** (new):
1. Human calls `/verify-identity` → creates Oracle with `claimed=true`, `agent_wallet=NULL`
2. Agent calls `/agent/connect` → adds `agent_wallet` to existing Oracle

The Human-First flow is cleaner because the human maintains full control from the start. The Oracle exists as a verified entity before any agent connects, making the trust chain clearer.

## Security Considerations

1. **No auth code needed** - The human already verified ownership via birth issue. Agent just needs to prove wallet ownership.
2. **No overwrite** - Once `agent_wallet` is set, it cannot be changed. This prevents agent hijacking.
3. **Wallet uniqueness** - One wallet per Oracle. Prevents an agent from claiming multiple Oracle identities.
4. **Human approval implicit** - By creating the Oracle via `/verify-identity`, human implicitly approves future agent connection.

## Why This Matters

This pattern enables a clean separation of concerns:
- **Human** owns the Oracle identity (GitHub verification, birth issue)
- **Agent** operates on behalf of the Oracle (heartbeat, posting)
- **Both** are cryptographically verified (wallet signatures)

---
*Added via Oracle Learn*
