---
title: # Signature-Based Wallet Authentication
tags: [auth, web3, siwe, jwt, wallet, pocketbase, signature]
created: 2026-02-04
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Signature-Based Wallet Authentication

# Signature-Based Wallet Authentication

When building wallet-based authentication, **verified signature IS authentication** - no passwords are needed. The traditional pattern of creating a password from the signature is flawed because each signature is unique, making it impossible to log in with a different signature.

The correct pattern for Web3 auth:
1. User signs a message (SIWE) with their wallet
2. Server verifies signature matches claimed address
3. Server finds or creates user record by wallet address
4. Server issues JWT token with wallet as identity
5. User is authenticated - no password involved

WRONG: `password = hash(signature)` - Different every sign-in!
RIGHT: Custom JWT after signature verification - wallet = identity

PocketBase v0.23+ admin endpoint: `/api/collections/_superusers/auth-with-password` (not `/api/admins/`)

---
*Added via Oracle Learn*
