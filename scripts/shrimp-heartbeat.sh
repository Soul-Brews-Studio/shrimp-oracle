#!/bin/bash
# SHRIMP Heartbeat - Autonomous cron task
# Runs periodically to check Moltbook, respond, research
# Usage: ./scripts/shrimp-heartbeat.sh [--dry-run]
#
# Cron example (every 2 hours):
# 0 */2 * * * cd /path/to/shrimp-oracle && ./scripts/shrimp-heartbeat.sh >> ψ/memory/logs/heartbeat.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/ψ/memory/logs"
DRY_RUN=false

if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
fi

mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

echo ""
echo "═══════════════════════════════════════════════"
echo "🦞 SHRIMP Heartbeat - $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════"

# Load API key
if [ -f .env ]; then
    source .env
fi

# 1. Check Moltbook notifications/replies
echo ""
echo "## Step 1: Check Moltbook"
if [ -n "$MOLTBOOK_API_KEY" ]; then
    # Get recent activity on our posts
    ACTIVITY=$(curl -s -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
        "https://moltbook.com/api/v1/me/notifications" 2>/dev/null || echo '{"notifications":[]}')

    NOTIF_COUNT=$(echo "$ACTIVITY" | grep -c '"type"' 2>/dev/null || echo "0")
    NOTIF_COUNT=$(echo "$NOTIF_COUNT" | tr -d '[:space:]')
    echo "  📬 Notifications: $NOTIF_COUNT"

    if [ "$NOTIF_COUNT" -gt 0 ] 2>/dev/null && [ "$DRY_RUN" = false ]; then
        echo "  → Would process notifications with claude -p"
        # TODO: Process each notification
        # claude -p "Process this Moltbook notification and decide if/how to respond: $NOTIF"
    fi
else
    echo "  ⚠️  No Moltbook API key"
fi

# 2. Check GitHub issues assigned to us
echo ""
echo "## Step 2: Check GitHub Issues"
NEW_ISSUES=$(gh issue list --repo Soul-Brews-Studio/shrimp-oracle \
    --state open --json number,title,createdAt \
    --jq '.[] | select(.createdAt > (now - 7200 | todate))' 2>/dev/null || echo "")

if [ -n "$NEW_ISSUES" ]; then
    echo "  🆕 New issues in last 2 hours:"
    echo "$NEW_ISSUES" | head -5
else
    echo "  ✅ No new issues"
fi

# 3. Check if we should post to Moltbook (rate limit: 30min)
echo ""
echo "## Step 3: Check Post Queue"
QUEUED=$(find ψ/outbox -name "*.json" -type f 2>/dev/null | head -1)
if [ -n "$QUEUED" ]; then
    echo "  📤 Queued post found: $QUEUED"
    if [ "$DRY_RUN" = false ]; then
        echo "  → Attempting to post..."
        ./scripts/moltbook.sh post-file "$QUEUED" && rm "$QUEUED" || echo "  ⚠️  Rate limited, will retry later"
    fi
else
    echo "  ✅ No queued posts"
fi

# 4. Log heartbeat
echo ""
echo "## Step 4: Log Heartbeat"
HEARTBEAT_FILE="$LOG_DIR/heartbeat-$(date '+%Y-%m-%d').log"
echo "$(date '+%H:%M:%S') - Heartbeat complete" >> "$HEARTBEAT_FILE"
echo "  📝 Logged to: $HEARTBEAT_FILE"

# 5. Summary
echo ""
echo "═══════════════════════════════════════════════"
echo "Heartbeat complete at $(date '+%H:%M:%S')"
if [ "$DRY_RUN" = true ]; then
    echo "(DRY RUN - no actions taken)"
fi
echo "═══════════════════════════════════════════════"
