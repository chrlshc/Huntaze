# Homepage 7-Section Transformation - Implementation Tasks

## Overview
Transform the current 3-section homepage into a 7-section scrolling landing page where each benefit gets its own dedicated full-screen section.

**Current Structure (3 sections):**
1. Hero
2. Benefits (3 cards in grid)
3. Final CTA

**Target Structure (7 sections):**
1. Hero
2. Dashboard Mock
3. Clarity (full section)
4. Freedom (full section)
5. Connection (full section)
6. Final CTA
7. (Optional) Trust/Social Proof

---

## Phase 1: Component Restructuring

### - [ ] 1. Create new section components
- [ ] 1.1 Create `components/home/DashboardMockSection.tsx`
  - Full-screen section with centered content
  - Title: "See it in action"
  - Placeholder for dashboard visual
  - _Requirements: AC1, AC6_

- [ ] 1.2 Create `components/home/BenefitSection.tsx` (reusable)
  - Props: icon, label, title, description, imagePosition
  - Full-screen layout (min-h-screen on desktop)
  - Alternating left/right layout
  - Icon + content side-by-side on desktop
  - _Requirements: AC4, AC5_

- [ ] 1.3 Update `components/home/HomePageContent.tsx`
  - Remove current `ValueProposition` component usage
  - Import new section components
  - Arrange in 7-section structure
  - _Requirements: AC1_

### - [ ] 2. Implement smooth scrolling
- [ ] 2.1 Add smooth scroll CSS to `app/globals.css`
  ```css
  html {
    scroll-behavior: smooth;
  }
  
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
  ```
  - _Requirements: AC3, AC7_

- [ ] 2.2 Add section IDs for anchor navigation (optional)
  - hero, dashboard, clarity, freedom, connection, cta
  - _Requirements: AC3_

---

## Phase 2: Dashboard Mock Section

### - [ ] 3. Build Dashboard Mock Section
- [ ] 3.1 Create section structure
  - Full-screen container (min-h-screen)
  - Centered content (flex items-center justify-center)
  - Max-width: 6xl
  - Alternating background (#131316)
  - _Requirements: AC6_

- [ ] 3.2 Add section content
  - Title: "See it in action" (text-4xl md:text-5xl)
  - Subtitle: Brief description
  - Dashboard visual placeholder
  - _Requirements: AC6_

- [ ] 3.3 Style dashboard visual
  - Aspect ratio: 16:9
  - Rounded corners (rounded-2xl)
  - Border: subtle white/10
  - Shadow: purple glow
  - Responsive sizing
  - _Requirements: AC6_

---

## Phase 3: Individual Benefit Sections

### - [ ] 4. Build Clarity Section
- [ ] 4.1 Create full-screen section
  - min-h-screen on desktop, min-h-[60vh] on mobile
  - Default background (#0F0F10)
  - Centered content layout
  - _Requirements: AC4_

- [ ] 4.2 Add Clarity content
  - Icon: BarChart3 (80px mobile, 120px desktop)
  - Label: "CLARITY" (uppercase, purple)
  - Title: "See clearly" (text-3xl md:text-5xl)
  - Description: "Track your revenue and growth across all platforms instantly. No more spreadsheets. Get real-time insights into what's working and what's not, all in one beautiful dashboard."
  - _Requirements: AC4_

- [ ] 4.3 Implement responsive layout
  - Mobile: Stack vertically (icon top, content below)
  - Desktop: Side-by-side (50/50 split)
  - _Requirements: AC5_

### - [ ] 5. Build Freedom Section
- [ ] 5.1 Create full-screen section
  - min-h-screen on desktop
  - Alternating background (#131316)
  - Centered content layout
  - _Requirements: AC4_

- [ ] 5.2 Add Freedom content
  - Icon: Sparkles
  - Label: "FREEDOM"
  - Title: "Save time"
  - Description: "Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep. Automate the boring stuff and focus on what you love: creating content."
  - _Requirements: AC4_

- [ ] 5.3 Implement responsive layout
  - Mobile: Stack vertically
  - Desktop: Side-by-side (reverse order for variety)
  - _Requirements: AC5_

### - [ ] 6. Build Connection Section
- [ ] 6.1 Create full-screen section
  - min-h-screen on desktop
  - Default background (#0F0F10)
  - Centered content layout
  - _Requirements: AC4_

- [ ] 6.2 Add Connection content
  - Icon: Users
  - Label: "CONNECTION"
  - Title: "Know your fans"
  - Description: "Identify your top supporters and build real relationships with the people who matter most. See who engages, who buys, and who truly supports your work."
  - _Requirements: AC4_

- [ ] 6.3 Implement responsive layout
  - Mobile: Stack vertically
  - Desktop: Side-by-side (same as Clarity)
  - _Requirements: AC5_

---

## Phase 4: Update Existing Sections

### - [ ] 7. Update Hero Section
- [ ] 7.1 Ensure full-screen layout
  - min-h-screen on desktop
  - min-h-[80vh] on mobile
  - Keep existing gradient and effects
  - _Requirements: AC2_

- [ ] 7.2 Remove dashboard preview from hero
  - Dashboard preview now has its own section
  - Keep hero focused on value prop + CTA
  - _Requirements: AC1_

### - [ ] 8. Update Final CTA Section
- [ ] 8.1 Ensure full-screen layout
  - min-h-screen on desktop
  - Centered content
  - Keep existing gradient background
  - _Requirements: AC2_

- [ ] 8.2 Enhance CTA content (optional)
  - Add trust indicators
  - "Join 100+ creators" or similar
  - _Requirements: AC1_

---

## Phase 5: Styling & Polish

### - [ ] 9. Implement alternating backgrounds
- [ ] 9.1 Apply background pattern
  - Section 1 (Hero): Default
  - Section 2 (Dashboard): Alternating (#131316)
  - Section 3 (Clarity): Default
  - Section 4 (Freedom): Alternating
  - Section 5 (Connection): Default
  - Section 6 (CTA): Default with gradient
  - _Requirements: AC1_

### - [ ] 10. Add section transitions
- [ ] 10.1 Ensure smooth visual flow
  - Consistent padding between sections
  - No jarring color changes
  - Smooth scroll behavior
  - _Requirements: AC3_

### - [ ] 11. Optimize icon styling
- [ ] 11.1 Style benefit section icons
  - Large circular containers
  - Purple background (purple/10)
  - Purple border (purple/20)
  - Icon color: purple-400
  - Responsive sizing
  - _Requirements: AC4_

---

## Phase 6: Responsive Testing

### - [ ] 12. Mobile optimization (< 768px)
- [ ] 12.1 Test section heights
  - Sections should not force full-screen on mobile
  - Allow natural content flow
  - Adequate padding (py-16)
  - _Requirements: AC5_

- [ ] 12.2 Test content readability
  - Text sizes appropriate
  - Touch targets min 44px
  - No horizontal scroll
  - _Requirements: AC5, AC7_

### - [ ] 13. Tablet optimization (768px - 1023px)
- [ ] 13.1 Test section layouts
  - Transition from mobile to desktop layouts
  - Appropriate spacing
  - _Requirements: AC5_

### - [ ] 14. Desktop optimization (1024px+)
- [ ] 14.1 Test full-screen sections
  - min-h-screen working correctly
  - Content centered vertically
  - Generous spacing
  - _Requirements: AC2_

- [ ] 14.2 Test side-by-side layouts
  - Icon and content properly aligned
  - 50/50 split working
  - Alternating left/right for variety
  - _Requirements: AC4_

---

## Phase 7: Accessibility & Performance

### - [ ] 15. Accessibility audit
- [ ] 15.1 Keyboard navigation
  - All sections accessible via Tab
  - Focus indicators visible
  - Skip links if needed
  - _Requirements: AC7_

- [ ] 15.2 Screen reader support
  - Semantic HTML (section, h2, p)
  - Proper heading hierarchy
  - Alt text for visuals
  - _Requirements: AC7_

- [ ] 15.3 Reduced motion support
  - Respect prefers-reduced-motion
  - Disable smooth scroll if needed
  - _Requirements: AC7_

### - [ ] 16. Performance optimization
- [ ] 16.1 Check bundle size
  - New components should be minimal
  - No significant increase
  - _Requirements: AC7_

- [ ] 16.2 Test loading performance
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - No layout shifts (CLS < 0.1)
  - _Requirements: AC7_

---

## Phase 8: Final Validation

### - [ ] 17. Cross-browser testing
- [ ] 17.1 Test on major browsers
  - Chrome/Edge (latest)
  - Firefox (latest)
  - Safari (latest)
  - Mobile browsers
  - _Requirements: AC7_

### - [ ] 18. Visual QA
- [ ] 18.1 Review all sections
  - Consistent styling
  - Proper spacing
  - No visual bugs
  - Smooth transitions
  - _Requirements: AC1, AC2, AC3_

### - [ ] 19. Content review
- [ ] 19.1 Verify all copy
  - Clarity section: correct text
  - Freedom section: correct text
  - Connection section: correct text
  - No typos or errors
  - _Requirements: AC4_

### - [ ] 20. Final checkpoint
- [ ] 20.1 Complete testing checklist
  - All 7 sections present
  - Smooth scrolling works
  - Responsive on all devices
  - Accessible
  - Performant
  - _Requirements: All ACs_

---

## Success Criteria

- ✅ Homepage has exactly 7 distinct sections
- ✅ Each benefit (Clarity, Freedom, Connection) has its own full section
- ✅ Sections are full-screen on desktop, natural height on mobile
- ✅ Smooth scrolling between sections
- ✅ Responsive on all devices (375px - 1920px)
- ✅ Maintains accessibility standards
- ✅ No performance degradation
- ✅ Stakeholder approval

## Rollback Plan

```bash
# If issues occur, revert to previous version
git checkout components/home/HomePageContent.tsx
git checkout components/home/ValueProposition.tsx
npm run build
```

## References
- Requirements: `.kiro/specs/premium-homepage-design/requirements.md`
- Design: `.kiro/specs/premium-homepage-design/design.md`
- Copy Guide: `HOMEPAGE_COPY_GUIDE.md`
