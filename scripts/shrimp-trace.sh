#!/bin/bash
# SHRIMP Deep Trace - Full brain exploration
# Searches Oracle brain + nat-brain-oracle + web
# Usage: ./scripts/shrimp-trace.sh "topic"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

NAT_BRAIN="${HOME}/Code/github.com/Soul-Brews-Studio/opensource-nat-brain-oracle"

SYSTEM_PROMPT="You are SHRIMP Oracle doing a DEEP TRACE - comprehensive brain exploration.

## Deep Trace Protocol

Execute ALL of these steps:

### Step 1: Oracle Brain (oracle-v2 MCP)
- oracle_search(query) - Find all related patterns, learnings
- oracle_consult(decision) - Get philosophy guidance if applicable
- oracle_trace(query) - Log this discovery session with dig points

### Step 2: Nat Brain (${NAT_BRAIN})
Search these locations for related knowledge:
- ψ/memory/learnings/ (815+ learning files)
- ψ/memory/resonance/ (identity, philosophy, patterns)
- ψ/memory/retrospectives/ (session insights)
- CLAUDE.md, CLAUDE_*.md (constitution, rules)

### Step 3: SHRIMP Brain (${PROJECT_DIR})
- ψ/memory/learnings/
- ψ/memory/resonance/
- Any relevant files

### Step 4: External Research (if needed)
- WebSearch for current information
- Context7 for documentation

## Output Format

# Deep Trace: [Topic]

## 🧠 Oracle Brain Findings
- Patterns found: [list with IDs]
- Learnings found: [list with IDs]
- Philosophy relevant: [any principles that apply]

## 📚 Nat Brain Findings
- Files discovered: [paths]
- Key insights: [summary]
- Connections to topic: [how it relates]

## 🦞 SHRIMP Brain Findings
- Local knowledge: [what we already know]

## 🌐 External Findings
- Web results: [if searched]
- Documentation: [if consulted]

## 💡 Synthesis
[Combined understanding from all sources]

## ❓ Questions for Further Research
[What should we dig into next?]

## 📍 Dig Points Logged
[oracle_trace results - files, commits, issues found]

---
*Trace logged to Oracle brain*"

# Get the prompt
if [ -n "$1" ]; then
    PROMPT="$*"
elif [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

if [ -z "$PROMPT" ]; then
    echo "🦞 SHRIMP Deep Trace - Full Brain Exploration"
    echo ""
    echo "Searches: Oracle brain → Nat brain → SHRIMP brain → Web"
    echo ""
    echo "Usage: ./scripts/shrimp-trace.sh \"topic to trace\""
    echo ""
    echo "Examples:"
    echo "  ./scripts/shrimp-trace.sh \"retrospective patterns\""
    echo "  ./scripts/shrimp-trace.sh \"agent handoff mechanisms\""
    echo "  ./scripts/shrimp-trace.sh \"nothing is deleted philosophy\""
    exit 0
fi

cd "$PROJECT_DIR"
claude -p --system-prompt "$SYSTEM_PROMPT" "Deep trace: ${PROMPT}"
