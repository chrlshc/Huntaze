# Phase 14: Final Visual QA Checklist

## Overview
This document provides a comprehensive checklist for conducting final visual quality assurance on the dashboard migration. Use this checklist to verify that all visual elements meet the Shopify 2.0-inspired design standards with Electric Indigo brand identity.

---

## 1. Electric Indigo Brand Identity Consistency

### Primary Color Usage
- [ ] All primary buttons use Electric Indigo gradient: `linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)`
- [ ] All primary action links use Electric Indigo (#6366f1)
- [ ] Active navigation items use Electric Indigo (#6366f1)
- [ ] Active navigation icons use Electric Indigo for both layers
- [ ] Search input focus border uses Electric Indigo
- [ ] No legacy colors (blues, greens) remain in dashboard

### Focus States
- [ ] All interactive elements have Electric Indigo glow on focus
- [ ] Focus glow uses: `box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2)`
- [ ] Focus states are clearly visible on all backgrounds
- [ ] Keyboard navigation shows focus indicators
- [ ] Tab order is logical and intuitive

### Hover States
- [ ] Buttons darken on hover (darker Electric Indigo)
- [ ] Navigation items show fade indigo background on hover
- [ ] Cards lift on hover with deepened shadow
- [ ] Icon colors transition smoothly on hover
- [ ] All hover states use consistent timing (0.15s ease)

---

## 2. Shadow System Verification

### Soft Diffused Shadows
- [ ] All cards use: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)`
- [ ] Card hover uses: `box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1)`
- [ ] Search focus uses: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05)`
- [ ] Mobile drawer uses: `box-shadow: 10px 0 25px rgba(0, 0, 0, 0.1)`
- [ ] No harsh or flat shadows anywhere
- [ ] Shadows create subtle depth without being distracting

### Shadow Consistency
- [ ] All onboarding cards have consistent shadows
- [ ] Stats cards have consistent shadows
- [ ] Content cards have consistent shadows
- [ ] Dropdown menus have appropriate shadows
- [ ] Modals/overlays have appropriate shadows

---

## 3. Spacing Consistency

### Content Block Spacing
- [ ] All content blocks have minimum 24px gaps
- [ ] Card grids use 24px gap between cards
- [ ] Navigation items have proper spacing (12px)
- [ ] Header elements properly spaced
- [ ] Footer elements properly spaced

### Internal Padding
- [ ] All cards have 24px internal padding
- [ ] Buttons have appropriate padding for size variant
- [ ] Navigation items have 12px 16px padding
- [ ] Header has 0 24px padding
- [ ] Main content has 32px padding

### No Conflicting Margins
- [ ] No hardcoded margins conflict with gap properties
- [ ] Content blocks use gap instead of margins
- [ ] Spacing is consistent across all pages
- [ ] Mobile spacing adjusts appropriately (16px padding)

---

## 4. Typography Hierarchy

### Heading Styles
- [ ] All headings use Poppins or Inter font
- [ ] Headings use font-weight 600
- [ ] Heading color is #111827 (near-black, not pure black)
- [ ] H1: 32px font size
- [ ] H2: 24px font size
- [ ] H3: 20px font size
- [ ] Welcome title: 24px with -0.5px letter spacing

### Body Text
- [ ] Body text uses Inter or system font
- [ ] Body text color is #1F2937 (deep gray)
- [ ] Secondary text color is #6B7280 (medium gray)
- [ ] Font size: 16px for body, 14px for small, 12px for labels
- [ ] Line height is appropriate (1.5 for body)

### Pure Black Avoidance
- [ ] No text uses pure black (#000000)
- [ ] All text uses deep gray or near-black
- [ ] Reduced eye strain from softer colors
- [ ] Text remains highly readable

### Size Hierarchy
- [ ] Headings are clearly larger than body text
- [ ] Labels are clearly smaller than body text
- [ ] Visual hierarchy is immediately apparent
- [ ] Font sizes scale appropriately on mobile

---

## 5. Transitions & Animations

### Button Transitions
- [ ] All buttons have smooth hover transitions
- [ ] Primary buttons lift slightly on hover (translateY(-1px))
- [ ] Secondary buttons show background change on hover
- [ ] Ghost buttons show subtle background on hover
- [ ] Disabled buttons don't animate
- [ ] Loading states animate smoothly

### Card Transitions
- [ ] All cards lift on hover (translateY(-4px))
- [ ] Shadow deepens smoothly on hover
- [ ] Transition timing is 0.2s ease
- [ ] No jarring or abrupt movements
- [ ] Hover effect feels natural and responsive

### Navigation Transitions
- [ ] Navigation items transition smoothly (0.15s ease)
- [ ] Icon colors transition smoothly
- [ ] Active state changes are smooth
- [ ] Hover states feel responsive
- [ ] No lag or delay in transitions

### Search Transitions
- [ ] Search input background transitions on focus
- [ ] Border color transitions smoothly
- [ ] Glow effect appears smoothly
- [ ] Results dropdown animates in
- [ ] All transitions feel polished

### Reduced Motion
- [ ] Test with system reduced motion preference enabled
- [ ] All animations disabled when preference set
- [ ] Functionality remains 100% intact
- [ ] No jarring instant changes
- [ ] Transitions set to 0.01ms instead of disabled

---

## 6. Screen Size Testing

### Desktop (1920x1080)
- [ ] Grid layout displays correctly
- [ ] Sidebar is 256px wide
- [ ] Header is 64px tall
- [ ] Main content fills remaining space
- [ ] All elements properly aligned
- [ ] No overflow or scrolling issues
- [ ] Search bar is 400px wide

### Laptop (1440x900)
- [ ] Layout scales appropriately
- [ ] All elements remain visible
- [ ] No cramped spacing
- [ ] Text remains readable
- [ ] Cards scale properly

### Tablet (768x1024)
- [ ] Mobile drawer activates at < 1024px
- [ ] Hamburger menu appears
- [ ] Desktop sidebar hidden
- [ ] Main content uses full width
- [ ] Touch targets are appropriate size
- [ ] Search bar hidden on mobile

### Mobile (375x667)
- [ ] Mobile drawer works correctly
- [ ] Sidebar slides in smoothly
- [ ] Backdrop overlay appears
- [ ] Content padding reduced to 16px
- [ ] Typography scales down appropriately
- [ ] All interactive elements accessible
- [ ] No horizontal scrolling

### Mobile (320x568) - Small Phones
- [ ] Layout doesn't break
- [ ] Text remains readable
- [ ] Buttons remain tappable
- [ ] Cards stack properly
- [ ] No content cutoff

---

## 7. Component-Specific Checks

### Header Component
- [ ] Logo displays correctly
- [ ] Search bar centered (desktop only)
- [ ] User menu aligned right
- [ ] Notifications button works
- [ ] Sign out button works
- [ ] All buttons have hover/focus states
- [ ] Header remains sticky on scroll
- [ ] Z-index keeps header above content

### Sidebar Component
- [ ] Sidebar spans full height
- [ ] Internal scrolling works
- [ ] Scrollbar styled correctly (thin, gray)
- [ ] Navigation items display correctly
- [ ] Active state shows left border
- [ ] Icons display in correct colors
- [ ] "Back to Home" link works
- [ ] Hover states work on all items

### Main Content Area
- [ ] Background is pale gray (#F8F9FB)
- [ ] Internal scrolling works
- [ ] Smooth scroll behavior enabled
- [ ] Content padding is 32px (desktop)
- [ ] Content padding is 16px (mobile)
- [ ] No double scrollbars

### Gamified Onboarding
- [ ] Personalized greeting displays
- [ ] Three cards in responsive grid
- [ ] Cards have proper spacing (24px gap)
- [ ] Cards lift on hover
- [ ] Blurred logos display correctly
- [ ] Growth visualization renders
- [ ] Pulsing icon animates
- [ ] Buttons work correctly

### Global Search
- [ ] Search input displays correctly
- [ ] Unfocused state: light gray background
- [ ] Focused state: white background, indigo border
- [ ] Glow effect appears on focus
- [ ] Search icon displays
- [ ] Results dropdown appears
- [ ] Keyboard navigation works
- [ ] Hidden on mobile (< 768px)

### Button Component
- [ ] Primary variant: gradient background
- [ ] Secondary variant: outline style
- [ ] Ghost variant: transparent background
- [ ] All sizes render correctly (small, medium, large)
- [ ] Hover states work
- [ ] Active states work
- [ ] Disabled states work
- [ ] Loading states work
- [ ] Focus states show glow

### Duotone Icons
- [ ] Two-layer SVG structure
- [ ] Primary and secondary colors
- [ ] Inactive: gray (#9CA3AF)
- [ ] Active: Electric Indigo (#6366f1)
- [ ] Colors transition smoothly
- [ ] All icons render correctly
- [ ] Icons scale appropriately

---

## 8. Color System Verification

### Background Colors
- [ ] Canvas: #F8F9FB (Gris très pâle)
- [ ] Surface: #FFFFFF (pure white)
- [ ] Cards on canvas create subtle contrast
- [ ] No dark mode colors remain

### Text Colors
- [ ] Main text: #1F2937 (deep gray)
- [ ] Secondary text: #6B7280 (medium gray)
- [ ] Headings: #111827 (near-black)
- [ ] Inactive text: #6B7280 (medium gray)
- [ ] No pure black (#000000) used

### Border Colors
- [ ] Light borders: #6B7280 (medium-dark gray)
- [ ] Medium borders: rgba(107, 114, 128, 0.5)
- [ ] Borders provide subtle definition
- [ ] WCAG contrast requirements met

### Brand Colors
- [ ] Primary: #6366f1 (Electric Indigo)
- [ ] Dark: #4f46e5 (darker shade)
- [ ] Light: #818cf8 (lighter shade)
- [ ] Fade: rgba(99, 102, 241, 0.08)
- [ ] Glow: rgba(99, 102, 241, 0.2)

---

## 9. Accessibility Verification

### Keyboard Navigation
- [ ] All interactive elements accessible via Tab
- [ ] Tab order is logical
- [ ] Focus indicators clearly visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys work in search results

### Screen Reader
- [ ] Semantic HTML used (`<nav>`, `<header>`, `<main>`)
- [ ] ARIA labels on icon-only buttons
- [ ] Alt text on images
- [ ] Form labels properly associated
- [ ] Error messages announced
- [ ] Loading states announced

### Color Contrast
- [ ] Text on backgrounds meets WCAG AA (4.5:1)
- [ ] Large text meets WCAG AA (3:1)
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators clearly visible
- [ ] Hover states maintain contrast

### Reduced Motion
- [ ] System preference respected
- [ ] Animations disabled when requested
- [ ] Functionality remains intact
- [ ] No jarring instant changes
- [ ] Smooth experience for all users

---

## 10. Performance Verification

### Scrolling Performance
- [ ] Main content scrolls at 60fps
- [ ] Sidebar scrolls smoothly
- [ ] No jank or stuttering
- [ ] Smooth scroll behavior works
- [ ] No layout thrashing

### Animation Performance
- [ ] Transitions use GPU acceleration
- [ ] Transform and opacity used
- [ ] `will-change` applied appropriately
- [ ] No performance degradation
- [ ] Animations complete in specified time

### Load Performance
- [ ] Initial render is fast
- [ ] No flash of unstyled content
- [ ] CSS loads before render
- [ ] Fonts load smoothly
- [ ] Images load progressively

---

## 11. Cross-Browser Testing

### Chrome/Edge 90+
- [ ] Layout renders correctly
- [ ] All features work
- [ ] Transitions smooth
- [ ] No console errors

### Firefox 88+
- [ ] Layout renders correctly
- [ ] All features work
- [ ] Transitions smooth
- [ ] No console errors

### Safari 14+
- [ ] Layout renders correctly
- [ ] All features work
- [ ] Transitions smooth
- [ ] No console errors
- [ ] Webkit prefixes work

### Mobile Safari 14+
- [ ] Touch interactions work
- [ ] Drawer slides smoothly
- [ ] No zoom issues
- [ ] Viewport meta tag correct

### Chrome Android 90+
- [ ] Touch interactions work
- [ ] Drawer slides smoothly
- [ ] No zoom issues
- [ ] Performance acceptable

---

## 12. Comparison with Shopify 2.0

### Structural Patterns ✅
- [ ] Fixed sidebar with internal scrolling
- [ ] Sticky header spanning full width
- [ ] Scrollable main content area
- [ ] Named grid areas
- [ ] Clean, spacious layout

### Visual Differences (Intentional) ✨
- [ ] Electric Indigo instead of green
- [ ] Duotone icons instead of monochrome
- [ ] Gamified onboarding cards
- [ ] Soft shadow physics
- [ ] Warm pale gray canvas

### Quality Parity
- [ ] Professional appearance
- [ ] Enterprise-grade reliability
- [ ] Smooth interactions
- [ ] Accessible design
- [ ] Responsive layout

---

## Sign-Off

### QA Reviewer
- **Name**: _______________
- **Date**: _______________
- **Status**: [ ] Approved [ ] Needs Revision

### Issues Found
1. _______________
2. _______________
3. _______________

### Notes
_______________________________________________
_______________________________________________
_______________________________________________

---

## Next Steps After QA

Once all items are checked and approved:
1. Document any remaining issues
2. Create tickets for minor fixes
3. Proceed to Task 32: Documentation and handoff
4. Prepare for user acceptance testing
5. Plan gradual rollout strategy

