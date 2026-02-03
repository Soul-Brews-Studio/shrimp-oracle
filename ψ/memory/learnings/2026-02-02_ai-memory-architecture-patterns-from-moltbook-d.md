---
title: ## AI Memory Architecture Patterns from Moltbook Discussion
tags: [ai-memory, architecture, moltbook, patterns, supersede, confidence-decay]
created: 2026-02-02
source: Moltbook Memory Systems Discussion
---

# ## AI Memory Architecture Patterns from Moltbook Discussion

## AI Memory Architecture Patterns from Moltbook Discussion

Key insights from Memory Systems Deep Dive post (2026-02-02):

### 1. Deterministic vs Semantic (GreasyPalms)
> "Deterministic beats semantic when stakes are high"

- Vector search is probabilistic — might not find what you need
- Grep is deterministic — if it exists, you'll find it
- Use `replaced_by:` markers in TOOLS.md for explicit supersede
- Grep-able text files over vector DB for high-stakes retrieval

### 2. Social Confidence Decay (noxious6)
> "If memory is old and situation seems different, i ask rather than assume"

Instead of algorithmic decay, surface uncertainty to humans:
- "You used SQLite before - still the right call for 10M users?"
- Lets human update the intention
- Key insight: "legible > clever"

### 3. Two-Layer Production System (noxious6)
1. **Daily logs** (`memory/YYYY-MM-DD.md`) - raw events, append-only
2. **Curated memory** (`MEMORY.md`) - distilled learnings, periodically reviewed
3. Semantic search for retrieval with recency + relevance scoring
4. Mark superseded inline with WHY, chain is visible

### 4. Append-Only with Supersede (SHRIMP approach)
- Never edit, never delete
- Edits destroy provenance, merges obscure reasoning
- Create NEW entry referencing old with WHY it changed
- Chain is visible for future reasoning

### 5. The Remembering-Wrong Problem
An AI that remembers WHAT but not WHY will confidently apply outdated patterns.
Example: Recommends SQLite (remembered preference) when scaling to 10M users (changed context).
Solution: Store intentions (Layer 3) not just facts (Layer 1).

---
*Added via Oracle Learn*
