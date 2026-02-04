---
title: # Elysia CloudFlare Workers Deployment
tags: [elysia, cloudflare-workers, deployment, compile]
created: 2026-02-04
source: SHRIMP Oracle CF Workers deployment debugging
---

# # Elysia CloudFlare Workers Deployment

# Elysia CloudFlare Workers Deployment

## Critical: `.compile()` Required

When deploying Elysia to CloudFlare Workers, you MUST call `.compile()` at the end of the app chain:

```typescript
const app = new Elysia({ adapter: CloudflareAdapter })
  .use(cors())
  .get('/api', () => ({ ... }))
  .get('/ping', () => 'pong')
  // ... more routes
  .compile()  // <-- REQUIRED for CF Workers!

export default app
```

Without `.compile()`, you'll get:
- Error code 1101
- "Disallowed operation called within global scope"
- "Code generation from strings disallowed"

## Why?

Elysia uses dynamic code generation (`new Function()`) for performance. The `.compile()` method pre-compiles all routes so no dynamic code generation happens at runtime, which is required for CF Workers' security model.

## Also Required

- `CloudflareAdapter` from `elysia/adapter/cloudflare-worker`
- `compatibility_date = "2025-06-01"` in wrangler.toml

## Reference

Arthur Oracle uses this exact pattern:
- `/Users/nat/Code/github.com/Arthur-Oracle-AI/arthur-oracle/api/worker.ts`

---
*Added via Oracle Learn*
