# Requirements Document: OnlyFans Messages - 3-Column Layout

## Introduction

The OnlyFans Messages feature provides a professional, three-column messaging interface for content creators to manage conversations with their fans. The interface uses a monochrome (black/white/gray) design system for a calm, focused user experience that minimizes visual distractions during messaging workflows.

## Glossary

- **MessagingInterface**: The main component that orchestrates the three-column layout
- **FanList**: Left column component displaying conversations with fans
- **ChatContainer**: Center column component showing the active conversation messages
- **ContextPanel**: Right column component displaying fan context and metadata
- **Fan Context**: Information about a fan including notes, tags, subscription tier, and engagement metrics
- **Monochrome Palette**: Design system using black (#111111), white (#FFFFFF), and grays (#666666, #999999, #CCCCCC)
- **TailAdmin**: UI component library providing card, button, and input components
- **Responsive Layout**: Adaptive layout that changes from 3-column (desktop) to 2-column (tablet) to 1-column (mobile)

## Requirements

### Requirement 1: Three-Column Layout Structure

**User Story:** As a content creator, I want a three-column messaging interface, so that I can efficiently manage conversations while viewing fan context and notes.

#### Acceptance Criteria

1. WHEN the messaging page loads on desktop (>1024px), THE MessagingInterface SHALL display three columns: fan list (25%), chat (45-50%), and context panel (25-30%)
2. WHEN the viewport is tablet size (768-1024px), THE MessagingInterface SHALL display two columns with the ability to toggle between chat and context views
3. WHEN the viewport is mobile (<768px), THE MessagingInterface SHALL display a single column with navigation controls to switch between views
4. WHEN a conversation is selected, THE ChatContainer SHALL display in the center column with the selected fan's messages
5. WHEN no conversation is selected, THE ChatContainer SHALL display an empty state with guidance text

### Requirement 2: Monochrome Design System

**User Story:** As a designer, I want a monochrome color palette for the messaging interface, so that the interface is calm and focused without visual distractions.

#### Acceptance Criteria

1. WHEN the MessagingInterface renders, THE primary colors SHALL use monochrome palette: black (#111111), white (#FFFFFF), and grays (#666666, #999999, #CCCCCC)
2. WHEN text is displayed, THE primary text color SHALL be #111111 (black) on white backgrounds for WCAG AA contrast compliance
3. WHEN secondary text is displayed, THE secondary text color SHALL be #666666 (dark gray) for reduced emphasis
4. WHEN borders are displayed, THE border color SHALL be #CCCCCC (light gray) for subtle visual separation
5. WHEN hover states are applied, THE background color SHALL shift to #F5F5F5 (off-white) without changing the monochrome palette

### Requirement 3: Fan List Column

**User Story:** As a content creator, I want to see a list of conversations with fans, so that I can quickly navigate between different fan interactions.

#### Acceptance Criteria

1. WHEN the FanList renders, THE component SHALL display a scrollable list of fan conversations
2. WHEN a conversation is displayed, THE FanList SHALL show: fan avatar, name, last message preview, timestamp, and unread count
3. WHEN a conversation has unread messages, THE unread count badge SHALL be visible and styled with monochrome colors
4. WHEN a fan is online, THE online indicator SHALL be visible (green dot in monochrome context)
5. WHEN a conversation is selected, THE FanList SHALL highlight the active conversation with a subtle background color change
6. WHEN a fan has tags, THE tags SHALL be displayed below the fan name using monochrome styling

### Requirement 4: Chat Container Column

**User Story:** As a content creator, I want to view and send messages in a conversation, so that I can communicate with fans effectively.

#### Acceptance Criteria

1. WHEN the ChatContainer renders, THE component SHALL display messages grouped by date with date separators
2. WHEN messages are displayed, THE messages SHALL be grouped by sender with avatar repetition avoided within groups
3. WHEN a message is sent, THE message status SHALL progress through: sending → sent → delivered → read
4. WHEN the user types a message, THE input field SHALL be at the bottom of the container with send and attachment buttons
5. WHEN a message is received, THE ChatContainer SHALL scroll to the newest message automatically
6. WHEN the fan is typing, THE ChatContainer SHALL display a typing indicator below the last message
7. WHEN messages are displayed, THE timestamps SHALL be visible and styled in monochrome gray

### Requirement 5: Context Panel Column

**User Story:** As a content creator, I want to see fan context information while messaging, so that I can personalize my responses based on fan history and preferences.

#### Acceptance Criteria

1. WHEN the ContextPanel renders, THE component SHALL display fan metadata including: name, avatar, status, join date, last active, total spent, and subscription tier
2. WHEN fan notes exist, THE ContextPanel SHALL display a notes section with the ability to add new notes
3. WHEN fan tags exist, THE ContextPanel SHALL display tags with the ability to remove tags
4. WHEN the fan has a VIP status, THE status badge SHALL be displayed with appropriate styling
5. WHEN the ContextPanel is displayed on mobile, THE component SHALL be toggleable via the mobile navigation controls

### Requirement 6: Message Persistence and Optimistic UI

**User Story:** As a content creator, I want messages to be sent reliably with visual feedback, so that I know my messages are being delivered.

#### Acceptance Criteria

1. WHEN a message is sent, THE message SHALL appear immediately in the chat (optimistic UI) with a "sending" status
2. WHEN the message is successfully sent, THE status SHALL update to "sent" without removing the message from view
3. WHEN a message fails to send, THE message SHALL display an error state with a retry option
4. WHEN the user sends multiple messages rapidly, THE messages SHALL be queued and sent in order

### Requirement 7: Keyboard Navigation and Accessibility

**User Story:** As a content creator using keyboard navigation, I want to navigate the messaging interface efficiently, so that I can work without a mouse.

#### Acceptance Criteria

1. WHEN the user presses Ctrl/Cmd+K, THE search input in the FanList SHALL receive focus
2. WHEN the user presses Escape on mobile, THE selected conversation and context panel SHALL be cleared
3. WHEN the user navigates with Tab, THE focus order SHALL be logical: fan list → chat input → context panel
4. WHEN the interface renders, ALL interactive elements SHALL have visible focus indicators using monochrome styling
5. WHEN the user navigates, ARIA labels SHALL be present on all major regions (main, complementary, navigation)

### Requirement 8: Responsive Behavior and Mobile Optimization

**User Story:** As a content creator using mobile devices, I want the messaging interface to adapt to smaller screens, so that I can manage conversations on the go.

#### Acceptance Criteria

1. WHEN the viewport is mobile (<768px), THE three-column layout SHALL collapse to a single column
2. WHEN on mobile, THE FanList SHALL be the default view with a button to switch to chat
3. WHEN on mobile and a conversation is selected, THE ChatContainer SHALL be displayed with a back button to return to the fan list
4. WHEN on mobile, THE ContextPanel SHALL be accessible via a toggle button in the chat view
5. WHEN the viewport resizes, THE layout SHALL adapt smoothly without losing the selected conversation

### Requirement 9: Performance and Rendering

**User Story:** As a content creator with many conversations, I want the messaging interface to load and scroll smoothly, so that I can work efficiently without lag.

#### Acceptance Criteria

1. WHEN the MessagingInterface loads, THE component SHALL render within 2 seconds on a 4G connection
2. WHEN scrolling through messages, THE scroll performance SHALL maintain 60 FPS without jank
3. WHEN the FanList has many conversations (>100), THE component SHALL use virtualization to render only visible items
4. WHEN messages are loaded, THE ChatContainer SHALL lazy-load older messages as the user scrolls up
5. WHEN the component unmounts, ALL event listeners and timers SHALL be cleaned up to prevent memory leaks

### Requirement 10: Error Handling and Edge Cases

**User Story:** As a content creator, I want the messaging interface to handle errors gracefully, so that I can continue working even when issues occur.

#### Acceptance Criteria

1. WHEN a message fails to send, THE ChatContainer SHALL display an error message with a retry button
2. WHEN the fan context fails to load, THE ContextPanel SHALL display a loading error with a retry option
3. WHEN the conversation list fails to load, THE FanList SHALL display an error state with a retry button
4. WHEN the network connection is lost, THE interface SHALL queue messages and send them when the connection is restored
5. WHEN an unexpected error occurs, THE ContentPageErrorBoundary SHALL catch the error and display a user-friendly error message

### Requirement 11: Styling and Visual Consistency

**User Story:** As a designer, I want the messaging interface to use consistent styling throughout, so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. WHEN components render, THE styling SHALL use the monochrome palette defined in `styles/tailadmin-tokens.css`
2. WHEN components render, THE spacing SHALL follow the design system grid (8px base unit)
3. WHEN components render, THE typography SHALL use consistent font sizes and weights from the design system
4. WHEN components render, THE border radius SHALL be consistent across all components (4px or 8px)
5. WHEN components render, THE shadows SHALL be subtle and use monochrome colors (not colored shadows)

### Requirement 12: Integration with Fan Notes System

**User Story:** As a content creator, I want to add and view notes about fans while messaging, so that I can track important information about each fan.

#### Acceptance Criteria

1. WHEN the ContextPanel is displayed, THE notes section SHALL show all notes for the current fan
2. WHEN the user clicks "Add Note", THE interface SHALL open a modal or inline form to add a new note
3. WHEN a note is added, THE note SHALL be persisted to the backend and displayed immediately in the ContextPanel
4. WHEN a note is displayed, THE note SHALL show: content, creation date, author, and category (engagement, demandes, risques)
5. WHEN the user hovers over a note, THE note SHALL display options to edit or delete the note

