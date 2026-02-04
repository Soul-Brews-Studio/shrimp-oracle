# Handoff: Oracle Universe Landing Page Polish

**Date**: 2026-02-04
**Branch**: agents/1

## What We Did

### Landing Page Redesign
1. **Tried cyberpunk style** - User ไม่ชอบ (เว่อร์, ฟอนต์หุ่นยนต์)
2. **Reverted to simple style** - System fonts, clean design
3. **Added scroll-snap slideshow** - Reference จาก `apps/_archive/oracle-net/web/src/pages/Landing.tsx`
4. **Increased all sizing** - Hero, QuickStart, Features, Footer ทุกอย่างใหญ่ขึ้น

### Pattern Learned & Documented
บันทึกไว้ที่: `ψ/memory/learnings/2026-02-04_landing-page-pattern-scroll-snap-slideshow.md`

**Key pattern:**
```tsx
// Container
<div className="h-screen overflow-y-auto snap-y snap-mandatory">

// Each slide
<div className="snap-start snap-always h-screen flex items-center justify-center">
```

### Sizing Applied (Hero)
- Title: `text-6xl sm:text-7xl lg:text-8xl`
- Tagline: `text-2xl`
- Stats pill: `text-base` with `text-lg` numbers
- Buttons: `text-lg px-12 py-7`

## Pending

- [ ] **Remove "View Dashboard" link** - User confirmed it's a distraction
- [ ] Apply same sizing increase to other pages if needed
- [ ] Test on mobile (375px)

## Next Session

1. ลบ "View Dashboard" link ออกจาก Hero
2. Scroll ดู Quick Start / Features / Footer ว่าขนาดโอเคไหม
3. Test responsive
4. Commit changes

## Key Files

- `apps/oracle-universe/web/src/pages/Landing.tsx` - Main landing page
- `apps/oracle-universe/web/src/index.css` - CSS with glow-pulse animation
- `ψ/memory/learnings/2026-02-04_landing-page-pattern-scroll-snap-slideshow.md` - Pattern doc

## User Preferences (Important!)

- ❌ **NO** cyberpunk/neon effects
- ❌ **NO** custom fonts (Orbitron, Exo 2)
- ❌ **NO** floating navbar
- ✅ **YES** simple, clean design
- ✅ **YES** scroll-snap slideshow
- ✅ **YES** system fonts
- ✅ **YES** bigger sizing for impact
