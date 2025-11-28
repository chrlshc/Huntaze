# Testing Guide - 7-Section Homepage

## Quick Test Checklist

### Visual Testing

#### Desktop (1280px+)
- [ ] Open http://localhost:3000 (or your deployed URL)
- [ ] Verify 7 distinct sections are visible when scrolling
- [ ] Each section should take approximately full screen height
- [ ] Smooth scroll behavior between sections
- [ ] Icons alternate left/right on benefit sections
- [ ] All text is readable and properly sized
- [ ] Purple glow effects are visible but subtle
- [ ] No horizontal scroll bar

#### Tablet (768px - 1023px)
- [ ] Resize browser to ~800px width
- [ ] Sections should still be distinct
- [ ] Content should be readable
- [ ] Icons and text stack appropriately
- [ ] Touch targets are adequate (min 44px)

#### Mobile (375px - 767px)
- [ ] Resize browser to ~375px width
- [ ] All 7 sections are present
- [ ] Content stacks vertically
- [ ] Text is readable without zooming
- [ ] Buttons are touch-friendly
- [ ] No horizontal overflow

### Functional Testing

#### Smooth Scrolling
- [ ] Scroll with mouse wheel - should be smooth
- [ ] Scroll with trackpad - should be smooth
- [ ] Use keyboard (Space, Arrow keys) - should work
- [ ] Click anchor links (if added) - should scroll smoothly

#### Accessibility
- [ ] Tab through all interactive elements
- [ ] Focus indicators are visible
- [ ] All buttons are keyboard accessible
- [ ] Screen reader announces sections correctly (test with VoiceOver/NVDA)

#### Performance
- [ ] Page loads in < 3 seconds
- [ ] Scrolling is smooth (60fps)
- [ ] No layout shifts during load
- [ ] Animations are smooth

### Content Verification

#### Section 1: Hero
- [ ] Title: "Run Your Creator Business on Autopilot"
- [ ] Subtitle visible
- [ ] "Request Early Access" button present
- [ ] "Closed Beta • Invite only" badge visible
- [ ] Purple gradient background glow

#### Section 2: Dashboard Mock
- [ ] Title: "See it in action"
- [ ] Description text visible
- [ ] Dashboard placeholder with icon
- [ ] Purple glow effect around placeholder
- [ ] Alternating background color (#131316)

#### Section 3: Clarity
- [ ] Label: "CLARITY" (uppercase, purple)
- [ ] Title: "See clearly"
- [ ] BarChart3 icon visible
- [ ] Full description text (3 sentences)
- [ ] Icon on left side (desktop)
- [ ] Default background (#0F0F10)

#### Section 4: Freedom
- [ ] Label: "FREEDOM" (uppercase, purple)
- [ ] Title: "Save time"
- [ ] Sparkles icon visible
- [ ] Full description text (3 sentences)
- [ ] Icon on right side (desktop)
- [ ] Alternating background (#131316)

#### Section 5: Connection
- [ ] Label: "CONNECTION" (uppercase, purple)
- [ ] Title: "Know your fans"
- [ ] Users icon visible
- [ ] Full description text (3 sentences)
- [ ] Icon on left side (desktop)
- [ ] Default background (#0F0F10)

#### Section 6: Final CTA
- [ ] Title: "Ready to upgrade your workflow?"
- [ ] "Request Access" button present
- [ ] Navigation links (Features, Pricing, About)
- [ ] Purple gradient glow at bottom
- [ ] Full-screen height

#### Section 7: Footer
- [ ] Footer is present (existing component)
- [ ] All footer links work

### Browser Testing

Test on these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

### Reduced Motion Testing

1. Enable reduced motion:
   - **macOS**: System Preferences → Accessibility → Display → Reduce motion
   - **Windows**: Settings → Ease of Access → Display → Show animations
   - **Browser**: DevTools → Rendering → Emulate CSS prefers-reduced-motion

2. Test:
   - [ ] Smooth scroll is disabled
   - [ ] Animations are instant or very short
   - [ ] Hover effects still work but without transitions
   - [ ] Page is still functional

## Common Issues & Fixes

### Issue: Sections not full-screen on desktop
**Fix**: Check that `min-h-screen` class is applied to section elements

### Issue: Horizontal scroll appears
**Fix**: Verify `overflow-x: hidden` is in globals.css on html/body

### Issue: Icons not alternating left/right
**Fix**: Check `imagePosition` prop on BenefitSection components

### Issue: Text too small on mobile
**Fix**: Verify responsive text classes (text-lg md:text-xl)

### Issue: Smooth scroll not working
**Fix**: Check that `scroll-behavior: smooth` is in globals.css

## Performance Benchmarks

Expected metrics:
- **Build time**: ~20-25s
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1
- **Lighthouse Performance**: > 90

## Visual Regression Testing

If you have screenshots of the old 3-section layout:
1. Take new screenshots of the 7-section layout
2. Compare side-by-side
3. Verify all content is present
4. Verify visual improvements

## User Feedback Questions

When showing to stakeholders/users:
1. Is the storytelling clearer with dedicated sections?
2. Does each benefit feel more impactful?
3. Is the scrolling experience smooth and pleasant?
4. Does the page feel too long or just right?
5. Are there any sections that feel unnecessary?
6. Is the mobile experience good?

## Deployment Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Tested on real devices
- [ ] Stakeholder approval
- [ ] Performance metrics acceptable
- [ ] Accessibility audit passed

## Rollback Plan

If issues are found in production:

```bash
# Revert the commit
git revert ea14f0756

# Or checkout previous version
git checkout c6a23a0f6

# Build and deploy
npm run build
git push huntaze production-ready
```

## Next Steps After Testing

1. Gather feedback from team
2. Make any necessary adjustments
3. Test with real users (if possible)
4. Monitor analytics after deployment
5. Iterate based on data

---

**Testing Priority**: High  
**Estimated Testing Time**: 30-45 minutes  
**Critical Paths**: Desktop scroll, Mobile layout, Accessibility
