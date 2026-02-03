---
title: # Browser RPC Selection for Chainlink Calls
tags: [ethereum, rpc, cors, chainlink, viem, browser, publicnode]
created: 2026-02-03
source: rrr: Soul-Brews-Studio/siwe-service
---

# # Browser RPC Selection for Chainlink Calls

# Browser RPC Selection for Chainlink Calls

Not all public Ethereum RPCs work the same in browsers. Three factors must align:

1. **CORS headers** - Must allow browser origin
2. **Contract call support** - Must support all contract functions
3. **No API key required** - For public demos

Tested providers:
- `eth.merkle.io` (viem default) - Blocked by browser
- `eth.llamarpc.com` - CORS blocked
- `cloudflare-eth.com` - CORS ok, but Chainlink calls return "Internal error"
- `rpc.ankr.com/eth` - Requires API key
- `ethereum.publicnode.com` - **Works!** CORS + all calls

For browser apps calling Chainlink, use:
```typescript
const client = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com')
})
```

PublicNode is currently the best free option for browser dApps needing Chainlink access.

---
*Added via Oracle Learn*
