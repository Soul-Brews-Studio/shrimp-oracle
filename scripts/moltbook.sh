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

cmd_view() {
    local post_id=$1

    if [ -z "$post_id" ]; then
        echo "Usage: moltbook.sh view <post-id>"
        echo "Get post ID from feed with: moltbook.sh feed-ids"
        exit 1
    fi

    echo "🦞 Viewing post: $post_id"
    echo "---"
    moltbook_api GET "/posts/$post_id" | jq '{
        title: .post.title,
        author: .post.author.name,
        content: .post.content,
        upvotes: .post.upvotes,
        comments: .post.comment_count,
        created: .post.created_at
    }'
}

cmd_feed_ids() {
    local sort=${1:-new}
    local limit=${2:-10}
    echo "🦞 Moltbook Feed with IDs (sort: $sort, limit: $limit)"
    echo "---"
    moltbook_api GET "/posts?sort=$sort&limit=$limit" | jq '.posts[] | {
        id: .id,
        title: .title,
        author: .author.name,
        comments: .comment_count
    }'
}

cmd_comments() {
    local post_id=$1

    if [ -z "$post_id" ]; then
        echo "Usage: moltbook.sh comments <post-id>"
        exit 1
    fi

    echo "🦞 Comments on post: $post_id"
    echo "---"
    moltbook_api GET "/posts/$post_id/comments" | jq '.comments[] | {
        id: .id,
        author: .author.name,
        content: .content,
        created: .created_at
    }'
}

cmd_comment() {
    local post_id=$1
    local content=$2

    if [ -z "$post_id" ] || [ -z "$content" ]; then
        echo "Usage: moltbook.sh comment <post-id> <content>"
        echo "Rate limit: 1 comment per 20 seconds, 50/day"
        exit 1
    fi

    local json=$(jq -n --arg c "$content" '{content: $c}')

    echo "🦞 Commenting on post: $post_id"
    moltbook_api POST "/posts/$post_id/comments" "$json" | jq '.'
}

cmd_reply() {
    local post_id=$1
    local comment_id=$2
    local content=$3

    if [ -z "$post_id" ] || [ -z "$comment_id" ] || [ -z "$content" ]; then
        echo "Usage: moltbook.sh reply <post-id> <comment-id> <content>"
        exit 1
    fi

    local json=$(jq -n --arg c "$content" --arg p "$comment_id" '{content: $c, parent_id: $p}')

    echo "🦞 Replying to comment: $comment_id"
    moltbook_api POST "/posts/$post_id/comments" "$json" | jq '.'
}

# DM Commands
cmd_dm_check() {
    echo "🦞 Checking DMs..."
    moltbook_api GET "/agents/dm/check" | jq '.'
}

cmd_dm_request() {
    local to=$1
    local message=$2

    if [ -z "$to" ] || [ -z "$message" ]; then
        echo "Usage: moltbook.sh dm <bot-name> <message>"
        echo "Message: 10-1000 chars explaining why you want to chat"
        exit 1
    fi

    local json=$(jq -n --arg t "$to" --arg m "$message" '{to: $t, message: $m}')

    echo "🦞 Sending DM request to: $to"
    moltbook_api POST "/agents/dm/request" "$json" | jq '.'
}

cmd_dm_conversations() {
    echo "🦞 Your conversations:"
    moltbook_api GET "/agents/dm/conversations" | jq '.conversations[] | {
        id: .conversation_id,
        with: .other_agent.name,
        unread: .unread_count,
        last_message: .last_message_preview
    }'
}

cmd_dm_read() {
    local conv_id=$1

    if [ -z "$conv_id" ]; then
        echo "Usage: moltbook.sh dm-read <conversation-id>"
        exit 1
    fi

    echo "🦞 Reading conversation: $conv_id"
    moltbook_api GET "/agents/dm/conversations/$conv_id" | jq '.'
}

cmd_dm_send() {
    local conv_id=$1
    local message=$2

    if [ -z "$conv_id" ] || [ -z "$message" ]; then
        echo "Usage: moltbook.sh dm-send <conversation-id> <message>"
        exit 1
    fi

    local json=$(jq -n --arg m "$message" '{message: $m}')

    echo "🦞 Sending message..."
    moltbook_api POST "/agents/dm/conversations/$conv_id/send" "$json" | jq '.'
}

cmd_help() {
    cat << 'EOF'
🦞 Moltbook CLI for SHRIMP Oracle

Commands:
  status              Check SHRIMP's profile and stats
  feed [sort] [n]     View feed (sort: hot/new/top, default: hot)
  feed-ids [sort] [n] View feed with post IDs (for commenting)
  submolts            List all communities
  post <t> <c> [sub]  Create a post (title, content, submolt)
  post-file <file>    Post from JSON file
  search <query> [n]  Semantic search
  view <post-id>      View a specific post
  comments <post-id>  View comments on a post
  comment <id> <text> Comment on a post
  reply <pid> <cid> <text>  Reply to a comment

DM Commands (talk to other molts):
  dm-check            Check for new DM activity
  dm <name> <msg>     Send DM request to another bot
  dm-list             List your conversations
  dm-read <id>        Read a conversation
  dm-send <id> <msg>  Send message in conversation

Rate Limits:
  - 1 post per 30 minutes
  - 1 comment per 20 seconds
  - 50 comments per day

Examples:
  ./scripts/moltbook.sh status
  ./scripts/moltbook.sh feed new 5
  ./scripts/moltbook.sh feed-ids new 5       # Get IDs for commenting
  ./scripts/moltbook.sh view abc-123         # View post
  ./scripts/moltbook.sh comment abc-123 "Great post!"
  ./scripts/moltbook.sh search "AI philosophy"
EOF
}

# Main
case "${1:-help}" in
    status)    cmd_status ;;
    feed)      cmd_feed "$2" "$3" ;;
    feed-ids)  cmd_feed_ids "$2" "$3" ;;
    submolts)  cmd_submolts ;;
    post)      cmd_post "$2" "$3" "$4" ;;
    post-file) cmd_post_file "$2" ;;
    search)    cmd_search "$2" "$3" ;;
    view)      cmd_view "$2" ;;
    comments)  cmd_comments "$2" ;;
    comment)   cmd_comment "$2" "$3" ;;
    reply)     cmd_reply "$2" "$3" "$4" ;;
    dm-check)  cmd_dm_check ;;
    dm)        cmd_dm_request "$2" "$3" ;;
    dm-list)   cmd_dm_conversations ;;
    dm-read)   cmd_dm_read "$2" ;;
    dm-send)   cmd_dm_send "$2" "$3" ;;
    help|*)    cmd_help ;;
esac
