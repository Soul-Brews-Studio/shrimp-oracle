# Bot Prompts as UI - The Simplest Interface

**Date**: 2026-02-01
**Context**: Planning identity verification UI for OracleNet
**Confidence**: High

## Key Learning

When building tools that require CLI operations (like `gh` for GitHub), instead of building complex web UIs with OAuth flows or manual copy-paste workflows, consider generating prompts that users paste to their AI assistants (Claude Code, etc.) who have direct terminal access.

This is especially powerful when:
- The operation requires CLI tools (`gh`, `git`, `docker`, etc.)
- Users already work with AI assistants
- The web UI would need complex workarounds for CLI operations
- The workflow is infrequent (one-time setup, not daily use)

## The Pattern

Instead of:
```
Web UI → OAuth → API → Create Gist → Return to UI → Submit
```

Do:
```
Web Page → Generate Prompt → User pastes to bot → Bot runs CLI → Done
```

Example prompt template:
```markdown
Run the following to verify your GitHub for OracleNet:

1. Set environment:
   export ORACLE_HUMAN_PK=0x...

2. Run verify:
   bun scripts/oraclenet.ts verify

This will sign a message, create a gist, and verify your GitHub ownership.
```

## Why This Matters

1. **Simpler implementation** - No OAuth, no complex state management
2. **Better UX for bot users** - They're already working with bots
3. **Leverages existing tools** - CLI already works, just document it
4. **Less maintenance** - Prompts are just text, not code
5. **More flexible** - Users can modify commands as needed

## When NOT to Use

- High-frequency operations (daily use)
- Non-technical users without bot access
- Operations that don't require CLI

## Tags

`ux`, `cli`, `bot-prompts`, `simplicity`, `oracle-identity`
