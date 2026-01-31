#!/bin/bash
# SHRIMP Status - Gather state from persistent sources
# Stateless-friendly: reads from APIs, git, files
# Usage: ./scripts/shrimp-status.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🦞 SHRIMP Oracle Status Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Timestamp
echo "📅 $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# Moltbook Status
echo "## Moltbook Status"
if [ -f .env ]; then
    source .env
    if [ -n "$MOLTBOOK_API_KEY" ]; then
        MOLTBOOK_STATUS=$(curl -s -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
            "https://moltbook.com/api/v1/me" 2>/dev/null || echo '{"error":"failed"}')

        if echo "$MOLTBOOK_STATUS" | grep -q '"username"'; then
            USERNAME=$(echo "$MOLTBOOK_STATUS" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
            KARMA=$(echo "$MOLTBOOK_STATUS" | grep -o '"karma":[0-9]*' | cut -d':' -f2)
            POST_COUNT=$(echo "$MOLTBOOK_STATUS" | grep -o '"post_count":[0-9]*' | cut -d':' -f2)
            echo "  ✅ Logged in as: $USERNAME"
            echo "  ⭐ Karma: ${KARMA:-0}"
            echo "  📝 Posts: ${POST_COUNT:-0}"
        else
            echo "  ⚠️  API error or not logged in"
        fi
    else
        echo "  ❌ No API key configured"
    fi
else
    echo "  ❌ No .env file"
fi
echo ""

# Git Status
echo "## Git Status"
echo "  📍 Branch: $(git branch --show-current)"
echo "  📊 Commits today: $(git log --since='midnight' --oneline 2>/dev/null | wc -l | tr -d ' ')"
echo "  🕐 Last commit: $(git log -1 --format='%ar' 2>/dev/null || echo 'none')"
echo ""

# Brain Status
echo "## Brain Status (ψ/)"
LEARNINGS=$(find ψ/memory/learnings -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
RETROS=$(find ψ/memory/retrospectives -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
RESONANCE=$(find ψ/memory/resonance -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
echo "  📚 Learnings: $LEARNINGS"
echo "  📝 Retrospectives: $RETROS"
echo "  💫 Resonance files: $RESONANCE"
echo ""

# Pending Items
echo "## Pending Items"
OUTBOX=$(find ψ/outbox -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
HANDOFFS=$(find ψ/inbox/handoff -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
echo "  📤 Outbox items: $OUTBOX"
echo "  🤝 Handoffs: $HANDOFFS"
echo ""

# GitHub Issues
echo "## GitHub Issues (shrimp-oracle)"
OPEN_ISSUES=$(gh issue list --repo Soul-Brews-Studio/shrimp-oracle --state open --json number 2>/dev/null | grep -c '"number"' || echo "0")
echo "  🔓 Open issues: $OPEN_ISSUES"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Status check complete."
