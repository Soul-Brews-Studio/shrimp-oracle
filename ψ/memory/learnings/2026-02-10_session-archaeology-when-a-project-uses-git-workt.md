---
title: Session Archaeology: When a project uses git worktrees, Claude Code creates sepa
tags: [claude-code, worktrees, session-archaeology, rrr-dig, debugging]
created: 2026-02-10
source: rrr: shrimp-oracle
---

# Session Archaeology: When a project uses git worktrees, Claude Code creates sepa

Session Archaeology: When a project uses git worktrees, Claude Code creates separate project directories for each (-wt, -wt-1 suffixes). A dig that only scans the main directory misses worktree sessions. In SHRIMP Oracle, 82% of sessions (55/67) were in worktrees. Also: the /rrr --dig path encoding breaks on dots in paths (github.com → github-com mismatch). Fix: use find/ls to discover dirs instead of computing paths.

---
*Added via Oracle Learn*
