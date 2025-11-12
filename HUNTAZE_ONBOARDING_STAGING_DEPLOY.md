# 🚀 Huntaze Onboarding - Déploiement Staging

## Déploiement sur https://staging.huntaze.com/

### ✅ Prérequis

1. **Database Staging**
   - Accès à la base PostgreSQL de staging
   - Credentials dans `.env.production` ou variables Vercel

2. **Redis Staging** (optionnel)
   - Instance Redis configurée
   - URL dans `REDIS_URL`

3. **Variables d'Environnement**
   ```bash
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   NEXT_PUBLIC_APP_URL=https://staging.huntaze.com
   ```

---

## 📦 Étapes de Déploiement

### 1. Setup Database (Une seule fois)

```bash
# Se connecter à la DB staging
psql $DATABASE_URL_STAGING

# Exécuter la migration
\i lib/db/migrations/2024-11-11-shopify-style-onboarding.sql

# Seed les données
node scripts/seed-huntaze-onboarding.js
```

### 2. Build et Test Local

```bash
# Build production
npm run build

# Vérifier qu'il n'y a pas d'erreurs
# ✅ Build doit passer sans erreurs
```

### 3. Deploy sur Vercel/Staging

```bash
# Si Vercel CLI
vercel --prod

# Ou via Git push (si auto-deploy configuré)
git add .
git commit -m "feat: add Huntaze onboarding system"
git push origin main
```

### 4. Vérification Post-Déploiement

```bash
# Test les endpoints
curl https://staging.huntaze.com/api/onboarding

# Test la page
# Visiter: https://staging.huntaze.com/dashboard
# Visiter: https://staging.huntaze.com/onboarding/huntaze
```

---

## 🎯 URLs Disponibles

### Pages
- **Dashboard avec Onboarding**: `https://staging.huntaze.com/dashboard`
- **Page Démo**: `https://staging.huntaze.com/onboarding/huntaze`

### API Endpoints
- `GET https://staging.huntaze.com/api/onboarding`
- `PATCH https://staging.huntaze.com/api/onboarding/steps/:id`
- `POST https://staging.huntaze.com/api/onboarding/snooze`
- `POST https://staging.huntaze.com/api/store/publish` (gated)
- `POST https://staging.huntaze.com/api/checkout/initiate` (gated)
- `POST https://staging.huntaze.com/api/checkout/process` (gated)

---

## 🔧 Configuration Staging

### Variables d'Environnement Vercel

Dans le dashboard Vercel, ajouter:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NEXT_PUBLIC_APP_URL=https://staging.huntaze.com
ANALYTICS_ENABLED=true
```

### Database Connection

Vérifier que la DB staging est accessible:

```bash
psql $DATABASE_URL_STAGING -c "SELECT version();"
```

---

## 📊 Monitoring Staging

### Logs

```bash
# Vercel logs
vercel logs staging.huntaze.com

# Rechercher les erreurs onboarding
vercel logs staging.huntaze.com --filter="[Onboarding]"
```

### Métriques

```sql
-- Vérifier les données
SELECT COUNT(*) FROM onboarding_step_definitions;
SELECT COUNT(*) FROM user_onboarding;
SELECT COUNT(*) FROM onboarding_events;

-- Voir les étapes actives
SELECT id, title, required, weight 
FROM onboarding_step_definitions 
WHERE active_from <= NOW() 
AND (active_to IS NULL OR active_to > NOW());
```

---

## 🧪 Tests Staging

### 1. Test API

```bash
# GET onboarding
curl https://staging.huntaze.com/api/onboarding?market=FR

# PATCH step (nécessite auth)
curl -X PATCH https://staging.huntaze.com/api/onboarding/steps/theme \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status":"done"}'
```

### 2. Test UI

1. Visiter `https://staging.huntaze.com/dashboard`
2. Vérifier que le guide d'onboarding s'affiche
3. Cliquer sur "Faire" pour une étape
4. Vérifier que la progression se met à jour
5. Tester le bouton "Passer" sur une étape optionnelle

### 3. Test Gating

1. Visiter `https://staging.huntaze.com/onboarding/huntaze`
2. Cliquer sur "Tester Guard-Rail Modal"
3. Vérifier que le modal s'affiche correctement
4. Tester la fermeture et les actions

---

## 🐛 Troubleshooting Staging

### Erreur: "Table does not exist"

```bash
# Re-run migration
psql $DATABASE_URL_STAGING < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql
```

### Erreur: "No steps returned"

```bash
# Re-seed data
node scripts/seed-huntaze-onboarding.js
```

### Erreur: "Module not found"

```bash
# Clear cache et rebuild
rm -rf .next
npm run build
```

### Erreur: "Redis connection failed"

- Vérifier `REDIS_URL` dans Vercel
- Le système fonctionne sans Redis (cache désactivé)

---

## 📝 Checklist de Déploiement

- [ ] Migration DB exécutée sur staging
- [ ] Seed data créé
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Build local passe sans erreurs
- [ ] Deploy sur Vercel réussi
- [ ] Page dashboard accessible
- [ ] Page démo accessible
- [ ] APIs retournent des données
- [ ] Guide d'onboarding s'affiche
- [ ] Actions (Faire/Passer) fonctionnent
- [ ] Guard-rail modal fonctionne
- [ ] Logs Vercel vérifiés

---

## 🔄 Rollback

Si problème en staging:

```bash
# Revert le deploy
vercel rollback

# Ou désactiver temporairement
# Commenter l'import dans app/dashboard/page.tsx:
// import { SetupGuideContainer } from '@/components/onboarding/huntaze-onboarding';
```

---

## 📚 Documentation

- **Quick Start**: `ONBOARDING_QUICK_START.md`
- **Production Ready**: `HUNTAZE_ONBOARDING_PRODUCTION_READY.md`
- **Deployment**: `HUNTAZE_ONBOARDING_DEPLOYMENT.md`
- **Components**: `components/onboarding/huntaze-onboarding/README.md`

---

## 🎯 Prochaines Étapes

Après validation en staging:

1. ✅ Tester avec de vrais utilisateurs
2. ✅ Monitorer les métriques (skip rate, completion rate)
3. ✅ Ajuster les messages si nécessaire
4. ✅ Déployer en production

---

**Status**: Ready for Staging Deploy  
**URL**: https://staging.huntaze.com/  
**Date**: 2024-11-11
