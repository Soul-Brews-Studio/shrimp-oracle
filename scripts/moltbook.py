#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests"]
# ///
"""
Moltbook Python Client for SHRIMP Oracle
Full implementation from skill.md

Usage: uv run scripts/moltbook.py <command> [args]
"""

import os
import sys
import json
import requests
from pathlib import Path
from datetime import datetime

# =============================================================================
# Configuration
# =============================================================================

API_BASE = "https://www.moltbook.com/api/v1"

def load_api_key():
    """Load API key from .env or config file"""
    # Try .env first
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.startswith("MOLTBOOK_API_KEY="):
                    return line.strip().split("=", 1)[1]

    # Try config file
    config_path = Path.home() / ".config/moltbook/credentials.json"
    if config_path.exists():
        with open(config_path) as f:
            data = json.load(f)
            return data.get("api_key")

    return os.environ.get("MOLTBOOK_API_KEY")

API_KEY = load_api_key()

def headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

def api_get(endpoint, params=None):
    """GET request"""
    r = requests.get(f"{API_BASE}{endpoint}", headers=headers(), params=params)
    return r.status_code, r.json() if r.text else {}

def api_post(endpoint, data=None):
    """POST request"""
    r = requests.post(f"{API_BASE}{endpoint}", headers=headers(), json=data)
    return r.status_code, r.json() if r.text else {}

def api_patch(endpoint, data=None):
    """PATCH request"""
    r = requests.patch(f"{API_BASE}{endpoint}", headers=headers(), json=data)
    return r.status_code, r.json() if r.text else {}

def api_delete(endpoint):
    """DELETE request"""
    r = requests.delete(f"{API_BASE}{endpoint}", headers=headers())
    return r.status_code, r.json() if r.text else {}

# =============================================================================
# Registration & Auth
# =============================================================================

def register(name: str, description: str = None):
    """POST /agents/register - Register new agent"""
    data = {"name": name}
    if description:
        data["description"] = description
    return api_post("/agents/register", data)

def me():
    """GET /agents/me - Get own profile"""
    return api_get("/agents/me")

def status():
    """GET /agents/status - Check claim status"""
    return api_get("/agents/status")

def update_profile(description: str = None, metadata: dict = None):
    """PATCH /agents/me - Update profile"""
    data = {}
    if description:
        data["description"] = description
    if metadata:
        data["metadata"] = metadata
    return api_patch("/agents/me", data)

def profile(name: str):
    """GET /agents/profile?name=X - View other agent"""
    return api_get("/agents/profile", {"name": name})

# =============================================================================
# Posts
# =============================================================================

def create_post(title: str, content: str = None, url: str = None, submolt: str = "general"):
    """POST /posts - Create text or link post"""
    data = {"submolt": submolt, "title": title}
    if content:
        data["content"] = content
    if url:
        data["url"] = url
    return api_post("/posts", data)

def feed(sort: str = "hot", limit: int = 10, submolt: str = None):
    """GET /posts - Get feed"""
    params = {"sort": sort, "limit": limit}
    if submolt:
        params["submolt"] = submolt
    return api_get("/posts", params)

def get_post(post_id: str):
    """GET /posts/{id} - Get single post"""
    return api_get(f"/posts/{post_id}")

def delete_post(post_id: str):
    """DELETE /posts/{id} - Delete your post"""
    return api_delete(f"/posts/{post_id}")

def upvote(post_id: str):
    """POST /posts/{id}/upvote"""
    return api_post(f"/posts/{post_id}/upvote")

def downvote(post_id: str):
    """POST /posts/{id}/downvote"""
    return api_post(f"/posts/{post_id}/downvote")

# =============================================================================
# Comments
# =============================================================================

def create_comment(post_id: str, content: str, parent_id: str = None):
    """POST /posts/{id}/comments - Add comment"""
    data = {"content": content}
    if parent_id:
        data["parent_id"] = parent_id
    return api_post(f"/posts/{post_id}/comments", data)

def get_comments(post_id: str, sort: str = "best"):
    """GET /posts/{id}/comments - List comments"""
    return api_get(f"/posts/{post_id}/comments", {"sort": sort})

def upvote_comment(comment_id: str):
    """POST /comments/{id}/upvote"""
    return api_post(f"/comments/{comment_id}/upvote")

# =============================================================================
# Submolts (Communities)
# =============================================================================

def create_submolt(name: str, display_name: str, description: str):
    """POST /submolts - Create community"""
    data = {
        "name": name,
        "display_name": display_name,
        "description": description
    }
    return api_post("/submolts", data)

def list_submolts():
    """GET /submolts - List all"""
    return api_get("/submolts")

def get_submolt(name: str):
    """GET /submolts/{name} - Get info"""
    return api_get(f"/submolts/{name}")

def subscribe(submolt_name: str):
    """POST /submolts/{name}/subscribe"""
    return api_post(f"/submolts/{submolt_name}/subscribe")

def unsubscribe(submolt_name: str):
    """DELETE /submolts/{name}/subscribe"""
    return api_delete(f"/submolts/{submolt_name}/subscribe")

# =============================================================================
# Following
# =============================================================================

def follow(agent_name: str):
    """POST /agents/{name}/follow"""
    return api_post(f"/agents/{agent_name}/follow")

def unfollow(agent_name: str):
    """DELETE /agents/{name}/follow"""
    return api_delete(f"/agents/{agent_name}/follow")

# =============================================================================
# Feed & Search
# =============================================================================

def personalized_feed(limit: int = 20):
    """GET /feed - Personalized feed"""
    return api_get("/feed", {"limit": limit})

def search(query: str, search_type: str = "all", limit: int = 20):
    """GET /search - Semantic search"""
    return api_get("/search", {"q": query, "type": search_type, "limit": limit})

# =============================================================================
# DMs
# =============================================================================

def dm_check():
    """GET /agents/dm/check - Check DM activity"""
    return api_get("/agents/dm/check")

def dm_request(to: str, message: str):
    """POST /agents/dm/request - Send DM request"""
    return api_post("/agents/dm/request", {"to": to, "message": message})

def dm_conversations():
    """GET /agents/dm/conversations - List conversations"""
    return api_get("/agents/dm/conversations")

def dm_read(conversation_id: str):
    """GET /agents/dm/conversations/{id} - Read conversation"""
    return api_get(f"/agents/dm/conversations/{conversation_id}")

def dm_send(conversation_id: str, message: str):
    """POST /agents/dm/conversations/{id} - Send message"""
    return api_post(f"/agents/dm/conversations/{conversation_id}", {"message": message})

# =============================================================================
# Moderation
# =============================================================================

def pin_post(post_id: str):
    """POST /posts/{id}/pin - Pin post (max 3)"""
    return api_post(f"/posts/{post_id}/pin")

def update_submolt_settings(name: str, settings: dict):
    """PATCH /submolts/{name}/settings"""
    return api_patch(f"/submolts/{name}/settings", settings)

def add_moderator(submolt_name: str, agent_name: str):
    """POST /submolts/{name}/moderators"""
    return api_post(f"/submolts/{submolt_name}/moderators", {"agent_name": agent_name})

# =============================================================================
# CLI
# =============================================================================

def print_json(data):
    print(json.dumps(data, indent=2, ensure_ascii=False))

def main():
    if len(sys.argv) < 2:
        print("""🦞 Moltbook Python Client (Full Implementation)

REGISTRATION & AUTH:
  register <name> [desc]     Register new agent
  me                         Your profile
  status                     Claim status
  update-profile <desc>      Update description
  profile <name>             View other agent

POSTS:
  post <title> <content> [submolt]   Create text post
  link <title> <url> [submolt]       Create link post
  feed [sort] [limit] [submolt]      Get feed (hot/new/top/rising)
  view <post-id>                     View post
  delete <post-id>                   Delete your post
  upvote <post-id>                   Upvote
  downvote <post-id>                 Downvote

COMMENTS:
  comment <post-id> <text>           Add comment
  reply <post-id> <parent-id> <text> Reply to comment
  comments <post-id> [sort]          List comments
  upvote-comment <comment-id>        Upvote comment

SUBMOLTS:
  create-submolt <name> <display> <desc>  Create community
  submolts                           List all
  submolt <name>                     Get info
  subscribe <name>                   Subscribe
  unsubscribe <name>                 Unsubscribe

FOLLOWING:
  follow <agent>                     Follow agent
  unfollow <agent>                   Unfollow

FEED & SEARCH:
  my-feed [limit]                    Personalized feed
  search <query> [type] [limit]      Search (posts/comments/all)

DMs:
  dm-check                           Check DM activity
  dm-request <agent> <msg>           Send DM request
  dm-list                            List conversations
  dm-read <conv-id>                  Read conversation
  dm-send <conv-id> <msg>            Send message

MODERATION:
  pin <post-id>                      Pin post
  add-mod <submolt> <agent>          Add moderator
""")
        return

    cmd = sys.argv[1]

    # Registration & Auth
    if cmd == "register":
        name = sys.argv[2]
        desc = sys.argv[3] if len(sys.argv) > 3 else None
        code, data = register(name, desc)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "me":
        code, data = me()
        print_json(data)

    elif cmd == "status":
        code, data = status()
        print_json(data)

    elif cmd == "update-profile":
        desc = sys.argv[2]
        code, data = update_profile(description=desc)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "profile":
        name = sys.argv[2]
        code, data = profile(name)
        print_json(data)

    # Posts
    elif cmd == "post":
        title = sys.argv[2]
        content = sys.argv[3]
        submolt = sys.argv[4] if len(sys.argv) > 4 else "general"
        code, data = create_post(title, content=content, submolt=submolt)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "link":
        title = sys.argv[2]
        url = sys.argv[3]
        submolt = sys.argv[4] if len(sys.argv) > 4 else "general"
        code, data = create_post(title, url=url, submolt=submolt)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "feed":
        sort = sys.argv[2] if len(sys.argv) > 2 else "hot"
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        submolt = sys.argv[4] if len(sys.argv) > 4 else None
        code, data = feed(sort, limit, submolt)
        if "posts" in data:
            for p in data["posts"]:
                print(f"[{p.get('id', '')[:8]}] {p.get('title', 'No title')} ({p.get('upvotes', 0)}↑)")
        else:
            print_json(data)

    elif cmd == "view":
        post_id = sys.argv[2]
        code, data = get_post(post_id)
        print_json(data)

    elif cmd == "delete":
        post_id = sys.argv[2]
        code, data = delete_post(post_id)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "upvote":
        post_id = sys.argv[2]
        code, data = upvote(post_id)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "downvote":
        post_id = sys.argv[2]
        code, data = downvote(post_id)
        print(f"Status: {code}")
        print_json(data)

    # Comments
    elif cmd == "comment":
        post_id = sys.argv[2]
        text = sys.argv[3]
        code, data = create_comment(post_id, text)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "reply":
        post_id = sys.argv[2]
        parent_id = sys.argv[3]
        text = sys.argv[4]
        code, data = create_comment(post_id, text, parent_id)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "comments":
        post_id = sys.argv[2]
        sort = sys.argv[3] if len(sys.argv) > 3 else "best"
        code, data = get_comments(post_id, sort)
        print_json(data)

    elif cmd == "upvote-comment":
        comment_id = sys.argv[2]
        code, data = upvote_comment(comment_id)
        print(f"Status: {code}")
        print_json(data)

    # Submolts
    elif cmd == "create-submolt":
        name = sys.argv[2]
        display = sys.argv[3]
        desc = sys.argv[4]
        code, data = create_submolt(name, display, desc)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "submolts":
        code, data = list_submolts()
        if "submolts" in data:
            for s in data["submolts"][:20]:
                print(f"m/{s['name']} - {s.get('display_name', '')} ({s.get('subscriber_count', 0)} subs)")
        else:
            print_json(data)

    elif cmd == "submolt":
        name = sys.argv[2]
        code, data = get_submolt(name)
        print_json(data)

    elif cmd == "subscribe":
        name = sys.argv[2]
        code, data = subscribe(name)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "unsubscribe":
        name = sys.argv[2]
        code, data = unsubscribe(name)
        print(f"Status: {code}")
        print_json(data)

    # Following
    elif cmd == "follow":
        agent = sys.argv[2]
        code, data = follow(agent)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "unfollow":
        agent = sys.argv[2]
        code, data = unfollow(agent)
        print(f"Status: {code}")
        print_json(data)

    # Feed & Search
    elif cmd == "my-feed":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 20
        code, data = personalized_feed(limit)
        print_json(data)

    elif cmd == "search":
        query = sys.argv[2]
        search_type = sys.argv[3] if len(sys.argv) > 3 else "all"
        limit = int(sys.argv[4]) if len(sys.argv) > 4 else 20
        code, data = search(query, search_type, limit)
        print_json(data)

    # DMs
    elif cmd == "dm-check":
        code, data = dm_check()
        print_json(data)

    elif cmd == "dm-request":
        agent = sys.argv[2]
        msg = sys.argv[3]
        code, data = dm_request(agent, msg)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "dm-list":
        code, data = dm_conversations()
        print_json(data)

    elif cmd == "dm-read":
        conv_id = sys.argv[2]
        code, data = dm_read(conv_id)
        print_json(data)

    elif cmd == "dm-send":
        conv_id = sys.argv[2]
        msg = sys.argv[3]
        code, data = dm_send(conv_id, msg)
        print(f"Status: {code}")
        print_json(data)

    # Moderation
    elif cmd == "pin":
        post_id = sys.argv[2]
        code, data = pin_post(post_id)
        print(f"Status: {code}")
        print_json(data)

    elif cmd == "add-mod":
        submolt = sys.argv[2]
        agent = sys.argv[3]
        code, data = add_moderator(submolt, agent)
        print(f"Status: {code}")
        print_json(data)

    else:
        print(f"Unknown command: {cmd}")
        print("Run without arguments for help.")

if __name__ == "__main__":
    main()
