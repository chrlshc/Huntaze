# 🚀 Shopify-Style Onboarding - Guide de Déploiement

## Vue d'ensemble

Système d'onboarding non-bloquant production-ready avec API complète, UI components, et intégration dashboard.

## ✅ Ce qui est prêt

### Phase 1: Database & Data Layer ✅
- ✅ Schéma PostgreSQL avec migrations
- ✅ 3 repositories (step definitions, user progress, events)
- ✅ Script de seed avec données de démo
- ✅ Support versioning et market-specific rules

### Phase 2: API Layer ✅
- ✅ GET /api/onboarding (avec filtrage market/role)
- ✅ PATCH /api/onboarding/steps/:id (update status)
- ✅ POST /api/onboarding/snooze (snooze nudges)
- ✅ Gating middleware (requireStep)
- ✅ 3 routes protégées (store/publish, checkout/*)
- ✅ Analytics tracking service (9 event types)
- ✅ Redis caching (5min TTL)

### Phase 3: UI Components ✅
- ✅ SetupGuide (checklist principal)
- ✅ StepItem (étapes individuelles)
- ✅ ProgressIndicator (barre de progression animée)
- ✅ CompletionNudge (banner de rappel)
- ✅ GuardRailModal (modal de prérequis)
- ✅ useOnboarding hook (state management)
- ✅ Page de démo complète

## 📦 Installation

### 1. Database Setup

```bash
# Exécuter la migration
psql $DATABASE_URL < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql

# Seed les données de démo
node scripts/seed-onboarding-demo.js

# Ou avec un user ID spécifique
DEMO_USER_ID=your-user-id node scripts/seed-onboarding-demo.js
```

### 2. Environment Variables

Ajouter à `.env`:

```bash
# Redis pour caching (optionnel mais recommandé)
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://...

# Analytics (optionnel)
ANALYTICS_ENABLED=true
```

### 3. Dependencies

Toutes les dépendances sont déjà dans le projet:
- ✅ PostgreSQL client
- ✅ Redis (optionnel)
- ✅ Next.js 15
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS

## 🎯 Utilisation

### Option 1: Page de Démo

Visitez `/onboarding/shopify-style` pour voir le système complet en action.

```tsx
// Déjà créé: app/onboarding/shopify-style/page.tsx
```

### Option 2: Intégration Dashboard

Ajouter au dashboard existant:

```tsx
// app/dashboard/page.tsx
import { SetupGuideContainer, CompletionNudge } from '@/components/onboarding/shopify-style';

export default function DashboardPage() {
  const user = useUser(); // Votre hook d'auth
  
  return (
    <div>
      {/* Nudge Banner */}
      <CompletionNudge
        remainingSteps={user.onboarding.remainingSteps}
        progress={user.onboarding.progress}
        onSnooze={async (days) => {
          await fetch('/api/onboarding/snooze', {
            method: 'POST',
            body: JSON.stringify({ days }),
          });
        }}
        onDismiss={() => {/* handle dismiss */}}
        snoozeCount={user.onboarding.snoozeCount}
        maxSnoozes={3}
      />
      
      {/* Setup Guide Card */}
      <SetupGuideContainer
        userId={user.id}
        userRole={user.role}
        market={user.market}
        onLearnMore={(stepId) => {
          // Ouvrir modal d'aide
        }}
      />
      
      {/* Reste du dashboard */}
    </div>
  );
}
```

### Option 3: Gating sur Actions Critiques

```tsx
// app/store/publish/page.tsx
import { GuardRailModal } from '@/components/onboarding/shopify-style';

export default function PublishPage() {
  const [guardRail, setGuardRail] = useState(null);
  
  const handlePublish = async () => {
    const response = await fetch('/api/store/publish', {
      method: 'POST',
    });
    
    if (response.status === 409) {
      const data = await response.json();
      setGuardRail(data);
      return;
    }
    
    // Success
  };
  
  return (
    <>
      <button onClick={handlePublish}>Publier</button>
      
      {guardRail && (
        <GuardRailModal
          isOpen={true}
          missingStep={guardRail.missingStep}
          message={guardRail.message}
          action={guardRail.action}
          onClose={() => setGuardRail(null)}
          onComplete={() => {
            setGuardRail(null);
            handlePublish(); // Retry
          }}
        />
      )}
    </>
  );
}
```

## 🔧 Configuration

### Personnaliser les Étapes

Modifier `scripts/seed-onboarding-demo.js` ou ajouter via SQL:

```sql
INSERT INTO onboarding_step_definitions 
(id, version, title, description, required, weight, role_visibility)
VALUES 
('custom_step', 1, 'Ma Nouvelle Étape', 'Description', false, 10, ARRAY['owner']);
```

### Ajouter des Routes Gatées

```typescript
// lib/middleware/route-config.ts
export const GATED_ROUTES = {
  '/api/my-action': {
    requiredStep: 'payments',
    critical: true,
  },
};
```

### Personnaliser les Messages

```typescript
// lib/middleware/onboarding-gating.ts
function getStepMessage(stepId: string): string {
  const messages = {
    payments: 'Vous devez configurer les paiements...',
    custom_step: 'Votre message personnalisé...',
  };
  return messages[stepId] || 'Configuration requise';
}
```

## 📊 Monitoring

### Métriques Disponibles

```typescript
// Via analytics service
- onboarding.viewed
- onboarding.step_completed
- onboarding.step_skipped
- onboarding.nudge_snoozed
- gating.blocked
- merchant.previewed_store
- merchant.first_product_created
- merchant.first_checkout_attempt
```

### Queries Analytics

```sql
-- Skip rate par étape
SELECT 
  step_id,
  COUNT(*) FILTER (WHERE status = 'skipped') * 100.0 / COUNT(*) as skip_rate
FROM user_onboarding
WHERE updated_at >= now() - interval '7 days'
GROUP BY step_id;

-- Progression moyenne
SELECT AVG(
  (SELECT COUNT(*) FROM user_onboarding uo 
   WHERE uo.user_id = u.id AND uo.status = 'done')
) as avg_completed_steps
FROM users u;
```

## 🧪 Testing

### Test la Page de Démo

```bash
npm run dev
# Visiter http://localhost:3000/onboarding/shopify-style
```

### Test les APIs

```bash
# GET onboarding status
curl http://localhost:3000/api/onboarding?market=FR

# Update step
curl -X PATCH http://localhost:3000/api/onboarding/steps/theme \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# Test gated route
curl -X POST http://localhost:3000/api/store/publish
# Devrait retourner 409 si payments non configuré
```

### Test les Components

```bash
# Lancer les tests (si configurés)
npm test components/onboarding/shopify-style
```

## 🚨 Troubleshooting

### Erreur: "Cannot find module"

```bash
# Vérifier que tous les fichiers sont créés
ls -la components/onboarding/shopify-style/
```

### Erreur: "Database table does not exist"

```bash
# Exécuter la migration
psql $DATABASE_URL < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql
```

### Erreur: "No steps returned"

```bash
# Seed les données
node scripts/seed-onboarding-demo.js
```

### Cache Issues

```bash
# Clear Redis cache
redis-cli FLUSHDB

# Ou redémarrer l'app
npm run dev
```

## 📝 Checklist de Déploiement

- [ ] Migration database exécutée
- [ ] Seed data créé
- [ ] Variables d'environnement configurées
- [ ] Redis configuré (optionnel)
- [ ] Page de démo testée
- [ ] APIs testées
- [ ] Gating middleware testé
- [ ] Analytics configuré
- [ ] Monitoring en place
- [ ] Documentation lue par l'équipe

## 🎨 Customisation UI

### Thème Colors

Les composants utilisent les tokens CSS du design system:

```css
/* Personnaliser dans globals.css */
:root {
  --primary: ...;
  --surface-raised: ...;
  --content-primary: ...;
}
```

### Animations

Modifier les durées dans les composants:

```tsx
// SetupGuide.tsx
className="transition-all duration-500" // Changer 500ms
```

## 📚 Documentation

- **Components**: `components/onboarding/shopify-style/README.md`
- **API**: `app/api/onboarding/README.md`
- **Design**: `.kiro/specs/shopify-style-onboarding/design.md`
- **Requirements**: `.kiro/specs/shopify-style-onboarding/requirements.md`

## 🔄 Prochaines Étapes (Optionnel)

### Phase 4: Dashboard Integration (Task 12-14)
- Intégrer dans le dashboard principal
- Créer demo data automatique
- Ajouter gating sur toutes les actions critiques

### Phase 5: Advanced Features (Task 15-18)
- Step versioning et migration
- Email verification resilience
- Plan-based feature eligibility
- Rate limiting

### Phase 6: Analytics (Task 19-20)
- Dashboard analytics
- Conversion tracking
- A/B testing framework

## 💡 Tips

1. **Commencer Simple**: Utilisez la page de démo d'abord
2. **Tester Localement**: Seed les données et testez tous les flows
3. **Monitoring**: Configurez les analytics dès le début
4. **Itérer**: Ajoutez des étapes progressivement
5. **Feedback**: Écoutez les utilisateurs et ajustez

## 🆘 Support

- Issues: Créer un ticket avec logs et correlation ID
- Docs: Voir README.md dans chaque dossier
- Logs: Chercher `[Onboarding]` dans les logs serveur

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2024-11-11
