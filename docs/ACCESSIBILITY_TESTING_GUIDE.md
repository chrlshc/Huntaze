# Accessibility Testing Guide

## Overview

This guide provides step-by-step instructions for testing the accessibility of the Huntaze Beta Launch UI System.

---

## Automated Testing

### 1. axe-core Testing

Install axe DevTools browser extension:
- Chrome: [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- Firefox: [axe DevTools](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

**Steps:**
1. Open the page you want to test
2. Open DevTools (F12)
3. Navigate to the "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review issues by severity (Critical, Serious, Moderate, Minor)
6. Fix all Critical and Serious issues
7. Document Moderate and Minor issues for future improvement

**Pages to Test:**
- `/` - Landing page
- `/auth/register` - Registration
- `/auth/login` - Login
- `/auth/verify-pending` - Email verification pending
- `/onboarding` - Onboarding flow (all 3 steps)
- `/home` - Home page
- `/integrations` - Integrations page

### 2. Lighthouse Accessibility Audit

**Steps:**
1. Open Chrome DevTools (F12)
2. Navigate to the "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Analyze page load"
5. Review the accessibility score (target: 95+)
6. Fix all issues identified
7. Re-run audit to verify fixes

**Command Line (CI/CD):**
```bash
npm run lighthouse -- --only-categories=accessibility
```

### 3. WAVE Evaluation Tool

Visit [WAVE](https://wave.webaim.org/) and enter your page URL.

**What to Check:**
- ✅ No errors (red icons)
- ✅ Minimal alerts (yellow icons)
- ✅ Proper heading structure
- ✅ All images have alt text
- ✅ Form labels are associated
- ✅ ARIA landmarks are present

---

## Manual Keyboard Testing

### Navigation Flow

**Test all pages with keyboard only (no mouse):**

1. **Tab Navigation**
   - Press `Tab` to move forward through interactive elements
   - Press `Shift+Tab` to move backward
   - Verify focus indicator is visible on all elements
   - Verify focus order is logical (top to bottom, left to right)

2. **Enter/Space Activation**
   - Press `Enter` on links and buttons
   - Press `Space` on buttons and checkboxes
   - Verify all interactive elements respond correctly

3. **Escape Key**
   - Press `Escape` to close modals/dialogs
   - Verify focus returns to trigger element

4. **Arrow Keys**
   - Test radio button groups (arrow keys should navigate)
   - Test dropdown menus (if present)

### Keyboard Testing Checklist

#### Landing Page (`/`)
- [ ] Tab through all navigation links
- [ ] Tab to primary CTA button
- [ ] Press Enter on CTA button
- [ ] Tab through stat cards
- [ ] Verify skip link appears on first Tab

#### Registration Page (`/auth/register`)
- [ ] Tab to email input
- [ ] Tab to password input
- [ ] Tab to submit button
- [ ] Press Enter to submit form
- [ ] Tab to "Already have an account?" link
- [ ] Verify focus indicator on all elements

#### Login Page (`/auth/login`)
- [ ] Tab to email input
- [ ] Tab to password input
- [ ] Tab to submit button
- [ ] Press Enter to submit form
- [ ] Tab to "Don't have an account?" link

#### Onboarding Flow (`/onboarding`)
- [ ] Tab through content type checkboxes
- [ ] Press Space to toggle checkboxes
- [ ] Tab to Continue button
- [ ] Press Enter to advance to next step
- [ ] Tab to Back button (steps 2-3)
- [ ] Tab to Skip button

#### Home Page (`/home`)
- [ ] Press Tab to activate skip link
- [ ] Press Enter on skip link
- [ ] Verify focus moves to main content
- [ ] Tab through sidebar navigation
- [ ] Tab through stat cards
- [ ] Tab through quick action buttons
- [ ] Tab through platform status section

#### Integrations Page (`/integrations`)
- [ ] Tab through integration cards
- [ ] Tab to Connect/Disconnect buttons
- [ ] Press Enter on buttons
- [ ] Verify modal keyboard navigation (if present)

---

## Screen Reader Testing

### NVDA (Windows - Free)

**Download:** [NVDA](https://www.nvaccess.org/download/)

**Basic Commands:**
- `Ctrl` - Stop reading
- `Insert+Down Arrow` - Read from current position
- `Insert+Space` - Toggle browse/focus mode
- `H` - Next heading
- `Shift+H` - Previous heading
- `K` - Next link
- `Shift+K` - Previous link
- `B` - Next button
- `Shift+B` - Previous button
- `F` - Next form field
- `Shift+F` - Previous form field

**Testing Steps:**
1. Start NVDA
2. Navigate to the page
3. Press `Insert+Down Arrow` to read the entire page
4. Use heading navigation (`H`) to verify structure
5. Use form field navigation (`F`) to test forms
6. Verify all interactive elements are announced correctly
7. Verify focus indicator is announced

### VoiceOver (macOS - Built-in)

**Enable:** System Preferences → Accessibility → VoiceOver → Enable

**Basic Commands:**
- `Cmd+F5` - Toggle VoiceOver on/off
- `VO+A` - Read from current position (VO = Ctrl+Option)
- `VO+Right Arrow` - Next item
- `VO+Left Arrow` - Previous item
- `VO+Cmd+H` - Next heading
- `VO+Cmd+Shift+H` - Previous heading
- `VO+Cmd+L` - Next link
- `VO+Cmd+J` - Next form control

**Testing Steps:**
1. Enable VoiceOver (`Cmd+F5`)
2. Navigate to the page
3. Use `VO+A` to read the entire page
4. Use heading navigation to verify structure
5. Use form control navigation to test forms
6. Verify all interactive elements are announced correctly

### TalkBack (Android - Built-in)

**Enable:** Settings → Accessibility → TalkBack → Enable

**Basic Gestures:**
- Swipe right - Next item
- Swipe left - Previous item
- Double tap - Activate item
- Swipe down then right - Read from top
- Swipe up then down - Read from current position

**Testing Steps:**
1. Enable TalkBack
2. Navigate to the page in Chrome
3. Swipe right to navigate through elements
4. Double tap to activate buttons/links
5. Verify all interactive elements are announced correctly

---

## Color Contrast Testing

### Chrome DevTools

**Steps:**
1. Open DevTools (F12)
2. Click "Inspect" tool (Ctrl+Shift+C)
3. Hover over text elements
4. Check the "Contrast" section in the Styles panel
5. Verify contrast ratio is at least 4.5:1 for normal text
6. Verify contrast ratio is at least 3:1 for large text (18pt+)

### WebAIM Contrast Checker

Visit [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Test These Combinations:**
- Primary text: `#FFFFFF` on `#000000` (Expected: 21:1 ✅)
- Secondary text: `#a3a3a3` on `#000000` (Expected: 7.5:1 ✅)
- Muted text: `#737373` on `#000000` (Expected: 4.6:1 ✅)
- Brand primary: `#8B5CF6` on `#000000` (Expected: 8.2:1 ✅)
- Beta text: `#9ca3af` on `#000000` (Expected: 7.1:1 ✅)

---

## Zoom Testing

### Browser Zoom

**Test at these zoom levels:**
- 100% (baseline)
- 200% (WCAG requirement)
- 400% (extreme case)

**What to Check:**
- [ ] Text remains readable
- [ ] Layout doesn't break
- [ ] No horizontal scrolling (except at 400%)
- [ ] Interactive elements remain accessible
- [ ] Focus indicators remain visible

**Steps:**
1. Open the page
2. Press `Ctrl+` (Windows) or `Cmd+` (macOS) to zoom in
3. Verify layout at 200% zoom
4. Verify layout at 400% zoom
5. Press `Ctrl+0` or `Cmd+0` to reset zoom

---

## Reduced Motion Testing

### Enable Reduced Motion

**Windows:**
Settings → Ease of Access → Display → Show animations in Windows → Off

**macOS:**
System Preferences → Accessibility → Display → Reduce motion → On

**What to Check:**
- [ ] Animations are disabled or minimal
- [ ] Transitions are instant or very short
- [ ] Gradient animations are disabled
- [ ] Pulse animations are disabled
- [ ] Page remains functional without animations

---

## High Contrast Mode Testing

### Enable High Contrast

**Windows:**
Settings → Ease of Access → High contrast → Turn on high contrast

**What to Check:**
- [ ] Borders are visible
- [ ] Text is readable
- [ ] Interactive elements are distinguishable
- [ ] Focus indicators are visible
- [ ] Icons are visible

---

## Form Testing

### Error Handling

**Test these scenarios:**
1. Submit empty form
   - [ ] Error messages appear
   - [ ] Error messages have `role="alert"`
   - [ ] Invalid fields have `aria-invalid="true"`
   - [ ] Focus moves to first error

2. Submit invalid email
   - [ ] Email validation error appears
   - [ ] Error is announced by screen reader

3. Submit short password
   - [ ] Password validation error appears
   - [ ] Error is announced by screen reader

### Label Association

**Verify:**
- [ ] All inputs have associated `<label>` elements
- [ ] Label `for` attribute matches input `id`
- [ ] Clicking label focuses input
- [ ] Screen reader announces label when input is focused

---

## Common Issues and Fixes

### Issue: Focus indicator not visible
**Fix:** Ensure `:focus-visible` styles are applied with sufficient contrast

### Issue: Form labels not associated
**Fix:** Add `<label for="input-id">` and matching `id="input-id"` on input

### Issue: Button has no accessible name
**Fix:** Add descriptive text or `aria-label="Description"`

### Issue: Image missing alt text
**Fix:** Add `alt="Description"` or `alt=""` for decorative images

### Issue: Heading hierarchy skips levels
**Fix:** Use sequential heading levels (h1 → h2 → h3)

### Issue: Keyboard trap in modal
**Fix:** Implement focus trap with Tab/Shift+Tab cycling and Escape to close

### Issue: Color-only information
**Fix:** Add icons, text, or patterns in addition to color

---

## Accessibility Checklist

### Before Release
- [ ] Run axe-core on all pages (0 Critical/Serious issues)
- [ ] Run Lighthouse accessibility audit (95+ score)
- [ ] Test keyboard navigation on all pages
- [ ] Test with NVDA or VoiceOver
- [ ] Verify color contrast ratios
- [ ] Test at 200% zoom
- [ ] Test with reduced motion enabled
- [ ] Test with high contrast mode
- [ ] Verify all forms have proper labels
- [ ] Verify all images have alt text
- [ ] Verify heading hierarchy
- [ ] Verify skip navigation link works
- [ ] Test error handling and validation

### Ongoing
- [ ] Include accessibility in code reviews
- [ ] Run automated tests in CI/CD
- [ ] Conduct quarterly accessibility audits
- [ ] Test with real users with disabilities
- [ ] Keep team trained on WCAG guidelines

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Keyboard Testing](https://webaim.org/articles/keyboard/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University](https://dequeuniversity.com/)

---

## Conclusion

Accessibility testing is an ongoing process. Regular testing with automated tools, manual keyboard testing, and screen reader testing ensures the Huntaze Beta Launch UI System remains accessible to all users.

**Remember:** Automated tools catch ~30-40% of accessibility issues. Manual testing is essential for comprehensive coverage.
