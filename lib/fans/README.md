# Système de Notes des Fans

Système intelligent de mémorisation des préférences et informations des fans pour personnaliser les réponses IA.

## 🎯 Objectif

Permettre à l'IA de **retenir** et **utiliser** des informations importantes sur chaque fan pour générer des réponses ultra-personnalisées.

## 📊 Base de données

- **AWS RDS PostgreSQL** (production)
- Tables : `fan_notes` + `fan_profiles`
- Voir : `.env.production` pour la config

## 🚀 Migration

```bash
# Production (AWS RDS)
./scripts/migrate-fan-notes.sh production

# Local (dev)
./scripts/migrate-fan-notes.sh local
```

## 📝 Catégories de notes

| Catégorie | Icône | Exemples |
|-----------|-------|----------|
| `important` | ⭐ | "Ne jamais mentionner son ex" |
| `preferences` | ❤️ | "Aime les photos en lingerie rouge" |
| `interests` | 🎯 | "Fan de fitness et yoga" |
| `personal` | 👤 | "Anniversaire le 15 mars" |
| `purchase_behavior` | 💰 | "Achète surtout le weekend" |
| `communication_style` | 💬 | "Préfère les messages courts" |

## 🤖 Détection automatique

### Seuils de confiance

- **≥ 0.8** : Ajouté automatiquement (très fiable)
- **0.6-0.8** : Suggéré à l'utilisateur
- **< 0.6** : Ignoré

### Filtres anti-spam

✅ **Accepté** :
- "Je fais du fitness régulièrement"
- "Mon anniversaire est le 15 mars"
- "J'adore tes photos en extérieur"

❌ **Rejeté** :
- "Salut" (blacklist)
- "Ça" (trop vague)
- "Belle" (générique)
- "Ok" (trop court)

## 💻 Utilisation

### 1. Ajouter une note manuellement

```typescript
import { fanNotesService } from '@/lib/fans';

await fanNotesService.createNote({
  creatorId: 1,
  fanId: 'fan_123',
  category: 'preferences',
  content: 'Aime les photos en extérieur',
  source: 'manual',
});
```

### 2. Charger le contexte pour l'IA

```typescript
import { enrichFanContext } from '@/lib/fans';

const context = await enrichFanContext(creatorId, fanId);

console.log(context.summary);
// Output:
// Fan: alice_m
// Status: vip
// 
// ⭐ NOTES IMPORTANTES:
// - Ne jamais mentionner son ex
//
// ❤️ CE QUE CE FAN AIME:
// - Photos en extérieur
```

### 3. Générer une réponse personnalisée

```typescript
import { generateResponseWithNotes } from '@/lib/ai/agents/messaging-with-notes.example';

const response = await generateResponseWithNotes(
  creatorId,
  fanId,
  "Hey! Tu vas bien ?",
  { creatorStyle: 'friendly and flirty' }
);

// L'IA utilise automatiquement les notes pour personnaliser
```

## 🔧 Configuration

Voir `lib/fans/config.ts` pour ajuster :
- Seuils de confiance
- Blacklist de mots
- Limites (max notes par fan, etc.)

## 📚 Documentation complète

Voir `docs/FAN-NOTES-AI-INTEGRATION.md`

## 🔒 Sécurité & GDPR

```typescript
// Supprimer toutes les notes d'un fan
await fanNotesService.deleteAllNotesForFan(creatorId, fanId);
```

## 🎨 UI

Le panneau de notes est intégré dans la 3ème colonne de la page messages :
- `components/messages/FanNotesPanel.tsx`
- Badge 🤖 pour les notes détectées par l'IA
- Possibilité de modifier/supprimer

## 📊 API Routes

- `GET /api/fans/{fanId}/notes` - Liste des notes
- `POST /api/fans/{fanId}/notes` - Ajouter une note
- `PATCH /api/fans/{fanId}/notes/{noteId}` - Modifier
- `DELETE /api/fans/{fanId}/notes/{noteId}` - Supprimer
- `GET /api/fans/{fanId}/context` - Contexte complet pour l'IA
