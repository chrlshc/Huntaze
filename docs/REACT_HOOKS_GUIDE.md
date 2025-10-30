# React Hooks Guide - API Integration

## 📚 Vue d'ensemble

Hooks React optimisés pour Next.js 16 permettant de consommer facilement toutes les API routes backend.

## 🎯 Hooks Disponibles

### OnlyFans
- `useSubscribers` - Gestion des abonnés
- `useEarnings` - Suivi des revenus

### Marketing
- `useSegments` - Segments d'audience
- `useAutomations` - Règles d'automation

### Content
- `useContentLibrary` - Bibliothèque de médias
- `useAIGeneration` - Génération de contenu AI

### Analytics
- `useAnalytics` - Vue d'ensemble des analytics

### Chatbot
- `useConversations` - Gestion des conversations
- `useAutoReplies` - Système d'auto-réponse

### Management
- `useSettings` - Paramètres utilisateur
- `useProfile` - Profil utilisateur

## 💡 Exemples d'Utilisation

### 1. OnlyFans - Subscribers

```typescript
import { useSubscribers } from '@/hooks/api';

function SubscribersPage() {
  const { 
    subscribers, 
    metadata, 
    loading, 
    error, 
    refetch,
    addSubscriber 
  } = useSubscribers({
    page: 1,
    pageSize: 20,
    tier: 'premium',
    search: 'john'
  });

  const handleAddSubscriber = async () => {
    try {
      await addSubscriber({
        username: 'newuser',
        email: 'user@example.com',
        tier: 'premium'
      });
      // Success!
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {subscribers.map(sub => (
        <div key={sub.id}>{sub.username}</div>
      ))}
      <button onClick={handleAddSubscriber}>Add Subscriber</button>
    </div>
  );
}
```

### 2. Marketing - Segments

```typescript
import { useSegments } from '@/hooks/api';

function SegmentsPage() {
  const { segments, loading, error, createSegment } = useSegments();

  const handleCreateSegment = async () => {
    try {
      await createSegment({
        name: 'High Value Users',
        description: 'Users who spend over $100/month',
        criteria: {
          minSpending: 100,
          tier: 'premium'
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {segments.map(segment => (
        <div key={segment.id}>
          {segment.name} - {segment._count.subscribers} subscribers
        </div>
      ))}
    </div>
  );
}
```

### 3. Content - AI Generation

```typescript
import { useAIGeneration } from '@/hooks/api';
import { useState } from 'react';

function AIContentGenerator() {
  const { generateContent, loading, error } = useAIGeneration();
  const [generatedText, setGeneratedText] = useState('');

  const handleGenerate = async () => {
    try {
      const result = await generateContent({
        type: 'message',
        prompt: 'Flirty message for premium subscriber',
        tone: 'playful',
        length: 'short'
      });
      setGeneratedText(result.content);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Content'}
      </button>
      {generatedText && <p>{generatedText}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### 4. Analytics - Overview

```typescript
import { useAnalytics } from '@/hooks/api';
import { useState } from 'react';

function AnalyticsDashboard() {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
  const { analytics, loading, error } = useAnalytics(range);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!analytics) return null;

  return (
    <div>
      <select value={range} onChange={(e) => setRange(e.target.value as any)}>
        <option value="week">Week</option>
        <option value="month">Month</option>
        <option value="year">Year</option>
      </select>

      <div className="metrics">
        <div>
          Revenue: ${analytics.overview.revenue.current}
          <span className={analytics.overview.revenue.changeType}>
            {analytics.overview.revenue.change}%
          </span>
        </div>
        <div>
          Subscribers: {analytics.overview.subscribers.current}
          <span className={analytics.overview.subscribers.changeType}>
            {analytics.overview.subscribers.change}%
          </span>
        </div>
      </div>

      <div className="top-content">
        <h3>Top Performing Content</h3>
        {analytics.topContent.map(content => (
          <div key={content.id}>
            {content.title} - {content.engagement} engagements
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Chatbot - Conversations

```typescript
import { useConversations } from '@/hooks/api';

function ChatbotPage() {
  const { 
    conversations, 
    metadata, 
    loading, 
    error,
    createConversation 
  } = useConversations({
    page: 1,
    pageSize: 20,
    status: 'active'
  });

  const handleStartConversation = async (subscriberId: string) => {
    try {
      await createConversation({
        subscriberId,
        initialMessage: 'Hey! Thanks for subscribing! 💕'
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id}>
          {conv.subscriber.username} - {conv._count.messages} messages
        </div>
      ))}
    </div>
  );
}
```

### 6. Management - Settings

```typescript
import { useSettings } from '@/hooks/api';

function SettingsPage() {
  const { settings, loading, error, updating, updateSettings } = useSettings();

  const handleToggleNotification = async (key: string) => {
    if (!settings) return;

    try {
      await updateSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key as keyof typeof settings.notifications]
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!settings) return null;

  return (
    <div>
      <h2>Notifications</h2>
      <label>
        <input
          type="checkbox"
          checked={settings.notifications.email}
          onChange={() => handleToggleNotification('email')}
          disabled={updating}
        />
        Email Notifications
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.notifications.newSubscriber}
          onChange={() => handleToggleNotification('newSubscriber')}
          disabled={updating}
        />
        New Subscriber Alerts
      </label>
    </div>
  );
}
```

## 🔥 Fonctionnalités des Hooks

### Auto-Refresh
Tous les hooks se rafraîchissent automatiquement quand leurs paramètres changent :

```typescript
const [page, setPage] = useState(1);
const { subscribers } = useSubscribers({ page });

// Change page -> auto-refresh
setPage(2);
```

### Manual Refresh
Tous les hooks exposent une fonction `refetch` :

```typescript
const { subscribers, refetch } = useSubscribers();

// Manual refresh
await refetch();
```

### Loading States
Tous les hooks gèrent les états de chargement :

```typescript
const { data, loading, error } = useSubscribers();

if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <Data items={data} />;
```

### Optimistic Updates
Les mutations mettent à jour automatiquement les données :

```typescript
const { subscribers, addSubscriber } = useSubscribers();

// Add subscriber -> auto-refresh list
await addSubscriber({ username: 'new', email: 'new@example.com' });
```

## 🎨 TypeScript Support

Tous les hooks sont entièrement typés :

```typescript
import { useSubscribers } from '@/hooks/api';

// TypeScript knows all types
const { 
  subscribers, // Subscriber[]
  metadata,    // PaginationMetadata
  loading,     // boolean
  error,       // string | null
  addSubscriber // (data: CreateSubscriberInput) => Promise<Subscriber>
} = useSubscribers();
```

## ⚡ Performance Tips

### 1. Pagination
Utilisez la pagination pour les grandes listes :

```typescript
const { subscribers, metadata } = useSubscribers({
  page: currentPage,
  pageSize: 20
});
```

### 2. Debounce Search
Debounce les recherches pour éviter trop de requêtes :

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 500);

const { subscribers } = useSubscribers({ search: debouncedSearch });
```

### 3. Conditional Fetching
Désactivez le fetch si les données ne sont pas nécessaires :

```typescript
const { subscribers, loading } = useSubscribers({
  page: isOpen ? currentPage : undefined
});
```

## 🚀 Best Practices

### 1. Error Handling
Toujours gérer les erreurs :

```typescript
const { error } = useSubscribers();

useEffect(() => {
  if (error) {
    toast.error(error);
  }
}, [error]);
```

### 2. Loading States
Afficher des skeletons pendant le chargement :

```typescript
if (loading) return <SubscribersSkeleton />;
```

### 3. Empty States
Gérer les états vides :

```typescript
if (!loading && subscribers.length === 0) {
  return <EmptyState message="No subscribers yet" />;
}
```

## 📦 Installation

Les hooks sont déjà disponibles dans le projet :

```typescript
import { 
  useSubscribers,
  useEarnings,
  useSegments,
  useAutomations,
  useContentLibrary,
  useAIGeneration,
  useAnalytics,
  useConversations,
  useAutoReplies,
  useSettings,
  useProfile
} from '@/hooks/api';
```

---

**Date**: 2025-01-30
**Next.js Version**: 16.0.1
**Status**: ✅ Prêt pour utilisation
