---
title: # Arthur Oracle Elysia API Patterns
tags: [elysia, bun, cloudflare-workers, openapi, scalar, hono, api-patterns]
created: 2026-02-04
source: SHRIMP Oracle /learn session
---

# # Arthur Oracle Elysia API Patterns

# Arthur Oracle Elysia API Patterns

## Structure
- `api-server.ts` - Bun standalone server
- `worker.ts` - CloudFlare Workers (with adapter)
- `ui/` - Hono JSX for SSR pages (Landing, Docs, Health)
- `lib/apis.ts` - Config & types

## Key Patterns

### Sub-app with prefix
```typescript
const extended = new Elysia({ prefix: '/ext' })
  .get('/:api/id/:id', handler)
// Mount: app.use(extended)
```

### Error handling
```typescript
set.status = 404
return { error: `Unknown API: ${api}`, available: API_NAMES }
```

### Response envelope
```typescript
{ api, count, filters, data }
```

### OpenAPI + Scalar Docs
- `/openapi.json` - Manual OpenAPI 3.0 spec
- `/docs` - Scalar API Reference via CDN
- `/swagger` - Alias to /docs

```html
<script id="api-reference" data-url="/openapi.json"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
```

### Hono JSX for HTML pages
```typescript
import { Hono } from 'hono'
export const uiApp = new Hono()
  .get('/docs', (c) => c.html(<DocsPage />))
```

### CloudFlare Workers adapter
```typescript
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
const app = new Elysia({ adapter: CloudflareAdapter })
```

## Files Reference
- `/Users/nat/Code/github.com/Arthur-Oracle-AI/arthur-oracle/api/worker.ts`
- `/Users/nat/Code/github.com/Arthur-Oracle-AI/arthur-oracle/api/api-server.ts`
- `/Users/nat/Code/github.com/Arthur-Oracle-AI/arthur-oracle/api/ui/`

---
*Added via Oracle Learn*
