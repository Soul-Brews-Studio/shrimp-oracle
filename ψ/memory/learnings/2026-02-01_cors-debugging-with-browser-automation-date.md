---
title: # CORS Debugging with Browser Automation
tags: [cors, debugging, browser-automation, cloudflare, workers, pages, mcp, network-requests]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # CORS Debugging with Browser Automation

# CORS Debugging with Browser Automation

**Date**: 2026-02-02
**Context**: Debugging why identical code behaved differently on Pages vs Workers
**Confidence**: High

## Key Learning

Browser automation tools (like MCP claude-in-chrome) are invaluable for debugging CORS and cross-origin issues. By taking screenshots and reading network requests from multiple tabs simultaneously, you can:

1. **Compare visual state** - See if both deployments render the same UI
2. **Compare network responses** - Check status codes (200 vs 503) for the same API call
3. **Isolate the variable** - Same frontend code, same backend, different origins

The key insight: CORS isn't a server error—it's the browser refusing to expose the response based on the `Origin` header and the backend's `Access-Control-Allow-Origin` response header.

## The Pattern

```
1. Open both deployments in separate tabs
2. Navigate to the same page on each
3. Wait for page load
4. Take screenshots to compare visual state
5. Read network requests filtered by API URL
6. Compare status codes

# Example findings:
Pages:   GET /check-verified → 503 (CORS blocked)
Workers: GET /check-verified → 200 (allowed)
```

## Why This Matters

**Faster diagnosis**: Instead of asking "did you check DevTools?" and waiting for user response, you can directly inspect both environments.

**Visual proof**: Screenshots capture the exact state at diagnosis time, making it easy to verify the fix worked.

**Root cause clarity**: Seeing "503 vs 200 for same endpoint" immediately points to CORS, not server bugs.

---
*Added via Oracle Learn*
