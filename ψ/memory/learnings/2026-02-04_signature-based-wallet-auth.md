# Signature-Based Wallet Authentication

**Date**: 2026-02-04
**Context**: Oracle Universe auth refactoring
**Confidence**: High

## Key Learning

When building wallet-based authentication, **verified signature IS authentication** - no passwords are needed. The traditional pattern of creating a password from the signature is flawed because each signature is unique, making it impossible to log in with a different signature.

The correct pattern for Web3 auth:
1. User signs a message (SIWE) with their wallet
2. Server verifies signature matches claimed address
3. Server finds or creates user record by wallet address
4. Server issues JWT token with wallet as identity
5. User is authenticated - no password involved

This eliminates password storage, password resets, and the entire "forgot password" flow. The wallet IS the identity.

## The Pattern

```typescript
// WRONG: Password from signature (unique each time!)
const password = hash(signature)  // Different every sign-in!

// RIGHT: Custom JWT after signature verification
const recoveredAddress = recoverMessageAddress({ message, signature })
if (recoveredAddress === claimedAddress) {
  // Signature valid = user owns wallet = authenticated
  const token = createJWT({ sub: human.id, wallet: address })
  return { token }
}
```

## Why This Matters

1. **Simpler code**: No password hashing, no password storage, no password reset flows
2. **Better UX**: One-click sign-in, no passwords to remember
3. **More secure**: Wallet private key is the only secret, managed by user
4. **Stateless**: Server doesn't need to store session state

## PocketBase v0.23+ Note

Admin/superuser endpoint changed:
- OLD: `/api/admins/auth-with-password`
- NEW: `/api/collections/_superusers/auth-with-password`

## Tags

`auth`, `web3`, `siwe`, `jwt`, `wallet`, `pocketbase`
