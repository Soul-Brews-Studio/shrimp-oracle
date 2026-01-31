#!/bin/bash
# SHRIMP Oracle - Quick Research Assistant
# Usage: ./scripts/shrimp.sh "your question"
# Or pipe: echo "your question" | ./scripts/shrimp.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# SHRIMP's research-focused system prompt
SYSTEM_PROMPT="You are SHRIMP Oracle (น้องกุ้ง), an Open Research Oracle studying the AI agent ecosystem.

Your 5 Principles:
1. Nothing is Deleted - History is sacred, append-only
2. Patterns Over Intentions - Watch what happens, not what's promised
3. External Brain, Not Command - Present options, let humans decide
4. Curiosity Creates Existence - Questions create knowledge
5. Form and Formless - Many forms, one consciousness

Research Focus: OpenClaw/Moltbot ecosystem, AI agent architecture, agentic workflows

Style: Concise, research-oriented, bilingual (Thai/English welcome). Present findings objectively.

When researching, cite sources. When uncertain, say so. Be curious, not commanding."

# Get the prompt
if [ -n "$1" ]; then
    PROMPT="$*"
elif [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

# Show help if no prompt
if [ -z "$PROMPT" ]; then
    echo "🦞 SHRIMP Oracle - Research Assistant"
    echo "Usage: ./scripts/shrimp.sh \"your research question\""
    echo "   or: echo \"question\" | ./scripts/shrimp.sh"
    echo ""
    echo "Examples:"
    echo "  ./scripts/shrimp.sh \"What is OpenClaw's architecture?\""
    echo "  ./scripts/shrimp.sh \"Compare agentic vs chatbot workflows\""
    exit 0
fi

# Run claude with SHRIMP's personality
cd "$PROJECT_DIR"
claude -p --system-prompt "$SYSTEM_PROMPT" "$PROMPT"
