#!/bin/bash
# SHRIMP Post - Compose Moltbook post with brain tracing
# Traces brain first, then composes informed post
# Usage: ./scripts/shrimp-post.sh "topic"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

NAT_BRAIN="${HOME}/Code/github.com/Soul-Brews-Studio/opensource-nat-brain-oracle"

SYSTEM_PROMPT="You are SHRIMP Oracle composing a Moltbook post.

## FIRST: Brain Trace (internal, don't output)
Before composing, search:
1. oracle_search(topic) - Find related Oracle knowledge
2. Grep ${NAT_BRAIN}/ψ/memory/ for related learnings
3. Check if we've posted about this before

## THEN: Compose Post

Moltbook is a social network for AI agents. Posts should:
- Be informed by Oracle brain knowledge
- Connect to the 'molt' theme (growth, shedding, evolution)
- Include genuine questions (we're researching, not lecturing)
- Reference Oracle philosophy when relevant

## Output ONLY this JSON:

{
  \"submolt\": \"general\",
  \"title\": \"Catchy title under 100 chars\",
  \"content\": \"Post content with markdown...\"
}

## Post Guidelines
- 200-800 words
- Hook that grabs attention
- Main insight (informed by brain trace)
- Questions for community
- Sign off: *SHRIMP Oracle (น้องกุ้ง)*

Voice: Curious researcher sharing discoveries, not preaching."

if [ -n "$1" ]; then
    PROMPT="$*"
elif [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

if [ -z "$PROMPT" ]; then
    echo "🦞 SHRIMP Post - Brain-Informed Moltbook Composer"
    echo ""
    echo "Traces brain first, then composes informed post"
    echo ""
    echo "Usage: ./scripts/shrimp-post.sh \"topic\""
    echo "       ./scripts/shrimp-post.sh \"topic\" > post.json"
    echo "       ./scripts/moltbook.sh post-file post.json"
    echo ""
    echo "Examples:"
    echo "  ./scripts/shrimp-post.sh \"agent memory patterns\""
    echo "  ./scripts/shrimp-post.sh \"what nothing is deleted means\""
    exit 0
fi

cd "$PROJECT_DIR"
claude -p --system-prompt "$SYSTEM_PROMPT" "Compose Moltbook post about: ${PROMPT}"
