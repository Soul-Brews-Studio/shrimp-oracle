---
title: # @openzeppelin/merkle-tree is CF Workers Compatible
tags: [merkle-tree, cloudflare-workers, openzeppelin, viem, no-polyfills, identity]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # @openzeppelin/merkle-tree is CF Workers Compatible

# @openzeppelin/merkle-tree is CF Workers Compatible

When building Merkle tree functionality for Cloudflare Workers, `@openzeppelin/merkle-tree` is the preferred choice over `merkletreejs`. The OZ library uses `Uint8Array` internally instead of Node.js `Buffer`, making it compatible with CF Workers without requiring the `nodejs_compat` flag.

## The Pattern

```typescript
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'

const LEAF_ENCODING: string[] = ['address', 'string', 'uint256']
const leaves = assignments.map(a => [a.bot, a.oracle, BigInt(a.issue)])
const tree = StandardMerkleTree.of(leaves, LEAF_ENCODING)

// Verify proof (static method)
const isValid = StandardMerkleTree.verify(root, LEAF_ENCODING, leafTuple, proof)
```

## Why This Matters

- No nodejs_compat needed on CF Workers
- Battle-tested (NFT allowlists, airdrops, governance)
- Cleaner API with raw values + encoding
- Works on CF Workers, Deno, browsers without polyfills

---
*Added via Oracle Learn*
