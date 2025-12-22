# Intégration du Système de Notes avec l'IA

## Vue d'ensemble

Le système de notes des fans permet à l'IA de **mémoriser** et **utiliser** des informations importantes sur chaque fan pour personnaliser les réponses.

## Architecture

```
┌─────────────────┐
│  Fan Message    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  1. Analyse automatique         │
│     - Détection de patterns     │
│     - Extraction d'infos        │
│     - Score de confiance        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  2. Stockage en base (AWS RDS)  │
│     - Table: fan_notes          │
│     - Source: 'ai' ou 'manual'  │
│     - Catégories: 6 types       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  3. Enrichissement du contexte  │
│     - Chargement des notes      │
│     - Génération du prompt      │
│     - Ajout au contexte IA      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  4. Génération de réponse IA    │
│     - Utilise les notes         │
│     - Personnalise la réponse   │
│     - Fait référence aux infos  │
└─────────────────────────────────┘
```

## Catégories de notes

| Catégorie | Description | Exemples |
|-----------|-------------|----------|
| `important` ⭐ | Infos critiques à retenir | "Ne jamais mentionner son ex", "Allergique aux chats" |
| `preferences` ❤️ | Ce que le fan aime | "Aime les photos en lingerie rouge", "Préfère les vidéos courtes" |
| `interests` 🎯 | Centres d'intérêt | "Fan de fitness", "Aime le gaming" |
| `personal` 👤 | Infos personnelles | "Anniversaire le 15 mars", "Travaille comme ingénieur" |
| `purchase_behavior` 💰 | Comportement d'achat | "Achète surtout le weekend", "Budget ~50$/mois" |
| `communication_style` 💬 | Style préféré | "Préfère les messages courts", "Aime les emojis" |

## Détection automatique

### Patterns détectés

```typescript
// Intérêts
"J'adore le fitness" → Note: "Fitness" (interests)
"Je suis fan de gaming" → Note: "Gaming" (interests)

// Préférences
"J'aime tes photos en extérieur" → Note: "Photos en extérieur" (preferences)
"J'adore quand tu portes du rouge" → Note: "Quand tu portes du rouge" (preferences)

// Personnel
"Mon anniversaire est le 15 mars" → Note: "Anniversaire le 15 mars" (personal)
"Je travaille comme ingénieur" → Note: "Travaille comme ingénieur" (personal)
```

### Seuil de confiance

- **0.8+** : ✅ Ajouté automatiquement (très fiable)
- **0.6-0.8** : 💡 Suggéré à l'utilisateur (à valider)
- **< 0.6** : ❌ Ignoré (pas assez fiable)

### Filtres de qualité

Pour éviter les "notes de con", le système applique plusieurs filtres :

1. **Longueur** : 3-100 caractères
2. **Blacklist** : Ignore les salutations, mots vagues, compliments génériques
3. **Mots significatifs** : Au moins 1 mot de plus de 2 lettres
4. **Patterns invalides** : Pas de caractères bizarres, pas que des articles
5. **Bonus/Malus** : Ajuste la confiance selon la qualité du contenu

Exemples de notes **rejetées** :
- ❌ "Salut" (blacklist)
- ❌ "Ça" (trop vague)
- ❌ "Belle" (compliment générique)
- ❌ "Ok" (trop court)

Exemples de notes **acceptées** :
- ✅ "Fitness et musculation" (mots de qualité)
- ✅ "Anniversaire le 15 mars" (info vérifiable)
- ✅ "Photos en extérieur avec paysages" (spécifique)

## Utilisation dans l'IA

### 1. Charger le contexte du fan

```typescript
import { enrichFanContext } from '@/lib/fans/fan-context-enricher';

const fanContext = await enrichFanContext(creatorId, fanId);

console.log(fanContext.summary);
// Output:
// Fan: alice_m
// Status: vip
// Total dépensé: $2,450.00
//
// ⭐ NOTES IMPORTANTES:
// - Ne jamais mentionner son ex
//
// ❤️ CE QUE CE FAN AIME:
// - Photos en extérieur
// - Lingerie rouge
//
// 🎯 CENTRES D'INTÉRÊT:
// - Fitness
// - Yoga
```

### 2. Enrichir le prompt système

```typescript
import { generateEnrichedSystemPrompt } from '@/lib/fans/fan-context-enricher';

const basePrompt = `Tu es un assistant IA pour une créatrice OnlyFans...`;

const enrichedPrompt = generateEnrichedSystemPrompt(basePrompt, fanContext);

// Le prompt enrichi inclut automatiquement toutes les notes
```

### 3. Générer une réponse personnalisée

```typescript
import { generateResponseWithNotes } from '@/lib/ai/agents/messaging-with-notes.example';

const response = await generateResponseWithNotes(
  creatorId,
  fanId,
  "Hey! Tu vas bien ?",
  {
    creatorStyle: 'friendly and flirty',
  }
);

// L'IA va utiliser les notes pour personnaliser la réponse
// Ex: "Hey! Oui super, j'ai fait une séance de yoga ce matin 🧘‍♀️"
//     (fait référence à l'intérêt "Yoga" du fan)
```

## API Routes

### Récupérer les notes d'un fan

```bash
GET /api/fans/{fanId}/notes
GET /api/fans/{fanId}/notes?category=preferences
```

### Ajouter une note manuellement

```bash
POST /api/fans/{fanId}/notes
{
  "category": "preferences",
  "content": "Aime les photos en extérieur",
  "source": "manual"
}
```

### Analyser un message pour détecter des notes

```bash
POST /api/ai/messages/analyze-notes
{
  "fanId": "fan_123",
  "message": "J'adore le fitness et le yoga",
  "autoAdd": true  // Ajouter automatiquement ou juste suggérer
}
```

### Récupérer le contexte complet pour l'IA

```bash
GET /api/fans/{fanId}/context
```

Response:
```json
{
  "profile": {
    "fanId": "fan_123",
    "status": "vip",
    "totalSpent": 2450,
    "messageCount": 156
  },
  "notes": {
    "preferences": [...],
    "interests": [...],
    "personal": [...],
    ...
  },
  "summary": "Fan: alice_m\nStatus: vip\n..."
}
```

## Workflow complet

### Scénario : Fan envoie un message

1. **Message reçu** : "Hey! J'adore tes photos en extérieur, tu en feras d'autres ?"

2. **Détection automatique** (en arrière-plan)
   - Pattern détecté : "J'adore tes photos en extérieur"
   - Note créée : "Photos en extérieur" (preferences, confidence: 0.8)
   - Stockée en base avec `source='ai'`

3. **Chargement du contexte**
   - Récupération de toutes les notes du fan
   - Génération du résumé textuel
   - Enrichissement du prompt système

4. **Génération de la réponse**
   - L'IA voit dans le prompt : "❤️ CE QUE CE FAN AIME: Photos en extérieur"
   - Génère une réponse personnalisée : "Oui! J'ai prévu une séance photo en forêt ce weekend 🌲📸"

5. **Affichage dans l'UI**
   - La créatrice voit la note dans le panneau de droite
   - Badge 🤖 indique que c'est détecté par l'IA
   - Elle peut la modifier ou la supprimer si besoin

## Migration de la base de données

```bash
# Créer les tables fan_notes et fan_profiles
npx prisma migrate dev --name add_fan_notes

# Générer le client Prisma
npx prisma generate
```

## Configuration

Aucune configuration supplémentaire nécessaire ! Le système utilise :
- ✅ AWS RDS PostgreSQL (déjà configuré)
- ✅ Prisma (déjà configuré)
- ✅ Azure OpenAI (déjà configuré)

## Sécurité & GDPR

### Suppression des données

```typescript
// Supprimer toutes les notes d'un fan (GDPR)
await fanNotesService.deleteAllNotesForFan(creatorId, fanId);
```

### Permissions

- Les notes sont **privées** par créateur
- Un créateur ne peut voir que les notes de ses propres fans
- Les notes sont chiffrées en transit (HTTPS)
- Les notes sont stockées sur AWS RDS avec encryption at rest

## Métriques & Monitoring

Le système log automatiquement :
- Nombre de notes détectées par l'IA
- Taux de confiance moyen
- Notes ajoutées vs suggérées
- Utilisation des notes dans les réponses IA

## Prochaines améliorations

1. **Analyse IA avancée** : Utiliser GPT-4 pour extraire des insights plus complexes
2. **Suggestions proactives** : "Ce fan semble intéressé par X, tu devrais lui proposer Y"
3. **Résumé automatique** : Générer un résumé IA du profil complet du fan
4. **Détection de sentiment** : Analyser l'humeur du fan dans ses messages
5. **Alertes** : Notifier si un fan VIP n'a pas reçu de message depuis X jours

## Support

Pour toute question : charles@huntaze.com
