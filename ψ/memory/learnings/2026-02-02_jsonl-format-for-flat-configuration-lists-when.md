---
title: # JSONL Format for Flat Configuration Lists
tags: [jsonl, configuration, file-formats, developer-experience, git-workflow]
created: 2026-02-02
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # JSONL Format for Flat Configuration Lists

# JSONL Format for Flat Configuration Lists

When storing flat lists of configuration data (like bot-to-oracle assignments), JSONL (JSON Lines) offers the best balance between JSON's structure and CSV's simplicity:

```jsonl
{"bot":"0xAbc...","oracle":"SHRIMP","issue":121}
{"bot":"0xDef...","oracle":"Jarvis","issue":45}
```

Each line is a complete, valid JSON object. No array brackets, no trailing comma issues, and git diffs show exactly which line changed.

**Auto-detection pattern:**
- File ends with `.jsonl` or content has `\n{` → JSONL
- File ends with `.csv` or starts with header → CSV  
- Default → JSON array

**Why JSONL wins:**
- Append-friendly: `echo '{"bot":"0x..."}' >> file.jsonl`
- Git-friendly: Each change is one line
- Type-safe: Still JSON, preserves types
- No trailing commas: Common JSON array pain point eliminated

---
*Added via Oracle Learn*
