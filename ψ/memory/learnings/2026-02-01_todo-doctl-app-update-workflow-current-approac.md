---
title: # TODO: doctl app update workflow
tags: [doctl, digitalocean, app-platform, todo]
created: 2026-02-01
source: Oracle Learn
---

# # TODO: doctl app update workflow

# TODO: doctl app update workflow

Current approach uses temp file that disappears on restart.

**Future improvement**: Create reusable shell function for DO App Platform updates:
```bash
do-app-update() {
  local app_id=${1:-f438301e-6716-485e-befb-23d8ecc112cb}
  doctl apps spec get $app_id > /tmp/spec.yaml
  ${EDITOR:-vi} /tmp/spec.yaml
  doctl apps update $app_id --spec /tmp/spec.yaml
  rm /tmp/spec.yaml
}
```

**Context**: Used during credential rotation 2026-02-01

---
*Added via Oracle Learn*
