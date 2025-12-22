# Système de Notes des Fans - Guide Complet

## 🎯 Vue d'ensemble

Système intelligent de mémorisation qui permet à l'IA de retenir et utiliser des informations sur chaque fan pour maximiser les ventes et la connexion émotionnelle.

## 📊 Architecture

```
Fan Message → Détection Auto → Stockage AWS RDS → Enrichissement IA → Réponse Personnalisée
```

## 📝 Catégories de Notes

| Catégorie | Icône | Description | Exemples |
|-----------|-------|-------------|----------|
| `important` | ⭐ | Infos critiques | "Ne jamais mentionner son ex", "Allergique aux chats" |
| `preferences` | ❤️ | Ce qu'il aime | "Photos en lingerie rouge", "Vidéos courtes" |
| `interests` | 🎯 | Hobbies | "Fitness", "Gaming", "Yoga" |
| `personal` | 👤 | Infos perso | "Anniversaire 15 mars", "Ingénieur" |
| `purchase_behavior` | 💰 | Achats | "Achète le weekend", "Budget ~50$/mois" |
| `communication_style` | 💬 | Style préféré | "Messages courts", "Aime les emojis" |
| `emotional_state` | 😊 | État émotionnel | "Seul", "Stressé", "Excité" |

## 🤖 Détection Automatique

### Seuils de Confiance

- **≥ 0.8** : ✅ Ajouté automatiquement
- **0.6-0.8** : 💡 Suggéré à l'utilisateur  
- **< 0.6** : ❌ Ignoré

### Filtres Anti-Spam

**✅ Accepté** :
- "Je fais du fitness régulièrement" → `interests`
- "Mon anniversaire est le 15 mars" → `personal`
- "J'adore tes photos en extérieur" → `preferences`
- "Je me sens seul ce soir" → `emotional_state`

**❌ Rejeté** :
- "Salut" (blacklist)
- "Ça" (trop vague)
- "Belle" (générique)
- "Ok" (trop court)

## 💡 Stratégies IA Intégrées

### 1. Message Pacing
- Rythme naturel adapté au fan
- Éviter spam et longs silences
- Varier le timing pour paraître humain

### 2. Emotional Mirroring
- Refléter le ton du fan
- Excité → matcher l'énergie
- Fatigué → chaleur et compréhension

### 3. Personnalisation
- Utiliser les notes pour référencer le passé
- "Je me souviens que tu adorais..."
- Faire sentir le fan unique et vu

### 4. Urgence & FOMO
- Offres limitées basées sur `purchase_behavior`
- "Seulement pour les 12 prochaines heures"
- "3 places restantes"

### 5. Upselling Intelligent
- Réchauffer AVANT l'offre
- Construire l'anticipation
- Personnaliser selon `preferences`

### 6. Aftercare Émotionnel
- Après achat, message doux
- Réduit buyer's remorse
- Maintient le lien émotionnel

## 🔄 Workflow Complet

### Scénario : Fan envoie "J'adore le fitness et le yoga"

1. **Détection** : Pattern "j'adore" + mots de qualité
2. **Extraction** : 
   - Note 1: "Fitness" (interests, confidence: 0.85)
   - Note 2: "Yoga" (interests, confidence: 0.85)
3. **Stockage** : AWS RDS avec `source='ai'`
4. **Enrichissement** : Ajouté au contexte IA
5. **Utilisation** : 
   - Réponse : "Moi aussi j'adore le yoga ! J'ai fait une séance ce matin 🧘‍♀️"
   - Upsell futur : "J'ai filmé ma routine de yoga en tenue sexy... intéressé ?"

## 📱 Interface Utilisateur

### Panneau de Notes (3ème colonne)

```
┌─────────────────────────────┐
│ 👤 Alice Martin             │
│ @alice_m                    │
│ Status: VIP                 │
├─────────────────────────────┤
│ Stats:                      │
│ $2,450 | 156 messages       │
├─────────────────────────────┤
│ NOTES (8)        [+ Ajouter]│
│                             │
│ ⭐ IMPORTANT                │
│ • Ne jamais mentionner ex   │
│                             │
│ ❤️ PRÉFÉRENCES              │
│ • Photos en extérieur       │
│ • Lingerie rouge       🤖   │
│                             │
│ 🎯 INTÉRÊTS                 │
│ • Fitness              🤖   │
│ • Yoga                 🤖   │
│                             │
│ 👤 PERSONNEL                │
│ • Anniversaire 15 mars      │
│                             │
│ 💰 ACHATS                   │
│ • Achète le weekend    🤖   │
└─────────────────────────────┘
```

Badge 🤖 = Détecté par l'IA

## 🔧 Configuration

### Ajuster les Seuils

Fichier : `lib/fans/config.ts`

```typescript
export const FAN_NOTES_CONFIG = {
  AUTO_ADD_THRESHOLD: 0.8,  // Très élevé
  SUGGEST_THRESHOLD: 0.6,   // Suggéré
  MIN_NOTE_LENGTH: 3,
  MAX_NOTE_LENGTH: 100,
  MAX_NOTES_PER_FAN: 50,
  MAX_AUTO_NOTES_PER_DAY: 5,
};
```

### Blacklist Personnalisée

```typescript
BLACKLIST_WORDS: [
  'salut', 'hello', 'hey',
  'ça', 'cela', 'that',
  'belle', 'sexy', 'hot',
  // Ajouter vos mots ici
],
```

## 💻 Utilisation Développeur

### Charger le Contexte

```typescript
import { enrichFanContext } from '@/lib/fans';

const context = await enrichFanContext(creatorId, fanId);

// Utiliser dans le prompt IA
const enrichedPrompt = generateEnrichedSystemPrompt(
  basePrompt,
  context
);
```

### Ajouter une Note Manuellement

```typescript
import { fanNotesService } from '@/lib/fans';

await fanNotesService.createNote({
  creatorId: 1,
  fanId: 'fan_123',
  category: 'important',
  content: 'Ne jamais mentionner son ex',
  source: 'manual',
});
```

### Analyser un Message

```typescript
import { analyzeAndAddNotes } from '@/lib/fans/auto-note-detector';

const result = await analyzeAndAddNotes(
  creatorId,
  fanId,
  fanUsername,
  message,
  { minConfidence: 0.8, autoAdd: true }
);

console.log(`${result.notesAdded} notes ajoutées`);
```

## 🚀 Migration Production

```bash
# 1. Migrer la base AWS RDS
./scripts/migrate-fan-notes.sh production

# 2. Générer le client Prisma
npx prisma generate

# 3. Redémarrer l'app
pm2 restart huntaze
```

## 📊 API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/fans/{fanId}/notes` | GET | Liste des notes |
| `/api/fans/{fanId}/notes` | POST | Ajouter une note |
| `/api/fans/{fanId}/notes/{noteId}` | PATCH | Modifier |
| `/api/fans/{fanId}/notes/{noteId}` | DELETE | Supprimer |
| `/api/fans/{fanId}/context` | GET | Contexte complet IA |
| `/api/ai/messages/analyze-notes` | POST | Analyser message |

## 🔒 Sécurité & GDPR

### Suppression des Données

```typescript
// Supprimer toutes les notes d'un fan
await fanNotesService.deleteAllNotesForFan(creatorId, fanId);
```

### Permissions

- Notes privées par créateur
- Chiffrement en transit (HTTPS)
- Encryption at rest (AWS RDS)
- Logs d'audit pour conformité

## 📈 Métriques de Succès

- **Taux de conversion** : Messages → Ventes
- **Valeur moyenne par fan** : Revenue / Fan
- **Taux de rétention** : Fans actifs / Total
- **Personnalisation** : % messages avec notes utilisées
- **Satisfaction** : Feedback positif des fans

## 🎓 Ressources

- [Guide Stratégies IA](./ONLYFANS-AI-CHATTING-STRATEGIES.md)
- [Intégration Technique](./FAN-NOTES-AI-INTEGRATION.md)
- [README Développeur](../lib/fans/README.md)

## ⚖️ Éthique

- ✅ Transparence sur l'utilisation d'IA
- ✅ Respect des limites des fans
- ✅ Protection des données personnelles
- ✅ Pas d'exploitation de vulnérabilités
- ✅ Conformité plateforme OnlyFans

---

**Objectif** : Créer une expérience mutuellement bénéfique où les fans se sentent valorisés et heureux de leur investissement, tout en maximisant les revenus de manière éthique.
