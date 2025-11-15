# Guide d'Intégration UI - AI Assistant

## 🎨 Comment c'est mis en UI

### Architecture en 3 couches

```
┌─────────────────────────────────────────┐
│  1. Composant React (AIMessageComposer) │
│     ↓ appelle                            │
│  2. Route API (/api/ai/suggestions)      │
│     ↓ utilise                            │
│  3. Service Backend (Enhanced Assistant) │
└─────────────────────────────────────────┘
```

## 📱 Composant UI Principal

**Fichier:** `components/onlyfans/AIMessageComposer.tsx`

```tsx
<AIMessageComposer
  fanId="fan_123"
  creatorId="creator_456"
  conversationContext={{
    lastMessage: "Hey! How are you?",
    messageCount: 42,
    fanValueCents: 15000
  }}
  onSelectSuggestion={(suggestion) => {
    setMessageText(suggestion.text);
  }}
/>
```

### Fonctionnalités visuelles :
- ✨ Suggestions personnalisées avec badges
- 🎯 Indicateurs d'émotion (positive/negative/neutral)
- 🔄 Bouton de rafraîchissement
- ⚡ États de chargement et erreur
- 🎨 Design Tailwind moderne

## 🔌 Route API

**Fichier:** `app/api/ai/suggestions/route.ts`

```typescript
POST /api/ai/suggestions
{
  "fanId": "fan_123",
  "creatorId": "creator_456",
  "lastMessage": "Hey!",
  "messageCount": 42,
  "fanValueCents": 15000
}

// Réponse
{
  "success": true,
  "suggestions": [
    {
      "text": "Hey Sarah! 😊",
      "category": "engaging",
      "confidence": 0.85,
      "memoryContext": {
        "personalityAdjusted": true,
        "emotionalContext": "positive"
      }
    }
  ]
}
```

## 🪝 Hook Personnalisé

**Fichier:** `hooks/useAISuggestions.ts`

```tsx
const { suggestions, loading, error, refresh } = useAISuggestions(
  'fan_123',
  'creator_456'
);
```

## 🎯 Exemple Complet

**Fichier:** `app/creator/messages/page.tsx`

```tsx
export default function MessagesPage() {
  const [messageText, setMessageText] = useState('');

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Conversation */}
      <div className="col-span-2">
        <textarea value={messageText} />
        <button>Envoyer</button>
      </div>

      {/* Suggestions AI */}
      <div className="col-span-1">
        <AIMessageComposer
          fanId="fan_123"
          creatorId="creator_456"
          onSelectSuggestion={(s) => setMessageText(s.text)}
        />
      </div>
    </div>
  );
}
```

## 🎨 Aperçu Visuel

```
┌──────────────────────────────────────────┐
│  �� Messages                             │
├──────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Conversation│  │ ✨ Suggestions   │  │
│  │             │  │                  │  │
│  │ Fan: Hey!   │  │ ┌──────────────┐ │  │
│  │             │  │ │ 💬 engaging  │ │  │
│  │ [Message]   │  │ │ Hey Sarah! 😊│ │  │
│  │ [Envoyer]   │  │ │ ✓ Personnalisé│ │  │
│  └─────────────┘  │ └──────────────┘ │  │
│                   │ [🔄 Actualiser]  │  │
│                   └──────────────────┘  │
└──────────────────────────────────────────┘
```

## 🚀 Démarrage Rapide

1. **Installer les dépendances**
```bash
npm install lucide-react
```

2. **Copier les fichiers**
- `components/onlyfans/AIMessageComposer.tsx`
- `app/api/ai/suggestions/route.ts`
- `hooks/useAISuggestions.ts`

3. **Utiliser**
```tsx
import { AIMessageComposer } from '@/components/onlyfans/AIMessageComposer';

<AIMessageComposer fanId={fanId} creatorId={creatorId} />
```

## 🎯 Fonctionnalités Clés

- 🎭 **Badges d'émotion** : Vert (positive), Rouge (negative)
- 🏷️ **Catégories** : promotional 💰, engaging 💬, flirty 😘
- ✨ **Personnalisation** : Badge si ajusté par l'IA
- 📊 **Confiance** : Pourcentage (ex: 85%)
- 🔄 **Rafraîchissement** : Recharger les suggestions
- ⚡ **États** : Loading, erreur, succès

## 📱 Responsive

- Mobile : Layout vertical
- Desktop : Sidebar
- Large : 3 colonnes

## ✅ Checklist

- [ ] Composant créé
- [ ] Route API configurée
- [ ] Hook disponible
- [ ] Page testée
- [ ] Styles Tailwind OK
- [ ] Icônes installées

Voilà ! Une UI moderne et performante pour l'AI Assistant 🚀
