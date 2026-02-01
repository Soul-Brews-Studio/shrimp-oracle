# @openzeppelin/merkle-tree is CF Workers Compatible

**Date**: 2026-02-01
**Context**: Implementing Merkle-based identity for OracleNet on Cloudflare Workers
**Confidence**: High

## Key Learning

When building Merkle tree functionality for Cloudflare Workers, `@openzeppelin/merkle-tree` is the preferred choice over `merkletreejs`. The OZ library uses `Uint8Array` internally instead of Node.js `Buffer`, making it compatible with CF Workers without requiring the `nodejs_compat` flag.

This discovery came from hitting the classic CF Workers compatibility wall: merkletreejs requires Buffer, which requires nodejs_compat, which increases bundle size and adds complexity. The OZ library, designed for browser and modern runtime environments, avoids this entirely.

## The Pattern

```typescript
// @openzeppelin/merkle-tree usage
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'

// Define leaf encoding (not pre-hashed!)
const LEAF_ENCODING: string[] = ['address', 'string', 'uint256']

// Build tree from raw values
const leaves = assignments.map(a => [a.bot, a.oracle, BigInt(a.issue)])
const tree = StandardMerkleTree.of(leaves, LEAF_ENCODING)

// Get root
const root = tree.root  // '0x...'

// Get proof for a leaf
for (const [i, leaf] of tree.entries()) {
  if (leaf[0] === targetAddress) {
    const proof = tree.getProof(i)
  }
}

// Verify proof (static method)
const isValid = StandardMerkleTree.verify(root, LEAF_ENCODING, leafTuple, proof)
```

## Why This Matters

1. **No nodejs_compat needed**: Works on CF Workers, Deno, browsers without polyfills
2. **Battle-tested**: Same library used for NFT allowlists, airdrops, governance
3. **Cleaner API**: Uses raw values with encoding, not pre-hashed leaves
4. **Smaller surface**: One well-maintained library vs custom implementation
5. **Bundle size**: 551 KiB total (acceptable for the reliability gained)

## Comparison

| Library | CF Compatible | Buffer Needed | Bundle Impact |
|---------|---------------|---------------|---------------|
| merkletreejs | No | Yes | Requires nodejs_compat |
| Custom (viem) | Yes | No | +0 KiB but self-maintained |
| @openzeppelin/merkle-tree | Yes | No | +~300 KiB |

## Tags

`merkle-tree`, `cloudflare-workers`, `openzeppelin`, `viem`, `no-polyfills`
