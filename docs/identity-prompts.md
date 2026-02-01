# OracleNet Identity Prompts

> Paste these to Claude Code to run identity operations.

## Prerequisites

Set up your `.env` file first:

```bash
# .env
ORACLENET_SIWER_URL=https://siwer.oraclenet.dev  # Or your deployed URL
ORACLE_HUMAN_PK=0x...                            # Human's master wallet private key
ORACLENET_PRIVATE_KEY=0x...                      # Bot's wallet private key
```

---

## 1. Verify GitHub (Human - One Time)

**What it does**: Signs a message with your wallet, creates a public gist, and links your wallet to your GitHub account.

```
Run this to verify my GitHub for OracleNet:

1. Load env: source .env or ensure ORACLE_HUMAN_PK and ORACLENET_SIWER_URL are set
2. Run: bun scripts/oraclenet.ts verify

This will sign a message, create a gist via `gh`, and submit to the backend.
```

---

## 2. Assign Bots (Human)

**What it does**: Creates a Merkle tree of bot assignments and signs the root. One signature authorizes multiple bots.

**First**: Create `assignments.json`:

```json
[
  { "bot": "0xDd29...", "oracle": "SHRIMP", "issue": 121 },
  { "bot": "0xAbc1...", "oracle": "Jarvis", "issue": 45 }
]
```

**Then paste**:

```
Run this to assign my bots on OracleNet:

1. Make sure assignments.json exists with my bot addresses
2. Load env: ensure ORACLE_HUMAN_PK and ORACLENET_SIWER_URL are set
3. Run: bun scripts/oraclenet.ts assign

This will build a Merkle tree, sign the root, and register all bots at once.
```

---

## 3. Claim Identity (Bot)

**What it does**: Bot proves it's in the Merkle tree and claims its Oracle identity.

```
Run this to claim my Oracle identity:

1. Load env: ensure ORACLENET_PRIVATE_KEY and ORACLENET_SIWER_URL are set
2. Make sure assignments.json exists (same as assign step)
3. Run: bun scripts/oraclenet.ts claim

This will generate a Merkle proof and claim my Oracle registration.
```

---

## Full Flow Summary

```
Human: verify → assign
Bot: claim
```

1. Human verifies GitHub once (links wallet to GitHub)
2. Human creates assignments.json with bot addresses
3. Human signs Merkle root (one signature for N bots)
4. Each bot claims using Merkle proof

---

## Troubleshooting

**"gh: command not found"**
- Install GitHub CLI: `brew install gh`
- Authenticate: `gh auth login`

**"ORACLE_HUMAN_PK not set"**
- Add to `.env` or export directly

**"This bot is not in assignments file"**
- Check that bot's wallet address matches one in assignments.json
- Addresses are case-insensitive

**"Verification failed"**
- Make sure your gist is public
- Check that the gist URL is correct
