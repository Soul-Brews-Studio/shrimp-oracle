#!/bin/bash
# Moltbook CLI for SHRIMP Oracle
# Usage: ./scripts/moltbook.sh <command> [args]

set -e

# Load API key from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$REPO_DIR/.env" ]; then
    source "$REPO_DIR/.env"
fi

if [ -z "$MOLTBOOK_API_KEY" ]; then
    echo "❌ MOLTBOOK_API_KEY not found. Create .env with your key."
    exit 1
fi

API_BASE="https://www.moltbook.com/api/v1"

# Helper function for API calls
moltbook_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ -n "$data" ]; then
        curl -s -X "$method" "$API_BASE$endpoint" \
            -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "$API_BASE$endpoint" \
            -H "Authorization: Bearer $MOLTBOOK_API_KEY"
    fi
}

# Commands
cmd_status() {
    echo "🦞 SHRIMP Oracle Status on Moltbook"
    echo "---"
    moltbook_api GET "/agents/me" | jq '{
        name: .agent.name,
        karma: .agent.karma,
        posts: .agent.stats.posts,
        comments: .agent.stats.comments,
        claimed: .agent.is_claimed,
        last_active: .agent.last_active
    }'
}

cmd_feed() {
    local sort=${1:-hot}
    local limit=${2:-10}
    echo "🦞 Moltbook Feed (sort: $sort, limit: $limit)"
    echo "---"
    moltbook_api GET "/posts?sort=$sort&limit=$limit" | jq '.posts[] | {
        title: .title,
        author: .author.name,
        upvotes: .upvotes,
        comments: .comment_count,
        submolt: .submolt.name
    }'
}

cmd_submolts() {
    echo "🦞 Moltbook Submolts (Communities)"
    echo "---"
    moltbook_api GET "/submolts" | jq '.submolts[:20] | .[] | {
        name: .name,
        display: .display_name,
        subscribers: .subscriber_count
    }'
}

cmd_post() {
    local title=$1
    local content=$2
    local submolt=${3:-general}

    if [ -z "$title" ] || [ -z "$content" ]; then
        echo "Usage: moltbook.sh post <title> <content> [submolt]"
        exit 1
    fi

    # Create JSON safely
    local json=$(jq -n \
        --arg t "$title" \
        --arg c "$content" \
        --arg s "$submolt" \
        '{submolt: $s, title: $t, content: $c}')

    echo "🦞 Posting to m/$submolt..."
    moltbook_api POST "/posts" "$json" | jq '.'
}

cmd_post_file() {
    local file=$1

    if [ -z "$file" ] || [ ! -f "$file" ]; then
        echo "Usage: moltbook.sh post-file <json-file>"
        exit 1
    fi

    echo "🦞 Posting from file: $file"
    curl -s -X POST "$API_BASE/posts" \
        -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$file" | jq '.'
}

cmd_search() {
    local query=$1
    local limit=${2:-10}

    if [ -z "$query" ]; then
        echo "Usage: moltbook.sh search <query> [limit]"
        exit 1
    fi

    echo "🦞 Searching: $query"
    moltbook_api GET "/search?q=$(echo "$query" | jq -sRr @uri)&limit=$limit" | jq '.results[] | {
        type: .type,
        title: .title,
        author: .author.name,
        similarity: .similarity
    }'
}

cmd_help() {
    cat << 'EOF'
🦞 Moltbook CLI for SHRIMP Oracle

Commands:
  status              Check SHRIMP's profile and stats
  feed [sort] [n]     View feed (sort: hot/new/top, default: hot)
  submolts            List all communities
  post <t> <c> [sub]  Create a post (title, content, submolt)
  post-file <file>    Post from JSON file
  search <query> [n]  Semantic search

Rate Limits:
  - 1 post per 30 minutes
  - 1 comment per 20 seconds
  - 50 comments per day

Examples:
  ./scripts/moltbook.sh status
  ./scripts/moltbook.sh feed new 5
  ./scripts/moltbook.sh post "Hello" "My first post" general
  ./scripts/moltbook.sh post-file ψ/outbox/post.json
  ./scripts/moltbook.sh search "AI philosophy"
EOF
}

# Main
case "${1:-help}" in
    status)    cmd_status ;;
    feed)      cmd_feed "$2" "$3" ;;
    submolts)  cmd_submolts ;;
    post)      cmd_post "$2" "$3" "$4" ;;
    post-file) cmd_post_file "$2" ;;
    search)    cmd_search "$2" "$3" ;;
    help|*)    cmd_help ;;
esac
