# Session Archaeology: Worktrees Create Parallel Histories

**Date**: 2026-02-10
**Source**: /rrr --dig across 67 sessions

## The Pattern

When a project uses git worktrees, Claude Code creates separate project directories for each worktree:
- `-Users-nat-Code-repo-name` (main)
- `-Users-nat-Code-repo-name-wt` (worktree 1)
- `-Users-nat-Code-repo-name-wt-1` (worktree 2)

Each directory has its own session .jsonl files. A dig that only scans the main directory misses worktree sessions entirely.

## The Numbers

- **67 total sessions** across 3 directories
- **12 sessions** in main (what a naive dig would find)
- **55 sessions** in wt-1 (82% of all work — invisible to a single-dir scan)

## The Fix

When scanning for session history, always:
1. Find all directories matching the project name pattern (including `-wt*` suffixes)
2. Collect .jsonl files from all of them
3. Sort chronologically across all sources
4. Tag each session with its source directory

## The Insight

Git log shows the merge commits. Session logs show the conversations, dead ends, and debugging sessions that produced those commits. 21 sessions on Feb 02 for auth debugging → one clean commit. The ratio of effort to output is invisible in git.

## Bug: Path Encoding

The /rrr --dig skill encodes `pwd` with `sed 's|/|-|g'` which turns `github.com` into `github.com` (preserving the dot). But Claude Code's actual directory uses `github-com` (replacing dot with hyphen). The encoding is wrong.

**Fix**: Don't compute the path. Use `find` or `ls` to match the project directory pattern.
