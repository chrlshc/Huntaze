# OnlyFans Messages - Quick Start Guide

## Overview

The OnlyFans Messages interface is a three-column messaging system for content creators to manage fan conversations. This guide helps you get started with the implementation.

## File Structure

```
components/messages/          # All messaging components
├── MessagingInterface.tsx     # Main container (3-column layout)
├── FanList.tsx               # Left column (conversation list)
├── ChatContainer.tsx         # Center column (active chat)
├── ContextPanel.tsx          # Right column (fan info)
└── *.css                     # Component styles

lib/messages/                 # Messaging utilities
├── message-grouping.ts       # Group messages by sender
├── date-grouping.ts          # Group messages by date
└── optimistic-ui.ts          # Optimistic UI logic

styles/                       # Global styles
├── tailadmin-tokens.css      # Design tokens
├── messaging-monochrome.css  # Monochrome palette
└── messaging-spacing-tokens.css

app/(app)/onlyfans/messages/
└── page.tsx                  # Messages page entry point

.kiro/specs/onlyfans-messages-3col/
├── requirements.md           # Feature requirements
├── design.md                 # Design document
├── tasks.md                  # Implementation tasks
└── IMPLEMENTATION_STATUS.md  # Current status
```

## Quick Links

- **Requirements:** `.kiro/specs/onlyfans-messages-3col/requirements.md`
- **Design Document:** `.kiro/specs/onlyfans-messages-3col/design.md`
- **Task List:** `.kiro/specs/onlyfans-messages-3col/tasks.md`
- **Status:** `.kiro/specs/onlyfans-messages-3col/IMPLEMENTATION_STATUS.md`

## Key Components

### MessagingInterface
Main container that orchestrates the three-column layout.

```typescript
import { MessagingInterface } from '@/components/messages/MessagingInterface';

export default function MessagesPage() {
  return <MessagingInterface />;
}
```

**Features:**
- Responsive 3-column layout (desktop/tablet/mobile)
- Conversation state management
- Keyboard shortcuts (Ctrl/Cmd+K, Escape)
- Mock data for demonstration

### FanList
Left column displaying searchable conversation list.

```typescript
<FanList
  conversations={conversations}
  activeConversationId={selectedId}
  onConversationSelect={setSelectedId}
/>
```

**Features:**
- Search with debouncing (300ms)
- Filter buttons (All, Unread, VIP)
- Unread count badges
- Online status indicators

### ChatContainer
Center column showing active conversation messages.

```typescript
<ChatContainer
  conversationId={id}
  fanName={name}
  fanAvatar={avatar}
  messages={messages}
  isTyping={isTyping}
  onSendMessage={handleSend}
/>
```

**Features:**
- Message grouping by date and sender
- Typing indicators
- Message status (sending → sent → delivered → read)
- Auto-scroll to bottom

### ContextPanel
Right column displaying fan metadata and notes.

```typescript
<ContextPanel
  fanContext={context}
  onAddNote={handleAddNote}
  onRemoveTag={handleRemoveTag}
/>
```

**Features:**
- Fan metadata (join date, spending, tier)
- Notes grouped by category
- Tags with remove buttons
- Status badges

## Design System

### Colors (Monochrome Palette)
```css
--msg-text-primary: #111111;      /* Main text */
--msg-text-secondary: #666666;    /* Labels */
--msg-text-tertiary: #999999;     /* Timestamps */
--msg-panel-bg: #FFFFFF;          /* Panel background */
--msg-separator-dark: #CCCCCC;    /* Borders */
--msg-hover-bg: #FAFAFA;          /* Hover state */
--msg-selected-bg: #F2F2F2;       /* Selected state */
```

### Typography
```css
--msg-text-xs: 11px;              /* Metadata */
--msg-text-sm: 12px;              /* Labels */
--msg-text-base: 13px;            /* Body text */
--msg-text-lg: 15px;              /* Message content */
--msg-text-xl: 16px;              /* Headers */
```

### Spacing (4px base unit)
```css
--msg-space-xs: 4px;
--msg-space-sm: 8px;
--msg-space-md: 12px;
--msg-space-lg: 16px;
--msg-space-xl: 24px;
--msg-space-2xl: 32px;
```

## Common Tasks

### Add a New Conversation
```typescript
const newConversation: FanCardProps = {
  id: 'new-id',
  name: 'Fan Name',
  avatarUrl: 'https://...',
  lastMessage: 'Last message text',
  timestamp: '2m',
  unreadCount: 0,
  isOnline: true,
  tags: ['VIP'],
};

conversations.push(newConversation);
```

### Send a Message
```typescript
const handleSendMessage = (content: string) => {
  const newMessage: ChatMessage = {
    id: `m${Date.now()}`,
    content,
    timestamp: new Date(),
    sender: {
      id: 'creator',
      name: 'Creator',
      avatar: 'https://...',
      type: 'creator',
    },
    status: 'sending',
  };

  // Add optimistically
  setMessages([...messages, newMessage]);

  // Simulate sending
  setTimeout(() => {
    // Update status to 'sent'
  }, 500);
};
```

### Add a Note
```typescript
const handleAddNote = () => {
  const newNote: Note = {
    id: `n${Date.now()}`,
    content: 'Note content',
    createdAt: new Date(),
    author: 'Me',
    category: 'engagement',
  };

  // Add to fan context
  fanContext.notes.push(newNote);
};
```

### Filter Conversations
```typescript
const filteredConversations = conversations.filter(conv => {
  // By search query
  if (searchQuery) {
    return conv.name.toLowerCase().includes(searchQuery.toLowerCase());
  }

  // By filter
  if (filter === 'unread') {
    return (conv.unreadCount ?? 0) > 0;
  }
  if (filter === 'vip') {
    return conv.tags?.includes('VIP');
  }

  return true;
});
```

## Responsive Breakpoints

```css
/* Desktop: 3 columns */
@media (min-width: 1024px) {
  grid-template-columns: 280px 1fr 280px;
}

/* Tablet: 2 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  grid-template-columns: 35% 1fr;
}

/* Mobile: 1 column */
@media (max-width: 767px) {
  grid-template-columns: 1fr;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search input |
| `Escape` | Clear selection (mobile) |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Tab` | Navigate to next element |

## Accessibility Features

- ✅ Semantic HTML (main, aside, nav, section)
- ✅ ARIA labels on major regions
- ✅ Keyboard navigation support
- ✅ Focus indicators (2px outline)
- ✅ Screen reader support
- ✅ Color contrast compliance (WCAG AA)
- ✅ Respects prefers-reduced-motion

## Performance Tips

1. **Message Virtualization:** For 100+ messages, use virtualization to render only visible items
2. **Debounced Search:** Search is debounced at 300ms to reduce re-renders
3. **Memoization:** Use React.memo for pure components to prevent unnecessary re-renders
4. **Message Caching:** Cache messages by conversation ID to avoid re-fetching
5. **Lazy Loading:** Load older messages on scroll up, newer messages on scroll down

## Testing

### Manual Testing Checklist
- [ ] Desktop layout shows 3 columns
- [ ] Tablet layout shows 2 columns with toggle
- [ ] Mobile layout shows 1 column with navigation
- [ ] Search filters conversations
- [ ] Filter buttons work
- [ ] Selecting conversation loads messages
- [ ] Sending message works
- [ ] Typing indicator displays
- [ ] Context panel shows fan info
- [ ] Keyboard shortcuts work
- [ ] Focus indicators visible

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Property-based tests
npm run test:property

# All tests
npm run test
```

## Debugging

### Enable Debug Logging
```typescript
// In MessagingInterface.tsx
const DEBUG = true;

if (DEBUG) {
  console.log('Selected conversation:', selectedConversation);
  console.log('Messages:', messages);
  console.log('Fan context:', currentFanContext);
}
```

### Check Component Props
```typescript
// Use React DevTools to inspect component props
// Look for:
// - selectedConversation ID
// - messages array
// - fanContext data
// - isTyping state
```

### Verify Styling
```typescript
// Check computed styles in DevTools
// Look for:
// - Grid layout (3 columns on desktop)
// - Color values (monochrome palette)
// - Spacing (4px base unit)
// - Typography (Satoshi font)
```

## Common Issues & Solutions

### Issue: Messages not displaying
**Solution:** Check that messages array is populated and ChatContainer is receiving correct props

### Issue: Search not working
**Solution:** Verify debounce delay (300ms) and search query is being passed to filter logic

### Issue: Layout not responsive
**Solution:** Check media queries in messaging-interface.css and verify viewport width

### Issue: Styling looks wrong
**Solution:** Verify CSS files are imported and monochrome palette tokens are applied

### Issue: Keyboard shortcuts not working
**Solution:** Check that event listeners are attached and not being prevented by other handlers

## Next Steps

1. **Complete Keyboard Navigation** (Task 6.1)
   - Add Tab key navigation
   - Implement keyboard shortcuts
   - Test focus order

2. **Add ARIA Labels** (Task 6.2)
   - Add semantic HTML
   - Add aria-label attributes
   - Test with screen reader

3. **Implement Performance Optimization** (Tasks 7.1-7.3)
   - Add message virtualization
   - Implement memoization
   - Add message caching

4. **Add Error Handling** (Tasks 8.1-8.3)
   - Implement error boundaries
   - Add retry logic
   - Handle network disconnection

5. **Create Test Suite** (Tasks 9.1-9.3)
   - Write unit tests
   - Write property-based tests
   - Write integration tests

## Resources

- **Design Tokens:** `styles/messaging-monochrome.css`
- **Component Docs:** `components/messages/README.md`
- **Requirements:** `.kiro/specs/onlyfans-messages-3col/requirements.md`
- **Design Document:** `.kiro/specs/onlyfans-messages-3col/design.md`
- **Task List:** `.kiro/specs/onlyfans-messages-3col/tasks.md`

## Support

For questions or issues:
1. Check the requirements document for feature specifications
2. Check the design document for design decisions
3. Check the task list for implementation status
4. Review component README files for usage examples
5. Check the implementation status for current progress

