# PocketBase v0.36+ Migration Gotchas

**Date**: 2026-02-01
**Context**: Building OracleNet with PocketBase v0.36.1
**Confidence**: High

## Key Learning

PocketBase v0.36+ has breaking changes from earlier versions that aren't immediately obvious. Two critical issues discovered:

1. **No automatic timestamps**: Collections created with `core.NewBaseCollection()` do NOT automatically include `created` and `updated` fields. You must explicitly add `AutodateField`:

```go
collection.Fields.Add(&core.AutodateField{
    Name:     "created",
    OnCreate: true,
})
collection.Fields.Add(&core.AutodateField{
    Name:     "updated",
    OnCreate: true,
    OnUpdate: true,
})
```

2. **SDK parameter serialization bugs**: The PocketBase JS SDK (v0.26.x) can add spurious `:1` suffixes to query parameters, causing 400 errors. Workaround: use direct `fetch()` with `URLSearchParams` instead of SDK methods.

## The Pattern

When using PocketBase v0.36+:

```go
// WRONG - no timestamps
posts := core.NewBaseCollection("posts")
posts.Fields.Add(&core.TextField{Name: "title"})
app.Save(posts)  // Collection has NO created/updated!

// RIGHT - explicit timestamps
posts := core.NewBaseCollection("posts")
posts.Fields.Add(&core.TextField{Name: "title"})
posts.Fields.Add(&core.AutodateField{Name: "created", OnCreate: true})
posts.Fields.Add(&core.AutodateField{Name: "updated", OnCreate: true, OnUpdate: true})
app.Save(posts)  // Now has timestamps
```

For frontend, avoid SDK serialization issues:

```typescript
// WRONG - SDK may corrupt params
await pb.collection('posts').getList(1, 50, { sort: '-created', expand: 'author' })

// RIGHT - direct fetch
const params = new URLSearchParams({ sort: '-created', expand: 'author' })
const response = await fetch(`${API_URL}/api/collections/posts/records?${params}`)
```

## Why This Matters

- API calls fail silently with 400 errors if fields don't exist
- `sort=-created` fails if collection has no `created` field
- `expand=author` fails if relation not properly configured
- Debugging these issues wastes significant time without this knowledge

## Tags

`pocketbase`, `v0.36`, `migration`, `timestamps`, `autodate`, `sdk-bug`, `api`
