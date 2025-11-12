# 🚀 Onboarding Shopify-Style - Quick Start

## TL;DR

Système d'onboarding non-bloquant **100% fonctionnel** et prêt pour production.

## ⚡ Démarrage en 3 Minutes

### 1. Setup Database (30 secondes)

```bash
# Migration
psql $DATABASE_URL < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql

# Seed data
node scripts/seed-onboarding-demo.js
```

### 2. Voir la Démo (30 secondes)

```bash
npm run dev
```

Visiter: **http://localhost:3000/onboarding/shopify-style**

### 3. Intégrer au Dashboard (2 minutes)

```tsx
// app/dashboard/page.tsx
import { 
  SetupGuideContainer, 
  CompletionNudge 
} from '@/components/onboarding/shopify-style';

export default function Dashboard() {
  const user = useUser();
  
  return (
    <div>
      {/* Banner de rappel */}
      <CompletionNudge
        remainingSteps={4}
        progress={35}
        onSnooze={async (days) => {
          await fetch('/api/onboarding/snooze', {
            method: 'POST',
            body: JSON.stringify({ days }),
          });
        }}
        onDismiss={() => {}}
        snoozeCount={0}
        maxSnoozes={3}
      />
      
      {/* Guide de configuration */}
      <SetupGuideContainer
        userId={user.id}
        userRole={user.role}
        market={user.market}
      />
    </div>
  );
}
```

## ✅ C'est Tout!

Le système est maintenant actif avec:

- ✅ 6 étapes de démo (email, payments, theme, product, domain, impressum)
- ✅ APIs fonctionnelles (GET, PATCH, POST)
- ✅ Gating sur routes critiques
- ✅ Analytics tracking
- ✅ UI responsive et accessible

## 📊 Endpoints Disponibles

```bash
# Récupérer l'état
GET /api/onboarding?market=FR

# Mettre à jour une étape
PATCH /api/onboarding/steps/theme
Body: {"status": "done"}

# Snooze les rappels
POST /api/onboarding/snooze
Body: {"days": 7}

# Routes gatées (retournent 409 si prérequis manquants)
POST /api/store/publish
POST /api/checkout/initiate
POST /api/checkout/process
```

## 🎯 Tester le Gating

```tsx
// Dans n'importe quel composant
import { GuardRailModal } from '@/components/onboarding/shopify-style';

const [guardRail, setGuardRail] = useState(null);

const handleAction = async () => {
  const res = await fetch('/api/store/publish', { method: 'POST' });
  
  if (res.status === 409) {
    const data = await res.json();
    setGuardRail(data);
  }
};

return (
  <>
    <button onClick={handleAction}>Publier</button>
    
    {guardRail && (
      <GuardRailModal
        isOpen={true}
        missingStep={guardRail.missingStep}
        message={guardRail.message}
        action={guardRail.action}
        onClose={() => setGuardRail(null)}
        onComplete={() => setGuardRail(null)}
      />
    )}
  </>
);
```

## 📚 Documentation Complète

- **Déploiement**: `SHOPIFY_ONBOARDING_DEPLOYMENT.md`
- **Production Ready**: `SHOPIFY_ONBOARDING_PRODUCTION_READY.md`
- **Components**: `components/onboarding/shopify-style/README.md`
- **API**: `app/api/onboarding/README.md`

## 🎨 Composants Disponibles

```tsx
import {
  SetupGuide,              // Checklist de base
  SetupGuideContainer,     // Avec state management
  StepItem,                // Étape individuelle
  ProgressIndicator,       // Barre de progression animée
  CompletionNudge,         // Banner de rappel
  GuardRailModal,          // Modal de prérequis
  useOnboarding,           // Hook custom
} from '@/components/onboarding/shopify-style';
```

## 🔧 Personnalisation Rapide

### Ajouter une Étape

```sql
INSERT INTO onboarding_step_definitions 
(id, version, title, description, required, weight, role_visibility)
VALUES 
('ma_etape', 1, 'Mon Titre', 'Ma description', false, 10, ARRAY['owner']);
```

### Gater une Route

```typescript
// lib/middleware/route-config.ts
export const GATED_ROUTES = {
  '/api/ma-route': {
    requiredStep: 'payments',
    critical: true,
  },
};
```

### Changer les Couleurs

```css
/* globals.css */
:root {
  --primary: #3b82f6;
  --surface-raised: #ffffff;
}
```

## 🐛 Troubleshooting

### "No steps returned"
```bash
node scripts/seed-onboarding-demo.js
```

### "Table does not exist"
```bash
psql $DATABASE_URL < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql
```

### "Module not found"
```bash
npm install
npm run build
```

## 📊 Monitoring

```sql
-- Voir la progression des users
SELECT 
  u.email,
  COUNT(*) FILTER (WHERE uo.status = 'done') as completed,
  COUNT(*) FILTER (WHERE uo.status = 'skipped') as skipped
FROM users u
LEFT JOIN user_onboarding uo ON uo.user_id = u.id
GROUP BY u.id, u.email;

-- Skip rate par étape
SELECT 
  step_id,
  COUNT(*) FILTER (WHERE status = 'skipped') * 100.0 / COUNT(*) as skip_rate
FROM user_onboarding
GROUP BY step_id;
```

## 🎉 Prêt!

Votre système d'onboarding est maintenant **actif et utilisable**.

Pour plus de détails, voir `SHOPIFY_ONBOARDING_PRODUCTION_READY.md`

---

**Questions?** Voir la documentation complète ou créer un ticket.
