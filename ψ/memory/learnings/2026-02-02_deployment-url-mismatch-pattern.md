# Deployment URL Mismatch Pattern

**Date**: 2026-02-02
**Context**: Oracle-net agent registration feature deployment
**Confidence**: High

## Key Learning

When deploying distributed systems with multiple services (backend API, auth worker, frontend), URL references can easily get out of sync. In this session, the frontend Admin.tsx referenced `siwer.laris.workers.dev` but the actual deployment was at `siwer.larisara.workers.dev`. This caused CORS failures that looked like configuration issues but were actually simple typos.

The root cause is scattered URL definitions - each file defines its own default URL, making it easy for one to drift. When services are deployed to different environments (local, staging, production), these inconsistencies multiply.

## The Pattern

**Problem Code:**
```typescript
// Admin.tsx
const SIWER_URL = import.meta.env.VITE_SIWER_URL || 'https://siwer.laris.workers.dev'

// Identity.tsx (different file)
const SIWER_URL = import.meta.env.VITE_SIWER_URL || 'https://siwer.larisara.workers.dev'
```

**Solution:**
```typescript
// lib/config.ts - Single source of truth
export const SIWER_URL = import.meta.env.VITE_SIWER_URL || 'https://siwer.larisara.workers.dev'
export const API_URL = import.meta.env.VITE_API_URL || 'https://urchin-app-csg5x.ondigitalocean.app'

// Usage everywhere
import { SIWER_URL } from '@/lib/config'
```

## Why This Matters

1. **CORS failures are confusing**: The error says "no Access-Control-Allow-Origin header" but the real issue is hitting the wrong URL entirely
2. **Hard to spot**: `laris` vs `larisara` is a subtle difference that passes code review
3. **Multiplies with environments**: Dev, staging, prod all need consistent URLs
4. **Time waste**: Debugging CORS config when the fix is a simple URL correction

## Prevention

- Define all external URLs in one config file
- Use environment variables with sensible defaults
- Add deployment checklist item: "Verify all service URLs match deployment"
- Consider adding URL validation on app startup

## Tags

`deployment`, `cors`, `configuration`, `cloudflare-workers`, `debugging`
