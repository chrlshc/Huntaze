# Premium Homepage Design - 7-Section Scrolling Landing Page

## Overview
Transform the Huntaze homepage into a premium 7-section scrolling landing page where each benefit gets its own full section. The page should flow smoothly from Hero → Dashboard Mock → Individual Benefit Sections → Final CTA, creating an immersive storytelling experience.

## Current State (3 sections)
1. Hero - "Run Your Creator Business on Autopilot"
2. Benefits - 3 cards in a grid (Clarity, Freedom, Connection)
3. Final CTA - "Ready to upgrade your workflow?"

## Target State (7 sections)
1. **Hero** - Main value proposition with CTA
2. **Dashboard Mock** - Visual preview of the product
3. **Clarity Section** - "See clearly" - Full section dedicated to analytics/tracking
4. **Freedom Section** - "Save time" - Full section dedicated to automation
5. **Connection Section** - "Know your fans" - Full section dedicated to relationships
6. **Final CTA** - Conversion section
7. **(Optional 7th)** - Social proof, testimonials, or trust badges

## Business Goals
- Increase perceived value through dedicated storytelling per benefit
- Improve conversion rate with focused, immersive sections
- Create a memorable scrolling experience
- Allow each benefit to breathe and be fully explained

## User Stories

### As a potential beta tester
- I want to understand each benefit deeply, not just at a glance
- I want to scroll through a story that builds excitement
- I want each section to feel complete and focused
- I want clear calls-to-action throughout the journey

### As a mobile user
- I want smooth scrolling between sections
- I want each section to fit my screen nicely
- I want readable text without zooming
- I want touch-friendly buttons and interactions

### As a desktop user
- I want full-screen sections that feel immersive
- I want smooth scroll animations between sections
- I want beautiful visual effects per section
- I want to see detailed product previews

## Acceptance Criteria

### AC1: Seven Distinct Sections
**Given** a user visits the homepage  
**When** they scroll down the page  
**Then** they should encounter exactly 7 distinct sections in order:
1. Hero section with main value proposition
2. Dashboard mock/preview section
3. Clarity benefit section (analytics/tracking focus)
4. Freedom benefit section (automation focus)
5. Connection benefit section (relationships focus)
6. Final CTA section
7. (Optional) Trust/social proof section

### AC2: Full-Screen Section Layout
**Given** a user on desktop (1024px+)  
**When** they view each section  
**Then** each section should:
- Take up significant vertical space (min-h-screen or near full-screen)
- Feel like a complete, focused story
- Have generous padding and breathing room
- Center content vertically when appropriate

### AC3: Smooth Scrolling Experience
**Given** a user scrolling through the page  
**When** they move between sections  
**Then** the experience should:
- Flow smoothly without jarring transitions
- Maintain consistent spacing between sections
- Work with both mouse wheel and trackpad
- Support keyboard navigation (arrow keys, space)

### AC4: Individual Benefit Sections
**Given** a user viewing a benefit section (Clarity, Freedom, or Connection)  
**When** they read the section  
**Then** each section should include:
- Large, prominent title (the benefit name)
- Descriptive subtitle/tagline
- Detailed explanation (2-3 sentences)
- Visual element (icon, illustration, or mock)
- Consistent layout pattern across all three

### AC5: Responsive Section Adaptation
**Given** a user on mobile (< 768px)  
**When** they view the sections  
**Then** sections should:
- Stack vertically with appropriate padding
- Not require full-screen height (allow natural flow)
- Maintain readability and touch targets
- Preserve the 7-section structure

### AC6: Dashboard Mock Section
**Given** a user reaches the dashboard mock section  
**When** they view it  
**Then** they should see:
- A visual representation of the Huntaze dashboard
- Either a screenshot, illustration, or placeholder
- Proper aspect ratio and sizing
- Smooth loading/fade-in effect

### AC7: Performance & Accessibility
**Given** any user  
**When** they use the homepage  
**Then** the page should:
- Load in under 3 seconds
- Have no layout shifts (CLS < 0.1)
- Support keyboard navigation
- Work with screen readers
- Support reduced motion preferences
- Maintain WCAG AA contrast ratios

## Constraints

### Technical Constraints
- Must use existing Tailwind CSS configuration
- Cannot break existing CSS variables system
- Must not import custom fonts in layout.tsx (causes bugs)
- Must maintain current routing structure
- Must work with Next.js 15 App Router

### Design Constraints
- Must keep existing copy (from HOMEPAGE_COPY_GUIDE.md)
- Must maintain brand colors (Midnight Violet #0F0F10, Purple #7D57C1)
- Must support both light and dark mode (currently dark only)
- Must be consistent with existing design system

### Performance Constraints
- Bundle size increase < 50KB
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

## Out of Scope
- Changing the copy or messaging
- Adding new sections or content
- Implementing actual dashboard (just preview placeholder)
- Backend integration
- Analytics implementation
- A/B testing setup

## Dependencies
- Tailwind CSS (already configured)
- Lucide React icons (already installed)
- Next.js Image component
- Existing CSS variables in design-system.css

## Success Metrics
- Visual QA approval from stakeholder
- No responsive bugs on test devices
- Lighthouse score maintained or improved
- No increase in bounce rate
- Positive feedback from first beta testers

## References
- #[[file:HOMEPAGE_DESIGN_SYSTEM.md]] - Complete design specifications
- #[[file:HOMEPAGE_COPY_GUIDE.md]] - Copy and messaging guidelines
- #[[file:app/(marketing)/page.tsx]] - Current implementation
- Linear.app - Design inspiration
- Vercel.com - Design inspiration
- Raycast.com - Design inspiration
