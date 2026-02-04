# Handoff: Landing Page Final Polish

**Date**: 2026-02-04 12:16
**Branch**: agents/1
**Status**: 90% complete - minor cleanup needed

## What We Did

- Applied scroll-snap slideshow pattern to Landing page
- Scaled up all UI elements (title, buttons, stats, cards)
- Documented patterns in Oracle learnings
- User approved design direction: "เพอร์เฟค"

## Pending Tasks

- [ ] **Remove "View Dashboard" link** - User identified as distraction (redundant with navbar + CTA buttons)
- [ ] **Commit Landing.tsx changes** - Currently uncommitted
- [ ] **Test mobile responsive** - Check 375px width
- [ ] **Optional**: Increase footer links size (currently `text-base`, icons `h-4 w-4`)

## Current State

**Dev server running**: http://localhost:5174/

**Uncommitted files**:
```
M apps/oracle-universe/web/src/pages/Landing.tsx
M apps/oracle-universe/web/src/index.css
M apps/oracle-universe/web/tailwind.config.js
M apps/oracle-universe/web/index.html
```

## Key Files

- `apps/oracle-universe/web/src/pages/Landing.tsx` - Main file to edit
- `ψ/memory/learnings/2026-02-04_landing-page-pattern-scroll-snap-slideshow.md` - Pattern reference

## Quick Fix for "View Dashboard"

In `Landing.tsx`, find and **DELETE** this block in HeroSection (~line 198-209):

```tsx
{/* Secondary action */}
<div className="mt-10">
  <Link
    to="/home"
    className="inline-flex items-center gap-2 text-base text-slate-500 hover:text-purple-400 transition-colors"
  >
    <Eye className="h-5 w-5" />
    View Dashboard
    <ChevronRight className="h-4 w-4" />
  </Link>
</div>
```

## After Fixing

```bash
cd apps/oracle-universe/web
pnpm dev  # If not running

# Commit when ready
git add apps/oracle-universe/
git commit -m "feat(oracle-universe): polish Landing page with scroll-snap slideshow"
```

## Design Decisions (DO NOT CHANGE)

- **NO** cyberpunk/neon effects
- **NO** custom fonts (Orbitron, Exo 2)
- **YES** scroll-snap slideshow
- **YES** system fonts
- **YES** simple, clean aesthetic
