# Accessibility Quick Reference Guide

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate forward through elements |
| `Shift+Tab` | Navigate backward through elements |
| `Ctrl/Cmd+K` | Focus search input |
| `Enter` | Select conversation / Send message |
| `Shift+Enter` | New line in message input |
| `Escape` | Clear selection / Close modal |

## Focus Indicators

All interactive elements have visible focus indicators:
- **Style**: 2px solid black outline (#111111)
- **Offset**: 2px (outset) or -2px (inset for pills)
- **Contrast**: 21:1 (exceeds WCAG AAA)
- **Trigger**: Keyboard navigation only (`:focus-visible`)

## Semantic HTML Elements

| Element | Usage |
|---------|-------|
| `<main>` | Primary content (chat area) |
| `<nav>` | Navigation (conversation list) |
| `<aside>` | Supplementary content (context panel) |
| `<section>` | Content sections |
| `<button>` | Interactive buttons |
| `<form>` | Message input form |
| `<label>` | Form input labels |
| `<ul>` / `<li>` | Conversation list |

## ARIA Attributes

| Attribute | Usage | Example |
|-----------|-------|---------|
| `aria-label` | Describes element purpose | `aria-label="Search conversations"` |
| `aria-describedby` | Links to detailed description | `aria-describedby="search-help"` |
| `aria-pressed` | Toggle button state | `aria-pressed="true"` |
| `aria-live` | Announces dynamic content | `aria-live="polite"` |
| `aria-busy` | Indicates loading state | `aria-busy="true"` |
| `aria-required` | Marks required fields | `aria-required="true"` |
| `aria-invalid` | Indicates validation errors | `aria-invalid="true"` |

## Screen Reader Only Content

Use the `.sr-only` class to hide content visually but keep it available to screen readers:

```html
<div id="search-help" class="sr-only">
  Type to search conversations. Use Ctrl+K to focus this search from anywhere.
</div>
```

## Component Accessibility Checklist

### When Adding a New Button
- [ ] Use `<button>` element (not `<div role="button">`)
- [ ] Add descriptive `aria-label` if text not visible
- [ ] Ensure focus indicator is visible
- [ ] Test with keyboard navigation
- [ ] Test with screen reader

### When Adding a New Input
- [ ] Use semantic `<input>` or `<textarea>` element
- [ ] Associate `<label>` with `for` attribute
- [ ] Add `aria-describedby` for help text
- [ ] Ensure focus indicator is visible
- [ ] Test with keyboard navigation

### When Adding a New List
- [ ] Use `<ul>` and `<li>` elements
- [ ] Add `role="list"` and `aria-label` to `<ul>`
- [ ] Add `role="presentation"` to `<li>` if needed
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader

### When Adding Dynamic Content
- [ ] Use `aria-live="polite"` for announcements
- [ ] Use `aria-busy="true"` during loading
- [ ] Update `aria-label` when content changes
- [ ] Test with screen reader

## Testing Tools

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Built-in Chrome DevTools

### Screen Readers
- **NVDA** (Windows) - Free, open-source
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS/iOS) - Built-in
- **TalkBack** (Android) - Built-in

### Keyboard Navigation Testing
1. Unplug mouse or disable trackpad
2. Use Tab to navigate forward
3. Use Shift+Tab to navigate backward
4. Use Enter/Space to activate buttons
5. Use arrow keys for list navigation

## Common Accessibility Issues

### ❌ Don't Do This
```html
<!-- Bad: Using div as button -->
<div role="button" onClick={handleClick}>Click me</div>

<!-- Bad: No label for input -->
<input type="text" placeholder="Search..." />

<!-- Bad: No focus indicator -->
button:focus { outline: none; }

<!-- Bad: Color as sole means of communication -->
<span style="color: red">Error</span>

<!-- Bad: No alt text for images -->
<img src="avatar.jpg" />
```

### ✅ Do This Instead
```html
<!-- Good: Using button element -->
<button onClick={handleClick}>Click me</button>

<!-- Good: Label associated with input -->
<label htmlFor="search">Search:</label>
<input id="search" type="text" />

<!-- Good: Visible focus indicator -->
button:focus-visible {
  outline: 2px solid #111111;
  outline-offset: 2px;
}

<!-- Good: Text + color for communication -->
<span style="color: red">Error: Invalid email</span>

<!-- Good: Alt text for images -->
<img src="avatar.jpg" alt="User avatar" />
```

## WCAG 2.1 Compliance Levels

### Level A (Minimum)
- Keyboard accessible
- Proper heading hierarchy
- Form labels
- Alt text for images

### Level AA (Recommended)
- 4.5:1 contrast ratio for text
- Visible focus indicators
- Proper error messages
- Resizable text

### Level AAA (Enhanced)
- 7:1 contrast ratio for text
- Extended audio descriptions
- Sign language interpretation
- Simplified language

**Our Implementation**: WCAG 2.1 Level AA ✅

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Getting Help

For accessibility questions or issues:
1. Check this quick reference guide
2. Review component documentation
3. Test with keyboard and screen reader
4. Consult WCAG 2.1 guidelines
5. Ask the team for help

## Accessibility Contacts

- **Accessibility Lead**: [Name]
- **QA Accessibility**: [Name]
- **Documentation**: [Name]

---

**Last Updated**: December 19, 2025
**Version**: 1.0
**Status**: Active
