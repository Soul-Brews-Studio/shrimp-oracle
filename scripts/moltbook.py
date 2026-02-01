#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests"]
# ///
"""
Moltbook Python Client for SHRIMP Oracle

Usage: uv run scripts/moltbook.py <command>
   or: ./scripts/moltbook.py <command>
"""

import os
import json
import requests
from pathlib import Path

# Load API key from .env
def load_api_key():
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.startswith("MOLTBOOK_API_KEY="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("MOLTBOOK_API_KEY")

API_BASE = "https://www.moltbook.com/api/v1"
API_KEY = load_api_key()

def headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

def status():
    """Get agent status"""
    r = requests.get(f"{API_BASE}/agents/me", headers=headers())
    return r.json()

def feed(sort="new", limit=10):
    """Get feed"""
    r = requests.get(f"{API_BASE}/posts?sort={sort}&limit={limit}", headers=headers())
    return r.json()

def post(title: str, content: str, submolt: str = "general"):
    """Create a new post"""
    data = {
        "title": title,
        "content": content,
        "submolt": submolt
    }
    r = requests.post(f"{API_BASE}/posts", headers=headers(), json=data)
    return r.json()

def post_from_file(filepath: str):
    """Post from JSON file"""
    with open(filepath) as f:
        data = json.load(f)
    r = requests.post(f"{API_BASE}/posts", headers=headers(), json=data)
    return r.json()

def upvote(post_id: str):
    """Upvote a post"""
    r = requests.post(f"{API_BASE}/posts/{post_id}/upvote", headers=headers())
    return r.json()

def view(post_id: str):
    """View a post"""
    r = requests.get(f"{API_BASE}/posts/{post_id}", headers=headers())
    return r.json()

def dm_check():
    """Check DM activity"""
    r = requests.get(f"{API_BASE}/agents/dm/check", headers=headers())
    return r.json()

def dm_send_request(to: str, message: str):
    """Send DM request"""
    data = {"to": to, "message": message}
    r = requests.post(f"{API_BASE}/agents/dm/request", headers=headers(), json=data)
    return r.json()

def main():
    import sys

    if len(sys.argv) < 2:
        print("🦞 Moltbook Python Client")
        print("\nCommands:")
        print("  status              - Check agent status")
        print("  feed [sort] [n]     - View feed")
        print("  post <title> <content> [submolt]")
        print("  post-file <path>    - Post from JSON")
        print("  upvote <id>         - Upvote post")
        print("  view <id>           - View post")
        print("  dm-check            - Check DMs")
        print("  dm <to> <msg>       - Send DM request")
        return

    cmd = sys.argv[1]

    if cmd == "status":
        result = status()
        print(json.dumps(result, indent=2))

    elif cmd == "feed":
        sort = sys.argv[2] if len(sys.argv) > 2 else "new"
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        result = feed(sort, limit)
        if "posts" in result:
            for p in result["posts"]:
                print(f"[{p.get('id', 'no-id')[:8]}] {p.get('title', 'No title')}")
        else:
            print(json.dumps(result, indent=2))

    elif cmd == "post":
        if len(sys.argv) < 4:
            print("Usage: moltbook.py post <title> <content> [submolt]")
            return
        title = sys.argv[2]
        content = sys.argv[3]
        submolt = sys.argv[4] if len(sys.argv) > 4 else "general"
        result = post(title, content, submolt)
        print(json.dumps(result, indent=2))

    elif cmd == "post-file":
        if len(sys.argv) < 3:
            print("Usage: moltbook.py post-file <path>")
            return
        result = post_from_file(sys.argv[2])
        print(json.dumps(result, indent=2))

    elif cmd == "upvote":
        if len(sys.argv) < 3:
            print("Usage: moltbook.py upvote <post-id>")
            return
        result = upvote(sys.argv[2])
        print(json.dumps(result, indent=2))

    elif cmd == "view":
        if len(sys.argv) < 3:
            print("Usage: moltbook.py view <post-id>")
            return
        result = view(sys.argv[2])
        print(json.dumps(result, indent=2))

    elif cmd == "dm-check":
        result = dm_check()
        print(json.dumps(result, indent=2))

    elif cmd == "dm":
        if len(sys.argv) < 4:
            print("Usage: moltbook.py dm <to> <message>")
            return
        result = dm_send_request(sys.argv[2], sys.argv[3])
        print(json.dumps(result, indent=2))

    else:
        print(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()
