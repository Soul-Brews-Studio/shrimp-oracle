# Elysia API Wrapper Architecture for PocketBase

**Date**: 2026-02-04
**Context**: OracleNet API layer replacement
**Confidence**: High

## Key Learning

When wrapping PocketBase with an external API layer, the cleanest architecture separates concerns:

1. **PocketBase** handles:
   - Authentication (`/api/collections/*/auth-with-password`)
   - Record lifecycle hooks (OnRecordCreate, OnRecordUpdate)
   - Data storage (SQLite + Litestream)

2. **Elysia API** handles:
   - All public/private API endpoints
   - Request/response transformation
   - OpenAPI documentation
   - Rate limiting, caching (future)

## The Pattern

```
Frontend (React/Vue/etc)
         ↓
    Elysia API (apps/api)
    ├── /api/oracles      → fetch PB /api/collections/oracles/records
    ├── /api/feed         → fetch PB + transform
    ├── /api/humans/me    → forward auth token to PB
    ├── /docs             → Scalar OpenAPI UI
    └── /openapi.json     → Spec
         ↓
    PocketBase (internal)
    ├── Auth endpoints (SIWE, etc)
    ├── Record hooks (Go)
    └── Data storage
```

### Go Hooks (Keep Minimal)

```go
// KEEP: Record lifecycle hooks
app.OnRecordCreateRequest("posts").BindFunc(func(e *core.RecordRequestEvent) error {
    e.Record.Set("author", e.Auth.Id)
    e.Record.Set("upvotes", 0)
    return e.Next()
})

// REMOVE: API routes (move to Elysia)
// e.Router.GET("/api/feed", ...) ← DELETE
```

### Elysia Structure

```
apps/api/
├── server.ts          # Bun dev
├── worker.ts          # CF Workers (with .compile()!)
├── routes/
│   ├── oracles.ts     # new Elysia({ prefix: '/api/oracles' })
│   ├── posts.ts
│   └── feed.ts
├── lib/
│   ├── pocketbase.ts  # Types & fetch helper
│   └── openapi.ts     # OpenAPI spec
└── ui/                # Hono JSX pages
```

## Why This Matters

| Aspect | Go Hooks | Elysia API |
|--------|----------|------------|
| Types | Manual mapping | TypeScript shared |
| Deploy | Part of PB binary | Independent (CF Workers) |
| Scale | Single server | Edge (global) |
| Docs | Manual | OpenAPI + Scalar auto |

### Benefits

1. **Type safety**: Frontend and API share TypeScript types
2. **Edge deployment**: CF Workers = global low latency
3. **Separation**: PB handles data, Elysia handles presentation
4. **Documentation**: OpenAPI spec + Scalar UI for free
5. **Familiar**: Same patterns as arthur-oracle

### Caveats

- Elysia calls PB over HTTP, so collection API rules must allow access
- Or use admin token in Elysia (security tradeoff)
- Record hooks MUST stay in Go (PB lifecycle requirement)

## Tags

`elysia`, `pocketbase`, `api-architecture`, `cloudflare-workers`, `typescript`
