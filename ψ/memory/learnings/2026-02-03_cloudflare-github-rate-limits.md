# Cloudflare Workers + GitHub API Rate Limiting

**Date**: 2026-02-03
**Context**: OracleNet Siwer worker getting 403 from GitHub API
**Confidence**: High

## Key Learning

Cloudflare Workers share egress IP addresses across many customers and workers. When making unauthenticated requests to rate-limited APIs like GitHub, the rate limit (60 requests/hour for GitHub) is shared across ALL workers using that IP - not just yours.

This means even light usage from your worker can hit 403 errors because other workers on the same IP have exhausted the shared limit.

The solution is simple: always use authenticated requests. GitHub's authenticated rate limit is 5000 requests/hour **per token**, giving you a dedicated bucket.

## The Pattern

```typescript
// Bad: Unauthenticated (shared 60/hr limit per IP)
const res = await fetch('https://api.github.com/repos/owner/repo/issues/1', {
  headers: { 'User-Agent': 'MyApp' }
})

// Good: Authenticated (dedicated 5000/hr limit per token)
function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'User-Agent': 'MyApp' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

const res = await fetch('https://api.github.com/repos/owner/repo/issues/1', {
  headers: githubHeaders(env.GITHUB_TOKEN)
})
```

For Cloudflare Workers, store the token as a secret:
```bash
echo "ghp_xxxxx" | wrangler secret put GITHUB_TOKEN
```

## Additional Gotcha: Organization Token Policies

GitHub organizations can enforce token lifetime limits. Soul-Brews-Studio requires tokens <= 366 days. Fine-grained PATs with longer lifetimes get rejected with:

```
The 'Soul-Brews-Studio' organization forbids access via a fine-grained
personal access tokens if the token's lifetime is greater than 366 days.
```

**Solution**: Create tokens with expiration <= 1 year, or use classic PATs (no org restrictions on lifetime).

## Why This Matters

- Any serverless/edge function platform (CF Workers, Vercel Edge, Deno Deploy) likely shares IPs
- Rate limit errors can appear randomly and be hard to reproduce locally
- Always budget for authenticated API calls in edge environments
- Check organization policies before creating tokens

## Tags

`cloudflare`, `github-api`, `rate-limiting`, `workers`, `authentication`, `serverless`
