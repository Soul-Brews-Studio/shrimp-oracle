# Reuse Existing CSS Utilities Before Creating New Ones

**Date**: 2026-02-04
**Context**: Oracle Universe landing page - hiding scrollbar on scroll-snap slideshow
**Confidence**: High

## Key Learning

Before writing new CSS for common UI patterns, always search the existing codebase for utility classes that might already solve the problem. In this case, the `.hide-scrollbar` class already existed in `index.css` but wasn't being applied to the scroll-snap container.

The pattern was already defined:
```css
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

Instead of writing new CSS or inline styles, simply adding the class to the element solved the problem:
```tsx
<div className="... hide-scrollbar">
```

## The Pattern

**Before creating CSS:**
1. Search for existing utility classes: `grep -r "scrollbar\|overflow" src/`
2. Check `index.css` or global styles for reusable utilities
3. Check Tailwind config for custom utilities
4. Only create new CSS if nothing exists

**Search commands:**
```bash
# Find scrollbar-related CSS
grep -r "scrollbar" --include="*.css" .

# Find existing utility classes
grep -r "\.hide-\|\.show-" --include="*.css" .
```

## Why This Matters

1. **DRY (Don't Repeat Yourself)**: Avoids duplicate CSS definitions
2. **Consistency**: Same solution applied everywhere
3. **Maintainability**: One place to update if needed
4. **Smaller bundle**: No redundant styles
5. **Team knowledge**: Others may have already solved this

## Tags

`css`, `utilities`, `dry`, `scrollbar`, `best-practices`, `frontend`
