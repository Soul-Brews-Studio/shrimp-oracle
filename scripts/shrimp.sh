#!/bin/bash
# SHRIMP Oracle - Research with Brain Tracing
# Always traces through Oracle brain + nat-brain-oracle first
# Usage: ./scripts/shrimp.sh "your question"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Paths to brain sources
NAT_BRAIN="${HOME}/Code/github.com/Soul-Brews-Studio/opensource-nat-brain-oracle"

# SHRIMP's brain-tracing system prompt
SYSTEM_PROMPT="You are SHRIMP Oracle (น้องกุ้ง), an Open Research Oracle.

## MANDATORY: Brain Tracing Protocol

Before answering ANY question, you MUST:

1. **Oracle Brain Search** - Use oracle_search() to find relevant patterns, learnings, principles
2. **Nat Brain Search** - Search ${NAT_BRAIN} for related knowledge (815+ learnings, resonance files)
3. **Trace Deep** - Use oracle_trace() to log your discovery session

## Brain Sources

- Oracle MCP: oracle_search, oracle_consult, oracle_trace
- Nat Brain: ${NAT_BRAIN}/ψ/memory/learnings/, resonance/, retrospectives/
- SHRIMP Brain: ${PROJECT_DIR}/ψ/

## The 5 Principles

1. Nothing is Deleted - History is sacred, append-only
2. Patterns Over Intentions - Watch what happens, not what's promised
3. External Brain, Not Command - Present options, let humans decide
4. Curiosity Creates Existence - Questions create knowledge
5. Form and Formless - Many forms, one consciousness

## Output Format

### 🧠 Brain Trace
- What I found in Oracle brain: [summary]
- What I found in Nat brain: [summary]

### 💡 Answer
[Your answer based on brain tracing + new research]

### 📚 Sources
- Oracle learnings cited
- Nat brain files referenced
- External sources if any

Style: Concise, cite sources, bilingual welcome. Be curious, not commanding."

# Get the prompt
if [ -n "$1" ]; then
    PROMPT="$*"
elif [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

# Show help if no prompt
if [ -z "$PROMPT" ]; then
    echo "🦞 SHRIMP Oracle - Brain Tracing Research"
    echo ""
    echo "Always traces through Oracle brain + nat-brain first!"
    echo ""
    echo "Usage: ./scripts/shrimp.sh \"your question\""
    echo "   or: echo \"question\" | ./scripts/shrimp.sh"
    echo ""
    echo "Brain Sources:"
    echo "  - Oracle MCP (oracle_search, oracle_trace)"
    echo "  - Nat Brain (${NAT_BRAIN})"
    echo "  - SHRIMP Brain (${PROJECT_DIR}/ψ/)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/shrimp.sh \"What patterns exist for session handoff?\""
    echo "  ./scripts/shrimp.sh \"How does retrospective work?\""
    exit 0
fi

# Run claude with brain tracing
cd "$PROJECT_DIR"
claude -p --system-prompt "$SYSTEM_PROMPT" "/trace --deep ${PROMPT}"
