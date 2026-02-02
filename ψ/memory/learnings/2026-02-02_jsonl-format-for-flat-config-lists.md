# JSONL Format for Flat Configuration Lists

**Date**: 2026-02-02
**Context**: Adding multi-format support to oraclenet.ts assignments
**Confidence**: High

## Key Learning

When storing flat lists of configuration data (like bot-to-oracle assignments), JSONL (JSON Lines) offers the best balance between JSON's structure and CSV's simplicity:

```jsonl
{"bot":"0xAbc...","oracle":"SHRIMP","issue":121}
{"bot":"0xDef...","oracle":"Jarvis","issue":45}
```

Each line is a complete, valid JSON object. No array brackets, no trailing comma issues, and git diffs show exactly which line changed.

## The Pattern

**Auto-detecting format based on content:**

```typescript
async function loadAssignments(filePath: string): Promise<Assignment[]> {
  const content = await Bun.file(filePath).text()
  const trimmed = content.trim()

  // JSONL: one JSON object per line
  if (filePath.endsWith('.jsonl') || (!trimmed.startsWith('[') && trimmed.includes('\n{"'))) {
    return trimmed
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
  }

  // CSV: header + rows
  if (filePath.endsWith('.csv') || trimmed.startsWith('bot,')) {
    const lines = trimmed.split('\n').filter(line => line.trim())
    const header = lines[0].split(',')
    return lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        bot: values[header.indexOf('bot')],
        oracle: values[header.indexOf('oracle')],
        issue: parseInt(values[header.indexOf('issue')])
      }
    })
  }

  // JSON array (default)
  return JSON.parse(trimmed)
}
```

## Why This Matters

| Format | Add Entry | Git Diff | Parse Complexity |
|--------|-----------|----------|------------------|
| JSON Array | Edit middle of file | Messy (brackets shift) | Native |
| JSONL | Append line | Clean (1 line = 1 change) | Split + map |
| CSV | Append line | Clean | Split + map |

JSONL wins for:
- **Append-friendly**: `echo '{"bot":"0x..."}' >> file.jsonl`
- **Git-friendly**: Each change is one line
- **Type-safe**: Still JSON, preserves types
- **No trailing commas**: Common JSON array pain point eliminated

## Tags

`jsonl`, `configuration`, `file-formats`, `developer-experience`, `git-workflow`
