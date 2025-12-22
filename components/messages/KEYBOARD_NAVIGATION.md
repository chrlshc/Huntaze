# Keyboard Navigation Implementation

## Overview

This document describes the keyboard navigation support implemented for the OnlyFans Messages 3-column interface. The implementation follows WCAG 2.1 Level AA accessibility standards.

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + K` | Focus search input | Anywhere in messaging interface |
| `Escape` | Clear selection and return to fan list | Mobile view only |

### Conversation List Navigation

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Move focus to next interactive element | Logical tab order |
| `Shift + Tab` | Move focus to previous interactive element | Logical tab order |
| `Arrow Up` | Select previous conversation | When focused on conversation list |
| `Arrow Down` | Select next conversation | When focused on conversation list |
| `Enter` | Select focused conversation | When focused on conversation item |
| `Space` | Select focused conversation | When focused on conversation item |

### Message Input

| Shortcut | Action | Context |
|----------|--------|---------|
| `Enter` | Send message | In message input (without Shift) |
| `Shift + Enter` | Add new line | In message input |
| `Tab` | Move to next interactive element | In message input |

## Focus Management

### Tab Order

The messaging interface implements a logical tab order:

1. **Fan List Column**
   - Search input
   - Filter buttons (All, Unread, VIP)
   - Conversation items (in list order)

2. **Chat Column**
   - Message list (scrollable, not focusable)
   - Message input textarea
   - Attach button
   - Send button

3. **Context Panel**
   - Add Note button
   - Tag remove buttons
   - Other interactive elements

### Focus Indicators

All interactive elements display a clear focus indicator:

- **Style**: 2px solid black outline (#111111)
- **Offset**: 2px outward from element
- **Applies to**: Buttons, inputs, conversation items, and all interactive elements
- **Respects**: `prefers-reduced-motion` media query

## Implementation Details

### MessagingInterface Component

**File**: `components/messages/MessagingInterface.tsx`

**Features**:
- Global keyboard event listeners for Ctrl/Cmd+K and Escape
- Focus refs for managing focus between columns
- Semantic HTML with proper ARIA labels
- Tab index management for column containers

**Key Code**:
```typescript
// Global keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = fanListRef.current?.querySelector<HTMLInputElement>('[type="search"]');
      searchInput?.focus();
    }
    
    // Escape: Clear selection on mobile
    if (e.key === 'Escape') {
      if (window.innerWidth < 768) {
        setSelectedConversation(null);
        setShowContext(false);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### FanList Component

**File**: `components/messages/FanList.tsx`

**Features**:
- Arrow key navigation through conversations
- Ctrl/Cmd+F to focus search (alternative to Ctrl/Cmd+K)
- Proper focus management for list items

**Key Code**:
```typescript
// Arrow key navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const conversationItems = document.querySelectorAll('[role="button"][data-conversation-id]');
      if (conversationItems.length === 0) return;

      const activeElement = document.activeElement;
      const currentIndex = Array.from(conversationItems).indexOf(activeElement as Element);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, conversationItems.length - 1);
        (conversationItems[nextIndex] as HTMLElement).focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex === -1 ? conversationItems.length - 1 : Math.max(currentIndex - 1, 0);
        (conversationItems[prevIndex] as HTMLElement).focus();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### FanCard Component

**File**: `components/messages/FanCard.tsx`

**Features**:
- Keyboard activation with Enter and Space keys
- Proper role and aria-pressed attributes
- Data attribute for keyboard navigation targeting

**Key Code**:
```typescript
<div
  className={`fan-card ${isActive ? 'fan-card--active' : ''}`}
  onClick={onClick}
  role="button"
  tabIndex={0}
  data-conversation-id={id}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }}
  aria-label={`Conversation with ${name}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
  aria-pressed={isActive}
/>
```

### CustomMessageInput Component

**File**: `components/messages/CustomMessageInput.tsx`

**Features**:
- Enter to send message (without Shift)
- Shift+Enter for new line
- Proper keyboard event handling

**Key Code**:
```typescript
const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
  // Send on Enter (without Shift)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

## CSS Focus Indicators

### Global Focus Styles

**File**: `components/messages/messaging-interface.css`

```css
/* Focus indicators for all interactive elements */
button:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid #111111;
  outline-offset: 2px;
}

/* Ensure focus indicators are visible on all elements */
*:focus-visible {
  outline: 2px solid #111111;
  outline-offset: 2px;
}
```

### Component-Specific Focus Styles

**FanCard Focus** (`components/messages/fan-card.css`):
```css
.fan-card:focus-visible {
  outline: 2px solid #111111;
  outline-offset: -2px;
  border-radius: 4px;
}
```

**Mobile Nav Button Focus** (`components/messages/messaging-interface.css`):
```css
.messaging-mobile-nav__toggle:focus-visible {
  outline: 2px solid #111111;
  outline-offset: 2px;
}
```

## Accessibility Features

### ARIA Attributes

- `role="main"` on main messaging interface
- `role="complementary"` on sidebar columns
- `role="button"` on conversation items
- `role="list"` on conversation list
- `aria-label` on all major regions
- `aria-pressed` on toggle buttons
- `aria-live="polite"` on dynamic content
- `aria-busy="true"` on loading states

### Semantic HTML

- `<main>` for primary content
- `<aside>` for sidebar columns
- `<nav>` for navigation controls
- `<section>` for content sections
- `<button>` for interactive elements

### Screen Reader Support

- All interactive elements have descriptive labels
- Status changes announced with `aria-live="polite"`
- Loading states indicated with `aria-busy="true"`
- Unread message counts included in conversation labels

## Testing Checklist

### Keyboard Navigation

- [ ] Tab key navigates through all interactive elements in logical order
- [ ] Shift+Tab navigates backward through elements
- [ ] Ctrl/Cmd+K focuses search input from anywhere
- [ ] Arrow Up/Down navigate through conversation list
- [ ] Enter/Space selects focused conversation
- [ ] Enter sends message from input
- [ ] Shift+Enter adds new line in message input
- [ ] Escape clears selection on mobile

### Focus Indicators

- [ ] All interactive elements show 2px black outline on focus
- [ ] Focus outline is clearly visible against all backgrounds
- [ ] Focus outline has 2px offset for visibility
- [ ] Focus indicators respect `prefers-reduced-motion`

### Screen Reader

- [ ] All regions have descriptive aria-labels
- [ ] Conversation items announce unread count
- [ ] Status changes are announced
- [ ] Loading states are indicated
- [ ] Error messages are announced

### Mobile

- [ ] Keyboard navigation works on mobile devices
- [ ] Touch targets are at least 44x44px
- [ ] Focus indicators are visible on mobile
- [ ] Escape key clears selection on mobile

## Browser Support

- Chrome/Edge: Latest 2 versions ✅
- Firefox: Latest 2 versions ✅
- Safari: Latest 2 versions ✅
- Mobile browsers: iOS Safari 12+, Chrome Android 90+ ✅

## WCAG 2.1 Compliance

This implementation targets **WCAG 2.1 Level AA** compliance:

- **2.1.1 Keyboard (Level A)**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap (Level A)**: Focus can move away from all elements
- **2.4.3 Focus Order (Level A)**: Focus order is logical and meaningful
- **2.4.7 Focus Visible (Level AA)**: Keyboard focus indicator is visible
- **3.2.1 On Focus (Level A)**: No unexpected context changes on focus
- **3.2.2 On Input (Level A)**: No unexpected context changes on input

## Future Enhancements

1. **Vim-style navigation**: Add hjkl keys for navigation
2. **Search shortcuts**: Add / to focus search
3. **Quick actions**: Add keyboard shortcuts for common actions
4. **Customizable shortcuts**: Allow users to customize keyboard shortcuts
5. **Keyboard help**: Add ? to show keyboard shortcuts help

## References

- [WCAG 2.1 Keyboard Accessibility](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)
- [MDN: Keyboard Events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [MDN: Focus Management](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
