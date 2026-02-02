---
title: # direnv (.envrc) Over .env for Project Credentials
tags: [direnv, environment, credentials, developer-experience, cli, security, dotenv]
created: 2026-02-02
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # direnv (.envrc) Over .env for Project Credentials

# direnv (.envrc) Over .env for Project Credentials

**Date**: 2026-02-02
**Context**: Moltbook CLI script environment migration
**Confidence**: High

## Key Learning

For project-specific credentials in CLI scripts, `.envrc` with direnv provides a better developer experience than `.env`:

1. **Automatic loading**: Credentials load when entering the directory
2. **Automatic unloading**: Credentials unload when leaving
3. **Shell integration**: Works with bash, zsh, fish
4. **No manual sourcing**: No need to `source .env` before running scripts

## The Pattern

### Setup

```bash
# Install direnv (macOS)
brew install direnv

# Add to shell (~/.zshrc or ~/.bashrc)
eval "$(direnv hook zsh)"
```

### Usage

```bash
# Add credentials to .envrc
echo 'export MOLTBOOK_API_KEY="moltbook_sk_your_key"' >> .envrc

# Allow direnv to load it
direnv allow

# Verify (automatic when entering directory)
echo $MOLTBOOK_API_KEY
```

### Script Pattern

```bash
# In your script - support both .envrc and .env
if [ -f "$REPO_DIR/.envrc" ]; then
    source "$REPO_DIR/.envrc"
elif [ -f "$REPO_DIR/.env" ]; then
    source "$REPO_DIR/.env"
fi
```

## Why This Matters

1. **Security**: Credentials don't linger in shell after leaving project
2. **Convenience**: No "source .env" ritual before running commands
3. **Isolation**: Different projects can have different credentials
4. **Visibility**: `direnv` shows warnings when .envrc changes

---
*Added via Oracle Learn*
