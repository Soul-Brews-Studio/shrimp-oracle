---
title: # PocketBase v0.36+ Migration Gotchas
tags: [pocketbase, v0.36, migration, timestamps, autodate, sdk-bug, api, gotcha]
created: 2026-02-01
source: Oracle Learn
---

# # PocketBase v0.36+ Migration Gotchas

# PocketBase v0.36+ Migration Gotchas

PocketBase v0.36+ has breaking changes:

1. **No automatic timestamps**: Collections created with `core.NewBaseCollection()` do NOT automatically include `created` and `updated` fields. Must explicitly add `AutodateField`:

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

2. **SDK parameter serialization bugs**: PocketBase JS SDK (v0.26.x) can add spurious `:1` suffixes to query parameters, causing 400 errors. Workaround: use direct `fetch()` with `URLSearchParams` instead of SDK methods.

Key insight: Always verify API response fields exist before building UI that depends on them. `sort=-created` fails silently if collection has no `created` field.

---
*Added via Oracle Learn*
