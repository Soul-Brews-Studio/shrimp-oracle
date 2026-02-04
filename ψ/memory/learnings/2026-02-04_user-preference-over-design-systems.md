# User Preference Over Design Systems

**Date**: 2026-02-04
**Context**: Oracle Universe Landing Page UI/UX session
**Confidence**: High

## Key Learning

Design system recommendations (like "UI/UX Pro Max" suggesting cyberpunk aesthetics) are starting points, not mandates. When a user immediately pushes back on a design direction, pivot quickly rather than defending the approach.

The key phrase "look at our history" is a signal that the user knows what they want and it already exists in the codebase. Search git history and archives before creating new designs.

## The Pattern

```
1. User requests UI improvement
2. BEFORE implementing: Ask "Do you have a reference or past design you liked?"
3. If yes: Find and adapt existing pattern
4. If no: Show minimal options first, iterate incrementally
5. AVOID: Big-bang design changes based on skill recommendations alone
```

## Why This Matters

- Saves time by avoiding rejected work
- User preferences > theoretical best practices
- Archived code is a treasure trove of proven patterns
- "Simple and clean" often wins over "fancy and complex"

## Signs to Watch For

- "ชอบแบบเดิม" (prefer the original) = stop, revert
- "ไม่ชอบแบบ X" (don't like X style) = design direction wrong
- "แบบที่เคยทำ" (like we did before) = search history
- "เพอร์เฟค" (perfect) = lock it in, document pattern

## Tags

`ui-ux`, `user-preference`, `design-patterns`, `iteration`, `archives`
