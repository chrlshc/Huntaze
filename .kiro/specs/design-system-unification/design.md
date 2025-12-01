# Design Document: Design System Unification

## Overview

This design establishes a unified design system for the Huntaze application to eliminate visual inconsistencies across pages. The system will provide centralized design tokens, reusable components, and clear guidelines to ensure a cohesive "God Tier" aesthetic throughout the application.

The design system will be built on top of the existing `styles/design-tokens.css` file and will extend it with additional tokens and components needed for full application coverage.

## Architecture

### Design Token Layer
- Central CSS custom properties file (`styles/design-tokens.css`)
- Organized by category: colors, spacing, typography, effects, animations
- All components reference tokens instead of hardcoded values

### Component Library Layer
- Base components in `components/ui/` directory
- Composed components in `components/dashboard/` directory
- Each component uses design tokens exclusively
- Components are fully typed with TypeScript

### Page Layer
- Pages compose components from the library
- Pages apply layout using layout components
- No page-specific styling that breaks consistency

### Documentation Layer
- Design system documentation in `docs/design-system/`
- Component usage examples
- Design principles and guidelines

## Components and Interfaces

### Design Tokens Structure

```typescript
// Design tokens are defined as CSS custom properties
interface DesignTokens {
  // Colors
  colors: {
    background: {
      primary: string;    // zinc-950
      secondary: string;  // zinc-900
      tertiary: string;   // zinc-800
    };
    card: {
      background: string; // gradient from white/[0.03]
      border: string;     // white/[0.08]
    };
    text: {
      primary: string;    // white
      secondary: string;  // zinc-400
      accent: string;     // purple-400
    };
  };
  
  // Spacing
  spacing: {
    xs: string;   // 0.25rem
    sm: string;   // 0.5rem
    md: string;   // 1rem
    lg: string;   // 1.5rem
    xl: string;   // 2rem
    '2xl': string; // 3rem
  };
  
  // Typography
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  
  // Effects
  effects: {
    glass: string;        // backdrop-blur-xl bg-white/5
    innerGlow: string;    // inner shadow glow
    shadow: {
      sm: string;
      md: string;
      lg: string;
    };
  };
  
  // Animations
  animations: {
    duration: {
      fast: string;    // 150ms
      normal: string;  // 300ms
      slow: string;    // 500ms
    };
    easing: {
      default: string; // ease-in-out
      in: string;      // ease-in
      out: string;     // ease-out
    };
  };
  
  // Breakpoints
  breakpoints: {
    sm: string;  // 640px
    md: string;  // 768px
    lg: string;  // 1024px
    xl: string;  // 1280px
  };
}
```

### Base Component Interfaces

```typescript
// Button Component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Card Component
interface CardProps {
  variant?: 'default' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

// Input Component
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

// Container Component
interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  children: React.ReactNode;
}

// PageLayout Component
interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
```

## Data Models

### Design Token Registry

The design token registry tracks all available tokens and their usage:

```typescript
interface TokenRegistry {
  tokens: Map<string, TokenDefinition>;
  usage: Map<string, string[]>; // token -> files using it
}

interface TokenDefinition {
  name: string;
  value: string;
  category: 'color' | 'spacing' | 'typography' | 'effect' | 'animation';
  description: string;
}
```

### Component Registry

The component registry tracks all UI components:

```typescript
interface ComponentRegistry {
  components: Map<string, ComponentDefinition>;
}

interface ComponentDefinition {
  name: string;
  path: string;
  props: Record<string, any>;
  examples: string[];
  tokens: string[]; // tokens used by this component
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Background Color Consistency
*For any* dashboard page, the background color should reference the same design token (--bg-primary)
**Validates: Requirements 1.1**

### Property 2: Glass Effect Consistency
*For any* card or container component, the glass effect should use the standardized glass effect token
**Validates: Requirements 1.2, 3.2**

### Property 3: Button Hover Consistency
*For any* button component, hover transitions should use the standard animation duration token
**Validates: Requirements 1.3**

### Property 4: Typography Hierarchy Consistency
*For any* text element, font sizes should reference typography tokens rather than arbitrary values
**Validates: Requirements 1.4**

### Property 5: Spacing Consistency
*For any* component with padding or margin, spacing values should reference spacing tokens
**Validates: Requirements 1.5**

### Property 6: No Hardcoded Colors
*For any* CSS file or styled component, color values should reference design tokens rather than hardcoded hex/rgb values
**Validates: Requirements 2.2**

### Property 7: Spacing Scale Adherence
*For any* spacing value used in the application, it should match one of the standardized spacing scale values
**Validates: Requirements 2.3**

### Property 8: Font Token Usage
*For any* font-family or font-size declaration, it should reference typography tokens
**Validates: Requirements 2.4**

### Property 9: Effect Token Usage
*For any* box-shadow or backdrop-filter, it should reference effect tokens
**Validates: Requirements 2.5**

### Property 10: Dashboard Background Uniformity
*For any* page in the dashboard section, the background should be zinc-950 (--bg-primary)
**Validates: Requirements 3.1**

### Property 11: Border Color Consistency
*For any* border declaration, the color should be white/[0.08] (--border-subtle)
**Validates: Requirements 3.3**

### Property 12: Inner Glow Consistency
*For any* interactive element with glow effect, it should use the --shadow-inner-glow token
**Validates: Requirements 3.4**

### Property 13: Color Palette Restriction
*For any* color used in the application, it should be one of the approved palette colors from design tokens
**Validates: Requirements 3.5**

### Property 14: Button Component Usage
*For any* button element in the application, it should use the Button component or button utility classes
**Validates: Requirements 4.1**

### Property 15: Input Component Usage
*For any* input element in the application, it should use the Input component or input utility classes
**Validates: Requirements 4.2**

### Property 16: Card Component Usage
*For any* card-like container, it should use the Card component
**Validates: Requirements 4.3**

### Property 17: Fade-in Animation Consistency
*For any* element with fade-in animation, it should use the standard animation duration
**Validates: Requirements 6.1**

### Property 18: Hover Transition Timing
*For any* hover transition, the duration should be one of the approved animation duration tokens
**Validates: Requirements 6.2**

### Property 19: Loading State Consistency
*For any* loading indicator, it should use the standardized loading component
**Validates: Requirements 6.3**

### Property 20: Animation Timing Standardization
*For any* CSS transition or animation, the timing should reference animation duration tokens
**Validates: Requirements 6.5**

### Property 21: Mobile Breakpoint Consistency
*For any* responsive media query, breakpoints should match the standardized breakpoint tokens
**Validates: Requirements 7.1**

### Property 22: Touch Target Size Compliance
*For any* interactive element on mobile, the minimum touch target size should be 44x44px
**Validates: Requirements 7.4**

### Property 23: Card-Background Contrast Ratio
*For any* card component on a dark background, the contrast ratio between the card background and page background should meet or exceed 3:1 (WCAG AA for large elements)
**Validates: Requirements 9.1**

### Property 24: Primary Text Color Lightness
*For any* text element marked as primary content, the color should use light tokens (zinc-50, zinc-100, or --text-primary) rather than mid-range grays (zinc-400, zinc-500)
**Validates: Requirements 9.2**

### Property 25: Border Opacity Minimum
*For any* border color declaration, the opacity (alpha channel) should be at least 0.12 to ensure visible separation
**Validates: Requirements 9.3**

### Property 26: Interactive Element Visual Distinction
*For any* interactive element (button, link, input), it should have at least one distinguishing visual feature: distinct color, visible border, or shadow
**Validates: Requirements 9.4**

### Property 27: Nested Background Hierarchy
*For any* nested component structure, child element backgrounds should be progressively lighter than parent backgrounds to maintain visual hierarchy
**Validates: Requirements 9.5**

### Property 28: Adjacent Element Contrast
*For any* two adjacent sibling elements in the DOM, they should not both use similar dark shades (zinc-900 and zinc-950) without sufficient contrast difference
**Validates: Requirements 9.6**

### Property 29: Card Light Accent Presence
*For any* card or container component, it should include at least one light accent feature (white/light border, inner glow, or light shadow) to create visual breathing room
**Validates: Requirements 9.7**

## Error Handling

### Token Not Found
When a component references a non-existent token:
- Development: Console warning with token name and component
- Build: TypeScript error if using typed tokens
- Fallback: Use default value from token category

### Component Prop Validation
When invalid props are passed to components:
- Development: PropTypes warning
- TypeScript: Compile-time error
- Runtime: Use default prop values

### Missing Component
When a required component is not found:
- Development: Clear error message with component name
- Suggestion: Show similar available components
- Fallback: Render unstyled content with warning

## Testing Strategy

### Unit Tests
- Test that design token file exists and is valid CSS
- Test that each base component renders correctly
- Test that components accept correct prop types
- Test that components apply correct CSS classes

### Property-Based Tests
Using `fast-check` library for property-based testing with minimum 100 iterations per test.

Each property test will be tagged with: `**Feature: design-system-unification, Property {number}: {property_text}**`

- Property 1: Test that all dashboard pages use --bg-primary
- Property 2: Test that all cards use glass effect token
- Property 3: Test that all buttons use standard hover duration
- Property 4: Test that all text uses typography tokens
- Property 5: Test that all spacing uses spacing tokens
- Property 6: Test that no hardcoded colors exist in CSS files
- Property 7: Test that all spacing values match scale
- Property 8: Test that all fonts reference tokens
- Property 9: Test that all effects reference tokens
- Property 10: Test dashboard background uniformity
- Property 11: Test border color consistency
- Property 12: Test inner glow consistency
- Property 13: Test color palette restriction
- Property 14: Test button component usage
- Property 15: Test input component usage
- Property 16: Test card component usage
- Property 17: Test fade-in animation consistency
- Property 18: Test hover transition timing
- Property 19: Test loading state consistency
- Property 20: Test animation timing standardization
- Property 21: Test mobile breakpoint consistency
- Property 22: Test touch target size compliance
- Property 23: Test card-background contrast ratio meets 3:1 minimum
- Property 24: Test primary text uses light colors (zinc-50/100)
- Property 25: Test border opacity is at least 0.12
- Property 26: Test interactive elements have visual distinction
- Property 27: Test nested backgrounds maintain progressive lightening
- Property 28: Test adjacent elements avoid similar dark shades
- Property 29: Test cards include light accent features

### Integration Tests
- Test that pages compose components correctly
- Test that theme switching works across all components
- Test that responsive behavior is consistent
- Test that accessibility features work consistently
- Test that contrast ratios meet WCAG AA standards across all pages

### Visual Regression Tests
- Capture screenshots of all components
- Compare against baseline images
- Flag any visual inconsistencies
- Test across different viewport sizes

## Implementation Phases

### Phase 1: Token Enhancement
- Audit existing design-tokens.css
- Add missing token categories
- Document all tokens
- Create token usage guide

### Phase 2: Base Component Library
- Create Button component
- Create Input component
- Create Card component
- Create Container component
- Create Modal component
- Create Alert/Toast component

### Phase 3: Layout Components
- Create PageLayout component
- Create Section component
- Create Grid component
- Create Stack component

### Phase 4: Page Migration
- Audit all existing pages
- Identify inconsistencies
- Migrate pages to use new components
- Remove page-specific styles

### Phase 5: Documentation
- Create design system documentation
- Add component usage examples
- Document design principles
- Create contribution guidelines

### Phase 6: Validation & Testing
- Run all property tests
- Perform visual regression testing
- Conduct accessibility audit
- Get stakeholder approval

## Color Harmonization Strategy

### Problem Statement
The current implementation suffers from insufficient contrast, with too many similar dark shades (zinc-900, zinc-950) used in adjacent elements, creating a "black on black" effect that reduces readability and visual hierarchy.

### Solution Approach

#### 1. Enhanced Card Contrast
- Cards should use `--bg-tertiary` (zinc-800) instead of `--bg-secondary` (zinc-900) when on `--bg-primary` (zinc-950) backgrounds
- This creates a visible 2-step contrast: zinc-950 → zinc-800
- Glass effect cards should increase opacity to `rgba(255, 255, 255, 0.08)` for better visibility

#### 2. Strategic Use of White Accents
- All cards must include light borders: `border: 1px solid var(--border-default)` (white/0.12)
- Interactive elements should have inner glow: `box-shadow: var(--shadow-inner-glow)`
- Hover states should brighten borders to `--border-emphasis` (white/0.18)

#### 3. Text Color Hierarchy
- Primary headings: `--text-primary` (zinc-50) - highest contrast
- Body text: `--text-primary` (zinc-50) for readability
- Secondary text: `--text-secondary` (zinc-400) - only for labels and metadata
- Tertiary text: `--text-tertiary` (zinc-500) - only for disabled or very subtle content
- Avoid using zinc-600 or darker for any visible text

#### 4. Progressive Lightening for Nesting
When nesting components, follow this hierarchy:
- Level 0 (page): `--bg-primary` (zinc-950)
- Level 1 (main cards): `--bg-tertiary` (zinc-800)
- Level 2 (nested cards): `--bg-secondary` (zinc-900) with increased border opacity
- Level 3 (inner elements): `--bg-glass-hover` (white/0.08)

#### 5. Border and Separator Visibility
- Default borders: minimum `--border-default` (white/0.12)
- Emphasized borders: `--border-emphasis` (white/0.18)
- Strong borders: `--border-strong` (white/0.24) for important separations
- Never use borders with opacity < 0.12

#### 6. Interactive Element Distinction
All interactive elements must have clear visual affordance:
- Buttons: solid background + border + shadow
- Inputs: distinct border + focus ring
- Links: color + underline or hover effect
- Cards: border + hover state with increased brightness

### Implementation Guidelines

```css
/* GOOD: Clear contrast between page and card */
.page {
  background: var(--bg-primary); /* zinc-950 */
}

.card {
  background: var(--bg-tertiary); /* zinc-800 */
  border: 1px solid var(--border-default); /* white/0.12 */
  box-shadow: var(--shadow-inner-glow);
}

/* BAD: Too similar, no contrast */
.page {
  background: var(--bg-primary); /* zinc-950 */
}

.card {
  background: var(--bg-secondary); /* zinc-900 - too close! */
  border: 1px solid rgba(255, 255, 255, 0.05); /* too subtle! */
}
```

### Contrast Ratio Requirements
- Card-to-background: minimum 3:1 (WCAG AA for large elements)
- Text-to-background: minimum 4.5:1 for body text, 3:1 for large text (WCAG AA)
- Interactive elements: minimum 3:1 against adjacent colors

## Performance Considerations

- Design tokens are loaded once in global CSS
- Components are tree-shakeable
- CSS-in-JS is avoided for better performance
- Tailwind utilities are used where appropriate
- Critical CSS is inlined for faster initial render

## Accessibility

- All components meet WCAG 2.1 AA standards
- Color contrast ratios are validated
- Focus states are clearly visible
- Keyboard navigation is fully supported
- Screen reader labels are provided
- Touch targets meet minimum size requirements

## Migration Strategy

### Gradual Migration
- New pages use new design system immediately
- Existing pages are migrated incrementally
- Both old and new styles coexist temporarily
- Migration is tracked per page

### Breaking Changes
- Old page-specific CSS files will be deprecated
- Components with inconsistent APIs will be updated
- Migration guide will be provided for developers

### Rollback Plan
- Design tokens can be reverted individually
- Component changes are versioned
- Pages can temporarily opt-out of new system
- Feature flags control design system adoption
