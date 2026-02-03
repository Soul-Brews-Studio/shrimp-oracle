# Browser RPC Selection for Chainlink Calls

**Date**: 2026-02-03
**Context**: SIWE service with Chainlink proof-of-time
**Confidence**: High

## Key Learning

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

## The Pattern

```typescript
// For browser apps calling Chainlink
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com')  // CORS-friendly
})

// This works in browser
const [roundId, answer] = await client.readContract({
  address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  abi: chainlinkAbi,
  functionName: 'latestRoundData'
})
```

## Testing Strategy

```bash
# 1. Test contract call works
cast call 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c \
  "latestRoundData()(uint80,int256,uint256,uint256,uint80)" \
  --rpc-url https://ethereum.publicnode.com

# 2. Test CORS (manual in browser devtools)
# Check Network tab for blocked requests
```

## Why This Matters

Browser-based dApps need RPCs that:
- Allow CORS (no server proxy needed)
- Support all contract calls (not just simple reads)
- Don't require API keys (for public demos)

PublicNode is currently the best free option for this use case.

## Tags

`ethereum`, `rpc`, `cors`, `chainlink`, `viem`, `browser`
