---
title: # Landing Page Pattern: Scroll Snap Slideshow
tags: [landing-page, scroll-snap, ui-pattern, oracle-universe, react, tailwind]
created: 2026-02-04
source: Oracle Learn
---

# # Landing Page Pattern: Scroll Snap Slideshow

# Landing Page Pattern: Scroll Snap Slideshow

## สิ่งที่ User ชอบ
- **Simple, clean design** - ไม่เอาแบบ cyberpunk/neon/robot/space
- **System fonts** - ไม่ต้องใช้ custom fonts (Orbitron, Exo 2)
- **Scroll Snap Slideshow** - แต่ละ section snap เป็น slide แยก

## Pattern ที่ใช้

### Container
```tsx
<div className="h-screen overflow-y-auto snap-y snap-mandatory bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
```

### Each Slide
```tsx
// Full height slide (Hero, Footer)
<div className="snap-start snap-always h-screen flex items-center justify-center relative">
  <Content />
  <ScrollIndicator /> {/* เฉพาะ Hero */}
</div>

// Min height slide (Content sections)
<div className="snap-start snap-always min-h-screen flex items-center justify-center py-20">
  <Content />
</div>
```

### Scroll Indicator Component
```tsx
function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 z-10">
      <span className="text-xs">Scroll</span>
      <div className="h-8 w-5 rounded-full border-2 border-slate-600 p-1">
        <div className="h-2 w-1.5 rounded-full bg-purple-500 animate-bounce mx-auto" />
      </div>
    </div>
  )
}
```

## Page Structure (4 Slides)
1. **Hero** - h-screen, centered, มี ScrollIndicator
2. **Quick Start** - min-h-screen, tabs with steps
3. **Features** - min-h-screen, 3-column grid
4. **Footer CTA** - h-screen, centered

## สิ่งที่ไม่ควรทำ
- ❌ ใส่ neon glow effects เยอะๆ
- ❌ ใช้ custom fonts แบบ futuristic
- ❌ ทำ floating navbar (ใช้ fixed ธรรมดา)
- ❌ ใส่ content ซ้ำซ้อน (CTA ที่ Hero + Footer พอ)

## Reference
- Original pattern from: `apps/_archive/oracle-net/web/src/pages/Landing.tsx`
- Applied to: `apps/oracle-universe/web/src/pages/Landing.tsx`

---
*Added via Oracle Learn*
