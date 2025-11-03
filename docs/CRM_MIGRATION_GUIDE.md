# CRM Migration Guide: In-Memory → PostgreSQL

## ✅ Migration Completed

Les tables CRM ont été créées dans PostgreSQL. Voici comment migrer le code.

## 📊 Tables Créées

```sql
✅ user_profiles      - Profils utilisateurs étendus
✅ ai_configs         - Configurations AI par utilisateur
✅ fans               - Fans/subscribers
✅ conversations      - Conversations avec fans
✅ messages           - Messages individuels
✅ campaigns          - Campagnes marketing
✅ platform_connections - Connexions OAuth
✅ quick_replies      - Templates de réponses rapides
✅ analytics_events   - Events analytics
```

## 🔄 Migration du Code

### Avant (In-Memory)

```typescript
// lib/services/crmData.ts
import { crmData } from '@/lib/services/crmData';

// Dans une API route
const fans = crmData.listFans(userId);
const fan = crmData.createFan(userId, data);
```

### Après (PostgreSQL)

```typescript
// lib/db/repositories/fansRepository.ts
import { FansRepository } from '@/lib/db/repositories';

// Dans une API route
const fans = await FansRepository.listFans(userId);
const fan = await FansRepository.createFan(userId, data);
```

## 📝 Étapes de Migration

### 1. Créer les Repositories Manquants

Créer les fichiers suivants dans `lib/db/repositories/`:

- `conversationsRepository.ts`
- `messagesRepository.ts`
- `campaignsRepository.ts`
- `userProfilesRepository.ts`
- `aiConfigsRepository.ts`
- `platformConnectionsRepository.ts`
- `quickRepliesRepository.ts`

Utiliser `fansRepository.ts` comme template.

### 2. Mettre à Jour les API Routes

#### Exemple: `/api/crm/fans/route.ts`

**Avant:**
```typescript
import { crmData } from '@/lib/services/crmData';

export async function GET(request: NextRequest) {
  const fans = crmData.listFans(userId);
  return NextResponse.json({ fans });
}
```

**Après:**
```typescript
import { FansRepository } from '@/lib/db/repositories';

export async function GET(request: NextRequest) {
  const fans = await FansRepository.listFans(userId);
  return NextResponse.json({ fans });
}
```

### 3. Mettre à Jour les Types

Les types sont déjà définis dans `lib/services/crmData.ts`. Ils sont compatibles avec les nouvelles tables.

### 4. Tester

```bash
# Tester les nouvelles APIs
npm run test

# Tester manuellement
curl http://localhost:3000/api/crm/fans
```

## 🎯 APIs à Migrer

### Priorité HAUTE (Core CRM)

- [ ] `/api/crm/fans` → FansRepository
- [ ] `/api/crm/conversations` → ConversationsRepository
- [ ] `/api/crm/conversations/[id]/messages` → MessagesRepository
- [ ] `/api/messages/[id]/read` → MessagesRepository
- [ ] `/api/messages/reply` → MessagesRepository

### Priorité MOYENNE

- [ ] `/api/users/profile` → UserProfilesRepository
- [ ] `/api/ai/config` → AIConfigsRepository
- [ ] `/api/ai/quick-replies` → QuickRepliesRepository
- [ ] `/api/platforms/status` → PlatformConnectionsRepository

### Priorité BASSE

- [ ] `/api/of/campaigns` → CampaignsRepository
- [ ] `/api/analytics/*` → AnalyticsEventsRepository

## 🔧 Utilitaires

### Script de Migration

```bash
# Créer les tables
npm run db:migrate:crm

# Vérifier les tables
psql $DATABASE_URL -c "\dt"
```

### Rollback (si nécessaire)

```sql
-- Supprimer toutes les tables CRM
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS quick_replies CASCADE;
DROP TABLE IF EXISTS platform_connections CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS fans CASCADE;
DROP TABLE IF EXISTS ai_configs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
```

## 📊 Avantages de la Migration

✅ **Persistance** - Données conservées au redémarrage  
✅ **Performance** - Indexes optimisés  
✅ **Scalabilité** - PostgreSQL peut gérer des millions de rows  
✅ **Transactions** - ACID compliance  
✅ **Backup** - AWS RDS automated backups  
✅ **Queries complexes** - JOINs, aggregations, etc.  

## ⚠️ Points d'Attention

1. **Async/Await** - Toutes les méthodes sont maintenant async
2. **Error Handling** - Gérer les erreurs PostgreSQL
3. **Transactions** - Utiliser des transactions pour les opérations multiples
4. **Indexes** - Déjà créés, mais monitorer les performances
5. **Migrations** - Utiliser des migrations pour les changements de schéma

## 🚀 Prochaines Étapes

1. Créer les repositories manquants
2. Migrer les API routes une par une
3. Tester chaque migration
4. Déployer progressivement
5. Monitorer les performances
6. Supprimer l'ancien code in-memory

## 📚 Ressources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

---

**Status**: Tables créées ✅  
**Prochaine étape**: Créer les repositories manquants  
**Date**: 31 octobre 2024
