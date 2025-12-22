# Design Document: OnlyFans Messages - 3-Column Layout

## Overview

The OnlyFans Messages interface is a professional, three-column messaging system designed for content creators to manage fan conversations efficiently. The design prioritizes focus and clarity through a monochrome (black/white/gray) palette, responsive layout adaptation, and thoughtful information hierarchy.

**Key Design Principles:**
- **Monochrome Palette**: Black (#111111), white (#FFFFFF), and grays (#666666, #999999, #CCCCCC) for a calm, focused experience
- **Responsive Adaptation**: Three columns on desktop, two on tablet, one on mobile
- **Information Hierarchy**: Typography and spacing convey importance, not color
- **Accessibility First**: WCAG AA contrast compliance, keyboard navigation, screen reader support
- **Performance**: Virtualized lists, lazy-loaded messages, optimized rendering

## Architecture

### Component Hierarchy

```
MessagingInterface (Main Container)
├── FanList (Left Column)
│   ├── SearchInput
│   ├── FilterButtons
│   └── ConversationList
│       └── ConversationCard (repeating)
│           ├── Avatar
│           ├── Name
│           ├── LastMessage
│           ├── Timestamp
│           ├── UnreadBadge
│           └── Tags
├── ChatContainer (Center Column)
│   ├── MessagingHeader
│   │   ├── FanName
│   │   ├── OnlineStatus
│   │   └── ActionButtons
│   ├── MessageList
│   │   ├── DateSeparator (repeating)
│   │   └── MessageGroup (repeating)
│   │       └── ChatMessage (repeating)
│   │           ├── Avatar
│   │           ├── MessageBubble
│   │           ├── Timestamp
│   │           └── Status
│   ├── TypingIndicator (conditional)
│   └── MessageComposer
│       ├── TextInput
│       ├── AttachButton
│       └── SendButton
├── ContextPanel (Right Column)
│   ├── FanHeader
│   │   ├── Avatar
│   │   ├── Name
│   │   └── Status
│   ├── FanMetadata
│   │   ├── JoinDate
│   │   ├── LastActive
│   │   ├── TotalSpent
│   │   └── SubscriptionTier
│   ├── NotesSection
│   │   ├── NotesList
│   │   └── AddNoteButton
│   └── TagsSection
│       ├── TagsList
│       └── RemoveTagButtons
└── MobileNavigation (Mobile Only)
    └── ToggleButtons
```

### Layout Grid System

**Desktop (>1024px):**
```
┌─────────────────────────────────────────────────────────┐
│ FanList (280px) │ ChatContainer (flex) │ ContextPanel (280px) │
│                 │                      │                      │
│ 25%             │ 50%                  │ 25%                  │
└─────────────────────────────────────────────────────────┘
```

**Tablet (768px - 1024px):**
```
┌──────────────────────────────────────────┐
│ FanList (35%) │ ChatContainer (65%)      │
│               │                          │
│ Toggle to show ContextPanel              │
└──────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────────┐
│ FanList (100%)           │
│ Toggle to ChatContainer  │
│ Toggle to ContextPanel   │
└──────────────────────────┘
```

## Components and Interfaces

### 1. MessagingInterface

**Purpose:** Orchestrates the three-column layout and manages conversation state.

**Props:**
```typescript
interface MessagingInterfaceProps {
  className?: string;
}
```

**State Management:**
- `selectedConversation`: Currently active conversation ID
- `showContext`: Whether context panel is visible (mobile/tablet)
- `messages`: Message cache by conversation ID
- `isTyping`: Whether the fan is typing

**Key Features:**
- Responsive grid layout that adapts to viewport size
- Keyboard shortcuts (Ctrl/Cmd+K for search, Escape to clear)
- Conversation persistence via URL search params
- Optimistic message UI with status tracking

### 2. FanList (Left Column)

**Purpose:** Displays searchable list of conversations with fans.

**Features:**
- Scrollable conversation list with virtualization for 100+ items
- Search/filter functionality
- Unread count badges
- Online status indicators
- Tag display
- Active conversation highlighting

**Styling:**
- Background: #FFFFFF
- Border-right: 1px solid #CCCCCC
- Hover state: #FAFAFA background
- Selected state: #F2F2F2 background with left accent border

**Responsive:**
- Desktop: 280px fixed width
- Tablet: 35% of viewport
- Mobile: Hidden when chat is selected

### 3. ChatContainer (Center Column)

**Purpose:** Displays active conversation messages and message composer.

**Sub-components:**
- **MessagingHeader**: Shows fan name, online status, action buttons
- **MessageList**: Scrollable message history with date separators
- **TypingIndicator**: Shows when fan is typing
- **MessageComposer**: Input field with send and attachment buttons

**Message Grouping:**
- Messages grouped by sender to avoid avatar repetition
- Date separators between different days
- Message status indicators (sending → sent → delivered → read)

**Styling:**
- Fan messages: White background (#FFFFFF) with light border (#E3E3E3)
- Creator messages: Light gray background (#F5F5F5)
- Timestamps: Gray text (#999999)
- Message bubbles: 12px border-radius with appropriate padding

**Responsive:**
- Desktop: Flexible width (50% of viewport)
- Tablet: 65% of viewport
- Mobile: 100% of viewport

### 4. ContextPanel (Right Column)

**Purpose:** Displays fan metadata, notes, and tags.

**Sections:**
- **Fan Header**: Avatar (80px), name, status badge
- **Fan Metadata**: Join date, last active, total spent, subscription tier
- **Notes Section**: List of notes with add/edit/delete options
- **Tags Section**: List of tags with remove options

**Styling:**
- Background: #FFFFFF
- Border-left: 1px solid #CCCCCC
- Section headers: Uppercase, gray text (#666666), 12px font
- Info rows: Flex layout with label and value

**Responsive:**
- Desktop: 280px fixed width
- Tablet: Hidden by default, toggleable
- Mobile: Hidden by default, toggleable

### 5. Message Components

**ChatMessage:**
```typescript
interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: {
    id: string;
    name: string;
    avatar: string;
    type: 'fan' | 'creator';
  };
  status: 'sending' | 'sent' | 'delivered' | 'read';
}
```

**Message Bubble Styling:**
- Fan bubbles: White with light border, left-aligned
- Creator bubbles: Light gray, right-aligned
- Max-width: 70% of container
- Padding: 12px 16px
- Border-radius: 12px with one corner cut (12px, 12px, 12px, 4px)

**Status Indicators:**
- Sending: Spinner icon
- Sent: Single checkmark
- Delivered: Double checkmark
- Read: Double checkmark with different styling

## Data Models

### Conversation
```typescript
interface Conversation {
  id: string;
  fanId: string;
  fanName: string;
  fanAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  tags: string[];
}
```

### FanContext
```typescript
interface FanContext {
  fanId: string;
  name: string;
  avatar: string;
  status: 'vip' | 'active' | 'inactive';
  joinDate: Date;
  lastActive: Date;
  totalSpent: number;
  subscriptionTier: string;
  notes: Note[];
  tags: Tag[];
}

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  author: string;
  category: 'engagement' | 'demandes' | 'risques';
}

interface Tag {
  id: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
```

## Monochrome Design System

### Color Palette

**Primary Colors:**
- Black: #111111 (primary text, primary buttons)
- White: #FFFFFF (backgrounds, card surfaces)
- Dark Gray: #666666 (secondary text)
- Medium Gray: #999999 (tertiary text, timestamps)
- Light Gray: #CCCCCC (borders, separators)
- Off-White: #F5F5F5 (hover states, creator messages)

**Semantic Colors (Monochrome Context):**
- Success: #219653 (green for online status)
- Warning: #FFA70B (orange for VIP badges)
- Danger: #111111 (black for important alerts)
- Info: #111111 (black for informational elements)

### Typography

**Font Family:** Satoshi, sans-serif

**Font Sizes:**
- XS: 11px (metadata, timestamps)
- SM: 12px (labels, section headers)
- Base: 13px (body text)
- MD: 14px (message preview)
- LG: 15px (message content)
- XL: 16px (fan name in header)
- 2XL: 18px (section titles)

**Font Weights:**
- Regular: 400 (body text)
- Medium: 500 (labels, buttons)
- Semibold: 600 (conversation names, headers)
- Bold: 700 (active conversation names)

**Line Heights:**
- Tight: 1.25 (single-line text)
- Normal: 1.5 (body text)
- Relaxed: 1.75 (multi-line text)

### Spacing System

**Base Unit:** 4px

**Spacing Scale:**
- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 24px
- 2XL: 32px

### Border Radius

- SM: 4px (buttons, small elements)
- MD: 8px (input fields, small cards)
- LG: 12px (message bubbles)
- XL: 16px (large cards)
- Pill: 999px (badges, tags)

### Shadows

**Subtle Shadows (Monochrome):**
- SM: 0 1px 3px rgba(0, 0, 0, 0.05)
- MD: 0 2px 8px rgba(0, 0, 0, 0.08)
- LG: 0 4px 16px rgba(0, 0, 0, 0.12)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Three-Column Layout Invariant

**For any** viewport size and any selected conversation state, the messaging grid SHALL maintain exactly three columns on desktop (>1024px), two columns on tablet (768-1024px), and one column on mobile (<768px).

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Monochrome Palette Consistency

**For any** rendered component in the messaging interface, all text colors SHALL be from the monochrome palette (#111111, #666666, #999999, #CCCCCC, #FFFFFF) and SHALL maintain WCAG AA contrast compliance (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Conversation Selection Persistence

**For any** conversation ID in the URL search params, if that conversation exists in the fan list, THE MessagingInterface SHALL select that conversation on initial load and display its messages in the ChatContainer.

**Validates: Requirements 1.4, 1.5**

### Property 4: Message Status Progression

**For any** message sent by the creator, the message status SHALL progress through the sequence: sending → sent → delivered → read, and each status change SHALL be reflected in the UI without removing the message from view.

**Validates: Requirements 6.1, 6.2**

### Property 5: Responsive Layout Adaptation

**For any** viewport resize event, the messaging grid layout SHALL adapt smoothly to the new viewport size without losing the selected conversation state or scrolling position in the message list.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 6: Message Grouping Invariant

**For any** sequence of messages from the same sender, the avatar SHALL appear only once at the start of the group, and subsequent messages in the group SHALL not repeat the avatar.

**Validates: Requirements 4.2**

### Property 7: Keyboard Navigation Accessibility

**For any** interactive element in the messaging interface, the element SHALL be reachable via Tab key navigation, and focus order SHALL follow the logical flow: fan list → chat input → context panel.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Unread Badge Visibility

**For any** conversation with unread messages (unreadCount > 0), an unread badge SHALL be visible in the FanList with the count displayed, and the badge color SHALL be #111111 (black) on #FFFFFF (white) background.

**Validates: Requirements 3.3**

### Property 9: Fan Context Data Completeness

**For any** selected conversation, if fan context data exists, THE ContextPanel SHALL display all available fields: name, avatar, status, join date, last active, total spent, subscription tier, notes, and tags.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 10: Message Virtualization Performance

**For any** conversation with more than 100 messages, the ChatContainer SHALL render only visible messages in the viewport, and scrolling performance SHALL maintain 60 FPS without jank.

**Validates: Requirements 9.2, 9.3**

### Property 11: Error Boundary Containment

**For any** error that occurs within the MessagingInterface component, the ContentPageErrorBoundary SHALL catch the error and display a user-friendly error message without crashing the entire application.

**Validates: Requirements 10.5**

### Property 12: Mobile Navigation State Consistency

**For any** mobile view (<768px), the mobile navigation buttons SHALL accurately reflect the current view state (fan list, chat, or context panel), and toggling between views SHALL update the grid layout accordingly.

**Validates: Requirements 8.1, 8.2, 8.3**

## Error Handling

### Message Send Failures

**Scenario:** User sends a message but the request fails.

**Handling:**
1. Message appears in UI with "sending" status (optimistic UI)
2. After timeout, status changes to "error"
3. Error message displayed below the message
4. Retry button provided to resend the message
5. Message remains in the input field if user wants to edit

### Network Disconnection

**Scenario:** Network connection is lost while messaging.

**Handling:**
1. Messages queued locally with "pending" status
2. Visual indicator shows "offline" state
3. When connection restored, queued messages sent automatically
4. Status updates to "sent" once confirmed by server

### Fan Context Load Failure

**Scenario:** Fan context data fails to load.

**Handling:**
1. ContextPanel displays loading error state
2. Retry button provided
3. User can still message without context data
4. Error doesn't block chat functionality

### Conversation List Load Failure

**Scenario:** Conversation list fails to load.

**Handling:**
1. FanList displays error state with retry button
2. User can still access chat if conversation ID in URL
3. Error message explains the issue
4. Retry button attempts to reload the list

## Testing Strategy

### Unit Tests

**FanList Component:**
- Renders conversation list correctly
- Search filters conversations by name
- Unread badges display correctly
- Online status indicators work
- Clicking conversation selects it
- Tags display properly

**ChatContainer Component:**
- Messages display in correct order
- Date separators appear between different days
- Message status indicators update correctly
- Typing indicator shows when fan is typing
- Send button sends message with correct content
- Attachment button triggers file picker

**ContextPanel Component:**
- Fan metadata displays correctly
- Notes section shows all notes
- Add note button opens form
- Tags display with remove buttons
- Status badge shows correct status

**MessagingInterface Component:**
- Three-column layout renders on desktop
- Two-column layout renders on tablet
- Single-column layout renders on mobile
- Conversation selection persists via URL
- Keyboard shortcuts work (Ctrl/Cmd+K, Escape)
- Mobile navigation toggles work

### Property-Based Tests

**Layout Responsiveness:**
- For any viewport size, the grid layout SHALL adapt correctly
- For any selected conversation, the layout SHALL maintain state during resize

**Message Grouping:**
- For any sequence of messages from the same sender, avatar repetition SHALL be avoided
- For any date boundary, a date separator SHALL appear

**Monochrome Palette:**
- For any rendered text, the color SHALL be from the monochrome palette
- For any text, contrast ratio SHALL meet WCAG AA standards

**Keyboard Navigation:**
- For any interactive element, Tab navigation SHALL reach it
- For any focused element, focus ring SHALL be visible

**Message Status:**
- For any sent message, status SHALL progress through the correct sequence
- For any message, status changes SHALL be reflected in the UI

### Integration Tests

**End-to-End Messaging Flow:**
1. User selects a conversation from the list
2. Chat messages load and display
3. Fan context loads in the right panel
4. User types a message and sends it
5. Message appears with "sending" status
6. Status updates to "sent" after confirmation
7. Message persists in the conversation

**Responsive Layout Flow:**
1. Desktop view shows three columns
2. Resize to tablet → two columns
3. Resize to mobile → single column with navigation
4. Resize back to desktop → three columns
5. Selected conversation persists throughout

**Error Recovery Flow:**
1. Message send fails
2. Error state displays with retry button
3. User clicks retry
4. Message sends successfully
5. Status updates to "sent"

## Accessibility Considerations

### WCAG 2.1 Level AA Compliance

**Color Contrast:**
- Primary text (#111111) on white (#FFFFFF): 21:1 ratio ✓
- Secondary text (#666666) on white (#FFFFFF): 7.5:1 ratio ✓
- Tertiary text (#999999) on white (#FFFFFF): 4.5:1 ratio ✓

**Keyboard Navigation:**
- All interactive elements reachable via Tab key
- Focus order follows logical flow
- Focus indicators visible (2px outline)
- Escape key clears selection on mobile

**Screen Reader Support:**
- ARIA labels on all major regions (main, complementary, navigation)
- Semantic HTML (buttons, inputs, lists)
- Live regions for typing indicators and status updates
- Alt text for avatars and icons

**Motion and Animation:**
- Respects `prefers-reduced-motion` media query
- Animations disabled for users with motion sensitivity
- Transitions set to 0.01ms when reduced motion is preferred

### Touch Target Sizing

- Minimum 44px × 44px for touch targets (WCAG 2.1 Level AAA)
- Icon buttons: 40px × 40px with 10px padding
- Conversation cards: 48px minimum height
- Message bubbles: Adequate padding for touch interaction

## Performance Optimization

### Rendering Optimization

**Virtualization:**
- FanList uses virtualization for 100+ conversations
- Only visible items rendered in the DOM
- Scroll performance maintained at 60 FPS

**Lazy Loading:**
- Messages loaded on-demand as user scrolls
- Older messages fetched when scrolling up
- New messages fetched when scrolling down

**Memoization:**
- Components memoized to prevent unnecessary re-renders
- Message list items memoized individually
- Conversation cards memoized

### Memory Management

**Event Listener Cleanup:**
- All event listeners removed on component unmount
- Timers cleared on unmount
- Subscriptions unsubscribed on unmount

**Message Cache:**
- Messages cached by conversation ID
- Cache cleared when switching conversations
- Old messages pruned to prevent memory bloat

### Network Optimization

**Message Batching:**
- Multiple messages batched into single request
- Debounced typing indicators
- Optimistic UI reduces perceived latency

**Caching Strategy:**
- Conversation list cached for 5 minutes
- Fan context cached for 10 minutes
- Messages cached indefinitely (until cleared)

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android 90+

## Future Enhancements

1. **Message Search:** Full-text search across all messages
2. **Message Reactions:** Emoji reactions to messages
3. **Message Editing:** Edit sent messages
4. **Message Deletion:** Delete messages with confirmation
5. **File Sharing:** Upload and share files in messages
6. **Voice Messages:** Record and send voice messages
7. **Video Calls:** Initiate video calls from chat
8. **Message Scheduling:** Schedule messages to send later
9. **Auto-Replies:** Set up automatic responses
10. **Message Templates:** Save and reuse message templates

