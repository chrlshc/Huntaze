# Quick Test Guide - Layout Centering Fix

## 🚀 Quick Start

```bash
# 1. Start dev server
npm run dev

# 2. Open in browser
# http://localhost:3000

# 3. Open DevTools (F12)
# 4. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
```

## ⚡ 30-Second Test

1. **Open DevTools** → Toggle device toolbar
2. **Select "Responsive"** mode
3. **Drag width** from 375px → 1920px
4. **Watch for**:
   - ❌ Horizontal scroll bar appearing
   - ❌ Content shifting left/right
   - ❌ White space on right side

If you see ANY of the above ❌, there's still an issue.

## 📱 Device Presets to Test

In DevTools device toolbar, test these presets:

1. **iPhone SE** (375px)
2. **iPhone 12 Pro** (390px)
3. **iPad** (768px)
4. **iPad Pro** (1024px)
5. **Laptop** (1280px)
6. **Desktop** (1920px)

For each:
- Scroll down the entire page
- Check for horizontal scroll
- Verify content is centered

## 🎯 What to Look For

### ✅ GOOD Signs
- Content centered on all viewports
- No horizontal scroll bar
- Background glows visible but contained
- Smooth vertical scrolling only
- Equal margins left and right

### ❌ BAD Signs
- Horizontal scroll bar appears
- Content cut off on right
- Uneven margins
- Background glows extending beyond screen
- Content touching screen edges

## 🔍 Detailed Section Checks

### Hero Section
```
✓ Badge centered
✓ Title readable
✓ CTA button centered
✓ Purple glow behind (not overflowing)
```

### Dashboard Demo
```
✓ Dashboard mockup centered
✓ Metrics cards in grid
✓ Chart visible
✓ Purple glow contained
```

### Benefit Sections (3x)
```
✓ Icons aligned
✓ Text readable
✓ Proper spacing
✓ No edge touching
```

### Final CTA
```
✓ Title centered
✓ Button centered
✓ Links spaced properly
✓ Bottom glow contained
```

## 🐛 If You Find Issues

### Step 1: Identify
- Which viewport size? (e.g., 375px)
- Which section? (e.g., Hero, Dashboard)
- What's wrong? (e.g., horizontal scroll)

### Step 2: Screenshot
- Take screenshot showing the issue
- Include DevTools showing viewport size

### Step 3: Report
Create an issue with:
```
Viewport: 375px
Section: Hero
Issue: Horizontal scroll appears
Browser: Chrome 120
OS: macOS
Screenshot: [attach]
```

### Step 4: Re-run Diagnostic
```bash
npx ts-node scripts/diagnose-layout-centering.ts
```

## 🎨 Visual Quality Checks

While testing, also check:
- [ ] Animations smooth (no jank)
- [ ] Text readable on all sizes
- [ ] Colors look good
- [ ] Spacing feels balanced
- [ ] No layout shift when loading

## ⚡ Performance Checks

Open DevTools → Performance tab:
- [ ] Page loads < 3 seconds
- [ ] FPS stays at 60
- [ ] No long tasks (>50ms)
- [ ] CLS score = 0

## 📊 Browser Testing

Test in multiple browsers:
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

## ✅ Sign-off Checklist

Before marking Phase 6 complete:
- [ ] Tested all viewport sizes
- [ ] No horizontal scroll anywhere
- [ ] Content centered everywhere
- [ ] Background glows contained
- [ ] Performance good
- [ ] No console errors

## 🎉 Success Criteria

Phase 6 is complete when:
1. ✅ No horizontal scroll on ANY viewport
2. ✅ Content perfectly centered on ALL viewports
3. ✅ Background glows visible but contained
4. ✅ Build passes
5. ✅ No console errors

---

## 🚨 Emergency Rollback

If something breaks:
```bash
# Rollback all changes
git checkout components/home/HeroSection.tsx
git checkout components/home/InteractiveDashboardDemo.tsx
git checkout components/home/HomeCTA.tsx
git checkout components/home/HomePageContent.tsx
git checkout app/(marketing)/layout.tsx

# Rebuild
npm run build
```

## 📞 Need Help?

Check these files:
1. `PHASE_6_LAYOUT_FIX_COMPLETE.md` - Detailed fixes
2. `TESTING_CHECKLIST.md` - Full testing guide
3. `PHASE_6_SUMMARY.md` - Overview
4. `scripts/diagnose-layout-centering.ts` - Diagnostic tool
