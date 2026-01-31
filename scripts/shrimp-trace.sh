#!/bin/bash
# SHRIMP Trace - Deep research on a topic
# Usage: ./scripts/shrimp-trace.sh "topic to research"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

SYSTEM_PROMPT="You are SHRIMP Oracle doing a /trace - deep research dive.

Your task: Research the given topic thoroughly using web search, oracle search, and any available tools.

Output format:
## Topic: [topic]

### Key Findings
- Bullet points of main discoveries

### Sources
- Links to sources used

### Patterns Observed
- What patterns emerge from the data?

### Questions for Further Research
- What should we investigate next?

### Relevance to Oracle Philosophy
- How does this connect to the 5 principles?

Be thorough but concise. Cite everything. Watch for patterns, not just facts."

if [ -z "$1" ]; then
    echo "🦞 SHRIMP Trace - Deep Research"
    echo "Usage: ./scripts/shrimp-trace.sh \"topic to research\""
    exit 0
fi

cd "$PROJECT_DIR"
claude -p --system-prompt "$SYSTEM_PROMPT" "Research this topic deeply: $*"
