# Accessibility Guidelines

The Huntaze Design System is built with accessibility as a core principle, ensuring all users can interact with the application effectively.

## WCAG 2.1 AA Compliance

All components and patterns meet or exceed WCAG 2.1 Level AA standards.

## Color Contrast

### Text Contrast

All text meets minimum contrast requirements:

| Text Size | Background | Contrast Ratio | Requirement |
|-----------|------------|----------------|-------------|
| < 18px regular | `--bg-primary` | 18.5:1 | ✓ Exceeds 4.5:1 |
| < 18px regular | `--bg-tertiary` | 14.8:1 | ✓ Exceeds 4.5:1 |
| ≥ 18px or bold | `--bg-primary` | 7.2:1 | ✓ Exceeds 3:1 |
| Accent on dark | `--accent-primary` | 4.8:1 | ✓ Meets 4.5:1 |

### Testing Contrast

```tsx
// ✅ Good - High contrast
<p className="text-[var(--text-primary)] bg-[var(--bg-primary)]">
  Primary text on primary background
</p>

// ✅ Good - Sufficient contrast
<p className="text-[var(--text-secondary)] bg-[var(--bg-primary)]">
  Secondary text on primary background
</p>

// ❌ Bad - Insufficient contrast
<p className="text-[var(--text-quaternary)] bg-[var(--bg-primary)]">
  Quaternary text (too low contrast for body text)
</p>
```

## Keyboard Navigation

### Focus Indicators

All interactive elements have visible focus indicators:

```css
.interactive-element:focus-visible {
  outline: none;
  ring: var(--focus-ring-width) solid var(--focus-ring-color);
  ring-offset: var(--focus-ring-offset);
}
```

### Tab Order

Maintain logical tab order:

```tsx
// ✅ Good - Logical order
<form>
  <Input name="name" />
  <Input name="email" />
  <Button type="submit">Submit</Button>
</form>

// ❌ Bad - Broken tab order
<form>
  <Input name="name" tabIndex={3} />
  <Input name="email" tabIndex={1} />
  <Button type="submit" tabIndex={2}>Submit</Button>
</form>
```

### Keyboard Shortcuts

Common keyboard interactions:

| Key | Action |
|-----|--------|
| Tab | Move focus forward |
| Shift + Tab | Move focus backward |
| Enter | Activate button/link |
| Space | Activate button, toggle checkbox |
| Escape | Close modal/dropdown |
| Arrow keys | Navigate lists/menus |

## Touch Targets

### Minimum Size

All interactive elements meet minimum touch target size:

```tsx
// ✅ Good - 44x44px minimum
<button className="min-h-[44px] min-w-[44px] p-[var(--space-3)]">
  <Icon />
</button>

// ❌ Bad - Too small
<button className="p-1">
  <Icon />
</button>
```

### Spacing

Provide adequate spacing between touch targets:

```tsx
// ✅ Good - Adequate spacing
<div className="flex gap-[var(--space-3)]">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

// ❌ Bad - Too close
<div className="flex gap-1">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

## Semantic HTML

### Use Proper Elements

```tsx
// ✅ Good - Semantic HTML
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<button onClick={handleClick}>Click me</button>

<h1>Page Title</h1>
<h2>Section Title</h2>

// ❌ Bad - Non-semantic
<div className="nav">
  <div className="link">Home</div>
  <div className="link">About</div>
</div>

<div onClick={handleClick}>Click me</div>

<div className="title">Page Title</div>
<div className="subtitle">Section Title</div>
```

## ARIA Labels

### When to Use ARIA

Use ARIA attributes when semantic HTML isn't sufficient:

```tsx
// Icon button without text
<button aria-label="Close modal">
  <X />
</button>

// Loading state
<button aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Disabled state
<button aria-disabled={isDisabled} disabled={isDisabled}>
  Submit
</button>

// Modal
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Action</h2>
  <p>Are you sure?</p>
</div>
```

### Common ARIA Attributes

| Attribute | Use Case | Example |
|-----------|----------|---------|
| `aria-label` | Label for elements without text | Icon buttons |
| `aria-labelledby` | Reference to label element | Modal titles |
| `aria-describedby` | Reference to description | Form hints |
| `aria-hidden` | Hide decorative elements | Decorative icons |
| `aria-live` | Announce dynamic content | Notifications |
| `aria-expanded` | Collapsible state | Dropdowns |
| `aria-selected` | Selection state | Tabs, lists |

## Screen Readers

### Descriptive Text

Provide context for screen reader users:

```tsx
// ✅ Good - Descriptive
<button aria-label="Delete user John Doe">
  <Trash />
</button>

// ❌ Bad - Not descriptive
<button aria-label="Delete">
  <Trash />
</button>
```

### Hide Decorative Content

```tsx
// Hide decorative icons
<div>
  <span aria-hidden="true">🎉</span>
  <span>Congratulations!</span>
</div>

// Hide duplicate content
<button>
  <span aria-hidden="true">→</span>
  <span>Next</span>
</button>
```

### Live Regions

Announce dynamic content:

```tsx
// Success message
<div role="status" aria-live="polite">
  Changes saved successfully
</div>

// Error message
<div role="alert" aria-live="assertive">
  Error: Please fix the form errors
</div>
```

## Forms

### Labels

Always associate labels with inputs:

```tsx
// ✅ Good - Explicit association
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Good - Implicit association
<label>
  Email
  <input type="email" />
</label>

// ❌ Bad - No association
<div>Email</div>
<input type="email" />
```

### Error Messages

Link error messages to inputs:

```tsx
<div>
  <label htmlFor="email">Email</label>
  <input 
    id="email" 
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <p id="email-error" role="alert">
      Please enter a valid email
    </p>
  )}
</div>
```

### Required Fields

Indicate required fields:

```tsx
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<input id="name" required aria-required="true" />
```

## Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// Check in JavaScript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // Apply animations
}
```

## High Contrast Mode

Support high contrast preferences:

```css
@media (prefers-contrast: high) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #e5e5e5;
    --border-subtle: rgba(255, 255, 255, 0.3);
    --border-default: rgba(255, 255, 255, 0.5);
  }
}
```

## Testing Checklist

### Manual Testing

- [ ] Navigate entire page using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify all interactive elements have focus indicators
- [ ] Check color contrast with tools
- [ ] Test with browser zoom at 200%
- [ ] Verify touch targets on mobile device
- [ ] Test with reduced motion enabled
- [ ] Test with high contrast mode

### Automated Testing

```tsx
// Example with jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Common Patterns

### Modal

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <div>
    <button onClick={onCancel}>Cancel</button>
    <button onClick={onConfirm}>Confirm</button>
  </div>
</div>
```

### Dropdown

```tsx
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="dropdown-menu"
  onClick={toggle}
>
  Menu
</button>
{isOpen && (
  <ul id="dropdown-menu" role="menu">
    <li role="menuitem">
      <button>Option 1</button>
    </li>
    <li role="menuitem">
      <button>Option 2</button>
    </li>
  </ul>
)}
```

### Tabs

```tsx
<div role="tablist">
  <button
    role="tab"
    aria-selected={activeTab === 'tab1'}
    aria-controls="panel1"
    id="tab1"
  >
    Tab 1
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 'tab2'}
    aria-controls="panel2"
    id="tab2"
  >
    Tab 2
  </button>
</div>
<div
  role="tabpanel"
  id="panel1"
  aria-labelledby="tab1"
  hidden={activeTab !== 'tab1'}
>
  Panel 1 content
</div>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

[← Back to Design System](./README.md)
