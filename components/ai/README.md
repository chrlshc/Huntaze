# AI Components

React components for integrating AI features into the Huntaze application.

## Components

### AIQuotaIndicator

Displays the current AI usage quota for the authenticated user.

```tsx
import { AIQuotaIndicator } from '@/components/ai';

function Dashboard() {
  return (
    <div>
      <AIQuotaIndicator />
    </div>
  );
}
```

**Features:**
- Real-time quota display
- Visual progress bar
- Warning indicators at 80% and 95%
- Plan-specific limits
- Auto-refresh capability

---

### AIChatAssistant

AI-powered assistant for generating responses to fan messages.

```tsx
import { AIChatAssistant } from '@/components/ai';

function MessagesPage() {
  const handleSendMessage = (message: string) => {
    // Send the AI-generated message
    console.log('Sending:', message);
  };

  return (
    <AIChatAssistant
      fanId="fan-123"
      fanName="John Doe"
      onSendMessage={handleSendMessage}
    />
  );
}
```

**Props:**
- `fanId` (required): The fan's unique identifier
- `fanName` (optional): The fan's display name
- `onSendMessage` (optional): Callback when user wants to use the generated response

**Features:**
- Context-aware response generation
- Confidence scoring
- Upsell suggestions
- Sales tactics identification
- Copy and regenerate options

---

### AICaptionGenerator

Generate optimized captions and hashtags for social media content.

```tsx
import { AICaptionGenerator } from '@/components/ai';

function ContentCreator() {
  return (
    <div>
      <AICaptionGenerator />
    </div>
  );
}
```

**Features:**
- Multi-platform support (Instagram, TikTok, Twitter, OnlyFans, Facebook)
- Platform-specific optimization
- Hashtag suggestions
- Performance insights
- Mood/tone customization
- Copy to clipboard

---

### AIAnalyticsDashboard

AI-powered performance analytics and insights.

```tsx
import { AIAnalyticsDashboard } from '@/components/ai';

function AnalyticsPage() {
  return (
    <div>
      <AIAnalyticsDashboard />
    </div>
  );
}
```

**Features:**
- Multiple timeframe options (24h, 7d, 30d, 90d)
- Key insights identification
- Pattern detection
- Actionable recommendations
- Performance predictions
- Confidence scoring
- Auto-refresh

---

## Hooks

### useAIChat

Hook for interacting with the AI Chat API.

```tsx
import { useAIChat } from '@/hooks/useAIChat';

function MyComponent() {
  const { generateResponse, loading, error, response } = useAIChat();

  const handleGenerate = async () => {
    const result = await generateResponse({
      fanId: 'fan-123',
      message: 'Hey! Love your content!',
      context: { fanName: 'John' },
    });
    
    if (result) {
      console.log('AI Response:', result.response);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      Generate Response
    </button>
  );
}
```

---

### useAICaption

Hook for generating captions.

```tsx
import { useAICaption } from '@/hooks/useAICaption';

function MyComponent() {
  const { generateCaption, loading, caption } = useAICaption();

  const handleGenerate = async () => {
    const result = await generateCaption({
      platform: 'instagram',
      contentInfo: {
        description: 'Beach sunset photo',
        mood: 'relaxed',
      },
    });
    
    if (result) {
      console.log('Caption:', result.caption);
      console.log('Hashtags:', result.hashtags);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      Generate Caption
    </button>
  );
}
```

---

### useAIQuota

Hook for monitoring AI quota status.

```tsx
import { useAIQuota } from '@/hooks/useAIQuota';

function MyComponent() {
  const { quota, loading, isNearLimit, refresh } = useAIQuota(true, 60000);

  if (loading) return <div>Loading quota...</div>;

  return (
    <div>
      <p>Used: ${quota?.spent.toFixed(2)} / ${quota?.limit.toFixed(2)}</p>
      {isNearLimit && <p>⚠️ Approaching quota limit!</p>}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

**Parameters:**
- `autoRefresh` (optional): Enable automatic refresh (default: false)
- `refreshInterval` (optional): Refresh interval in ms (default: 60000)

---

## Styling

Components use CSS classes for styling. Add your own styles or use the provided class names:

- `.ai-quota-indicator`
- `.ai-chat-assistant`
- `.ai-caption-generator`
- `.ai-analytics-dashboard`

Example CSS structure:

```css
.ai-quota-indicator {
  /* Container styles */
}

.ai-quota-indicator.warning {
  /* Warning state (80-95%) */
}

.ai-quota-indicator.critical {
  /* Critical state (95%+) */
}
```

---

## API Routes

The components interact with these API endpoints:

- `POST /api/ai/chat` - Generate chat responses
- `POST /api/ai/generate-caption` - Generate captions
- `POST /api/ai/analyze-performance` - Analyze performance
- `GET /api/ai/quota` - Get quota status

All routes require authentication via NextAuth.

---

## Requirements

- Next.js 14+
- React 18+
- NextAuth configured
- AI system backend integrated (see `.kiro/specs/ai-system-gemini-integration/`)

---

## Integration Example

Complete example of integrating AI components into a dashboard:

```tsx
import { 
  AIQuotaIndicator, 
  AIChatAssistant, 
  AIAnalyticsDashboard 
} from '@/components/ai';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header>
        <h1>Creator Dashboard</h1>
        <AIQuotaIndicator />
      </header>

      <div className="dashboard-grid">
        <section className="analytics">
          <AIAnalyticsDashboard />
        </section>

        <section className="chat-assistant">
          <AIChatAssistant
            fanId="current-fan-id"
            onSendMessage={(msg) => {
              // Handle sending message
            }}
          />
        </section>
      </div>
    </div>
  );
}
```

---

## Error Handling

All components handle errors gracefully and display user-friendly error messages. Errors are also logged to the console for debugging.

Common error scenarios:
- Rate limit exceeded (429)
- Quota exceeded (429)
- Authentication required (401)
- Network errors (500)

---

## Performance

- Components use React hooks for optimal performance
- API calls are debounced where appropriate
- Loading states prevent duplicate requests
- Auto-refresh can be disabled to reduce API calls

---

## Support

For issues or questions, refer to:
- `.kiro/specs/ai-system-gemini-integration/INTEGRATION_PROGRESS.md`
- `.kiro/specs/ai-system-gemini-integration/design.md`
- `.kiro/specs/ai-system-gemini-integration/requirements.md`
