---
title: # Bun + Viem is the Right Stack for Wallet Auth CLIs
tags: [viem, bun, wallet, cli, typescript, web3, auth, signing, oraclenet]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Bun + Viem is the Right Stack for Wallet Auth CLIs

# Bun + Viem is the Right Stack for Wallet Auth CLIs

When building CLI tools that need to sign messages with Ethereum wallets, use bun + viem instead of bash + curl + external signing tools. The TypeScript ecosystem provides proper crypto primitives through viem, making wallet operations straightforward and type-safe.

The pattern:
1. Store private key in .env
2. Use `privateKeyToAccount()` from viem/accounts
3. Call `account.signMessage()` for any message signing
4. Make authenticated requests with the resulting signature

Key benefits:
- Type safety catches errors at compile time
- No shell escaping issues with message signing
- Fast iteration with bun (no build step)
- Consistent crypto matching MetaMask and other wallets
- Ecosystem fit with viem-based workers (siwer)

---
*Added via Oracle Learn*
