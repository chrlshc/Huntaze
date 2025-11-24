# CenteredContainer Component

A layout container component that provides max-width constraints, horizontal centering, and consistent padding for content. Part of the Linear UI Performance Refactor.

## Overview

The `CenteredContainer` component solves the "dead zone" problem on large screens by applying appropriate max-width constraints and automatic horizontal centering. It ensures content remains readable and well-proportioned across all viewport sizes.

## Features

- **Max-width constraints**: Choose between 1200px (sm) or 1280px (lg)
- **Automatic centering**: Uses `margin: 0 auto` for horizontal centering
- **Consistent padding**: Default 24px padding, customizable in 4px increments
- **Responsive**: Works seamlessly across all viewport sizes
- **Flexible**: Accepts custom classes and HTML attributes

## Usage

### Basic Usage

```tsx
import { CenteredContainer } from '@/components/layout/CenteredContainer';

function DashboardPage() {
  return (
    <CenteredContainer>
      <h1>Dashboard</h1>
      <div>Your content here</div>
    </CenteredContainer>
  );
}
```

### With Max-Width Variant

```tsx
// Small variant (1200px)
<CenteredContainer maxWidth="sm">
  <form>Form content</form>
</CenteredContainer>

// Large variant (1280px) - default
<CenteredContainer maxWidth="lg">
  <div>Wide content</div>
</CenteredContainer>
```

### With Custom Padding

```tsx
// Custom padding (must be multiple of 4)
<CenteredContainer padding={32}>
  <div>Content with more padding</div>
</CenteredContainer>

// Minimal padding
<CenteredContainer padding={16}>
  <div>Compact content</div>
</CenteredContainer>
```

### With Custom Styling

```tsx
<CenteredContainer 
  maxWidth="sm" 
  padding={24}
  className="bg-surface border border-subtle"
>
  <div>Styled container</div>
</CenteredContainer>
```

### With HTML Attributes

```tsx
<CenteredContainer
  maxWidth="lg"
  role="main"
  aria-label="Main content area"
  id="main-content"
>
  <article>Article content</article>
</CenteredContainer>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxWidth` | `'sm' \| 'lg'` | `'lg'` | Maximum width variant. `sm` = 1200px, `lg` = 1280px |
| `padding` | `number` | `24` | Internal padding in pixels. Should be multiple of 4 |
| `children` | `React.ReactNode` | required | Content to render inside container |
| `className` | `string` | `''` | Additional CSS classes |
| `...props` | `any` | - | Additional HTML attributes |

## Design Tokens

The component uses the following design tokens from the Linear UI system:

- `--content-max-width-sm`: 75rem (1200px)
- `--content-max-width-lg`: 80rem (1280px)
- `--content-padding`: var(--spacing-6) (24px)

## Responsive Behavior

The container maintains its max-width constraint across all viewport sizes:

- **Mobile (< 768px)**: Container takes full width minus padding
- **Tablet (768px - 1200px)**: Container takes full width minus padding
- **Desktop (> 1200px)**: Container respects max-width, creating "dead zones" on sides
- **Large Desktop (> 1280px)**: Container respects max-width, creating larger "dead zones"

## Examples

### Dashboard Layout

```tsx
function Dashboard() {
  return (
    <CenteredContainer maxWidth="lg" padding={24}>
      <header>
        <h1>Dashboard</h1>
      </header>
      
      <div className="grid grid-cols-3 gap-4">
        <Widget title="Users" value="1,234" />
        <Widget title="Revenue" value="$45,678" />
        <Widget title="Growth" value="+12%" />
      </div>
      
      <section>
        <h2>Recent Activity</h2>
        <ActivityList />
      </section>
    </CenteredContainer>
  );
}
```

### Form Layout

```tsx
function SettingsForm() {
  return (
    <CenteredContainer maxWidth="sm" padding={32}>
      <h1>Settings</h1>
      
      <form>
        <div className="space-y-4">
          <Input label="Name" />
          <Input label="Email" type="email" />
          <Textarea label="Bio" />
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </CenteredContainer>
  );
}
```

### Marketing Page

```tsx
function AboutPage() {
  return (
    <CenteredContainer maxWidth="lg" className="py-16">
      <h1 className="text-4xl font-medium mb-8">About Us</h1>
      
      <div className="prose">
        <p>We are building the future of...</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mt-12">
        <TeamMember name="Alice" role="CEO" />
        <TeamMember name="Bob" role="CTO" />
      </div>
    </CenteredContainer>
  );
}
```

## Accessibility

The component supports all standard HTML attributes including ARIA attributes:

```tsx
<CenteredContainer
  role="main"
  aria-label="Main content"
  aria-describedby="content-description"
>
  <div id="content-description">
    This is the main content area
  </div>
</CenteredContainer>
```

## Testing

The component has comprehensive test coverage:

- **Property-based tests**: Verify universal properties hold across all inputs
- **Unit tests**: Test specific behaviors and edge cases
- **Integration tests**: Verify component works in real layouts

See:
- `tests/unit/components/layout-constraints.property.test.tsx`
- `tests/unit/components/centered-container.test.tsx`

## Design Reference

- **Spec**: `.kiro/specs/linear-ui-performance-refactor/design.md`
- **Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5
- **Properties**: 14, 15, 16, 17

## Related Components

- `SafeArea` - iOS safe area handling
- `AppShell` - Application shell layout
- `MainSidebar` - Sidebar navigation

## Migration Guide

When migrating existing layouts to use `CenteredContainer`:

1. Identify pages with full-width content
2. Wrap main content in `CenteredContainer`
3. Choose appropriate `maxWidth` variant
4. Adjust padding if needed
5. Test on various viewport sizes

```tsx
// Before
<div className="w-full px-6">
  <h1>Dashboard</h1>
  <div>Content</div>
</div>

// After
<CenteredContainer maxWidth="lg" padding={24}>
  <h1>Dashboard</h1>
  <div>Content</div>
</CenteredContainer>
```
