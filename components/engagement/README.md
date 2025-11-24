# Engagement Components

This directory contains components designed to increase user engagement with the application.

## ChangelogWidget

The ChangelogWidget displays a "What's New" sidebar that shows recent product updates and features. It uses cookie-based tracking to show a pulsing badge when new updates are available.

### Features

- **Cookie-Based Read State**: Tracks when the user last viewed the changelog using browser cookies
- **Pulsing Badge**: Displays a visual indicator when new updates are available
- **Sidebar Panel**: Opens a slide-out panel from the right side of the screen
- **Graceful Error Handling**: Continues to function even if the changelog API is unavailable
- **Accessibility**: Fully accessible with proper ARIA labels and keyboard navigation

### Usage

```tsx
import { ChangelogWidget } from '@/components/engagement/ChangelogWidget';

export function Sidebar() {
  return (
    <nav>
      {/* Other navigation items */}
      <ChangelogWidget />
    </nav>
  );
}
```

### Requirements Satisfied

This component satisfies the following requirements from the mobile-ux-marketing-refactor spec:

- **Requirement 7.1**: Checks `lastViewedChangelog` cookie against latest release date from the API
- **Requirement 7.2**: Displays a pulsing badge when new updates are available
- **Requirement 7.3**: Updates the cookie when the user opens the widget
- **Requirement 7.4**: Displays as a sidebar component accessible from navigation
- **Requirement 7.5**: Handles CMS/API unavailability gracefully with fallback behavior

### Cookie Management

The component uses a simple cookie utility that:

- Stores the last viewed timestamp in ISO 8601 format
- Sets a 1-year expiration on the cookie
- Uses `SameSite=Lax` for security
- Handles invalid or missing cookies gracefully

Cookie name: `lastViewedChangelog`

### API Integration

The component fetches changelog data from `/api/changelog` which returns:

```typescript
interface ChangelogResponse {
  entries: ChangelogEntry[];
  latestReleaseDate: string; // ISO 8601 date
}

interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  releaseDate: string; // ISO 8601 date
  features: string[];
}
```

### Styling

The component uses Tailwind CSS classes and follows the Linear-inspired design system:

- Dark background with subtle borders
- Primary color accent for the badge and entry borders
- Smooth transitions and animations
- Responsive design (full width on mobile, max-width on desktop)

### Testing

Comprehensive test coverage (33 tests) includes:

- Cookie checking and comparison logic
- Badge visibility based on cookie state
- Cookie updates when widget opens
- Sidebar display and interaction
- Error handling and graceful degradation
- Accessibility features

Run tests:
```bash
npm run test -- tests/unit/components/changelog-widget.test.tsx --run
```

### Future Enhancements

Potential improvements for future iterations:

1. **Animation**: Add slide-in animation for the sidebar panel
2. **Keyboard Shortcuts**: Add keyboard shortcut to open/close (e.g., `Cmd+K`)
3. **Unread Count**: Show number of unread entries instead of just a badge
4. **Categories**: Group changelog entries by category (Features, Fixes, etc.)
5. **Search**: Add search functionality for older entries
6. **Notifications**: Integrate with a notification system for real-time updates

### Browser Compatibility

The component uses standard browser APIs and is compatible with:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

Note: The cookie API (`document.cookie`) is supported in all modern browsers.
