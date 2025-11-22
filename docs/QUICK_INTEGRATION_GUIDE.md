# Guide d'Intégration Rapide - Beta Launch

**Date:** 21 novembre 2025
**Durée totale:** ~30 minutes

---

## ✅ Étape 1: Design System (COMPLÉTÉ)

Le design system a été intégré dans `app/layout.tsx`:

```typescript
import "@/styles/design-system.css"; // Beta Launch Design System
```

**Statut:** ✅ FAIT

---

## 📋 Étape 2: Vérifier les Variables d'Environnement (5 minutes)

### Variables Requises

Vérifiez que ces variables sont définies dans votre environnement de production (Vercel):

#### Déjà Configurées ✅
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://app.huntaze.com
NEXTAUTH_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=huntaze-beta-assets
```

#### À Vérifier/Ajouter
```bash
# Encryption pour OnlyFans credentials
ENCRYPTION_KEY=<32-character-key>

# CloudFront CDN URL
CDN_URL=https://cdn.huntaze.com

# OAuth Providers (si pas déjà configurés)
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

### Comment Vérifier

**Via Vercel Dashboard:**
1. Allez sur https://vercel.com/huntaze
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Vérifiez que toutes les variables sont présentes

**Via Vercel CLI:**
```bash
vercel env ls
```

---

## 🔔 Étape 3: Configurer les Alarmes CloudWatch (15 minutes)

### Option A: Configuration Automatique (Recommandé)

```bash
# Exécuter le script de configuration
npm run setup:cloudwatch

# Vérifier que les alarmes sont créées
aws cloudwatch describe-alarms --region us-east-1 | grep huntaze
```

### Option B: Configuration Manuelle

Si le script ne fonctionne pas, suivez les instructions dans:
- `docs/MONITORING_ALERTING.md` (section "CloudWatch Alarms")

### Alarmes à Créer

1. ✅ **huntaze-beta-high-error-rate** (> 1%)
2. ✅ **huntaze-beta-service-down** (5xx > 5%)
3. ✅ **huntaze-beta-db-connections-high** (> 80%)
4. ✅ **huntaze-beta-high-latency** (> 1s)
5. ✅ **huntaze-beta-low-cache-hit-rate** (< 70%)
6. ✅ **huntaze-beta-lambda-errors** (> 10/5min)
7. ✅ **huntaze-beta-elevated-4xx-errors** (> 5%)
8. ✅ **huntaze-beta-email-delivery-issues** (bounce > 5%)

### SNS Topics à Créer

1. ✅ **huntaze-critical-alerts**
   - Email: ops@huntaze.com
   - Email: oncall@huntaze.com

2. ✅ **huntaze-high-priority-alerts**
   - Email: dev@huntaze.com

3. ✅ **huntaze-warning-alerts**
   - Email: dev@huntaze.com

---

## 🧪 Étape 4: Vérifier les Tests (5 minutes)

```bash
# Tests unitaires
npm test -- --run

# Tests d'intégration (optionnel - peut prendre du temps)
npm run test:integration -- --run

# Audit de sécurité
npm audit --production
```

**Résultats Attendus:**
- ✅ Unit tests: 69 tests passants
- ✅ Integration tests: 257+ tests passants (78 S3 tests peuvent échouer sans AWS credentials)
- ✅ Security audit: 0 vulnerabilities

---

## 🚀 Étape 5: Déployer (10 minutes)

### Déploiement sur Vercel

```bash
# Option 1: Via CLI
vercel --prod

# Option 2: Via Git Push (si auto-deploy activé)
git add .
git commit -m "Integrate Beta Launch UI System"
git push origin main
```

### Vérification Post-Déploiement

```bash
# Vérifier que le site est accessible
curl -I https://app.huntaze.com

# Vérifier les headers de sécurité
curl -I https://app.huntaze.com | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"

# Tester l'endpoint de santé (si configuré)
curl https://app.huntaze.com/api/health
```

---

## ✅ Checklist de Vérification Post-Intégration

### Fonctionnalités de Base
- [ ] Page d'accueil charge correctement
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Onboarding fonctionne (3 étapes)
- [ ] Page Home affiche les stats
- [ ] Page Integrations accessible
- [ ] OAuth connections fonctionnent

### Design
- [ ] Design system CSS chargé (vérifier dans DevTools)
- [ ] Thème noir appliqué
- [ ] Accents rainbow visibles sur les boutons
- [ ] Responsive design fonctionne (mobile)

### Monitoring
- [ ] Alarmes CloudWatch créées
- [ ] SNS topics configurés
- [ ] Dashboards CloudWatch accessibles
- [ ] Logs CloudWatch collectés

### Performance
- [ ] FCP < 1.5s (vérifier avec Lighthouse)
- [ ] LCP < 2.5s (vérifier avec Lighthouse)
- [ ] Pas d'erreurs dans la console
- [ ] Cache fonctionne (vérifier les headers)

---

## 🔍 Tests Rapides

### Test 1: Inscription
```bash
curl -X POST https://app.huntaze.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

**Attendu:** 201 Created avec userId et verificationToken

### Test 2: Stats Home
```bash
# Nécessite une session valide
curl https://app.huntaze.com/api/home/stats \
  -H "Cookie: next-auth.session-token=..."
```

**Attendu:** 200 OK avec stats JSON

### Test 3: Integrations Status
```bash
# Nécessite une session valide
curl https://app.huntaze.com/api/integrations/status \
  -H "Cookie: next-auth.session-token=..."
```

**Attendu:** 200 OK avec liste des intégrations

---

## 📊 Monitoring Post-Déploiement

### Première Heure (Vérifier toutes les 5 minutes)

```bash
# Vérifier les erreurs CloudWatch
aws logs tail /huntaze/beta/application --follow

# Vérifier les alarmes
aws cloudwatch describe-alarms \
  --alarm-names huntaze-beta-high-error-rate huntaze-beta-service-down \
  --region us-east-1
```

**Métriques à Surveiller:**
- Error rate < 1%
- API latency < 500ms
- Cache hit rate > 70%
- Pas d'alarmes déclenchées

### Premier Jour (Vérifier toutes les heures)

**Via CloudWatch Dashboard:**
1. Ouvrir https://console.aws.amazon.com/cloudwatch
2. Dashboards → huntaze-beta-overview
3. Vérifier:
   - Service health (vert)
   - Performance metrics (normaux)
   - Business metrics (registrations, emails)
   - Error tracking (minimal)

**Via Vercel Analytics:**
1. Ouvrir https://vercel.com/huntaze
2. Analytics → Real-time
3. Vérifier:
   - Core Web Vitals (verts)
   - Function execution times (< 1s)
   - Error rate (< 1%)

---

## 🆘 En Cas de Problème

### Problème: Site ne charge pas

**Diagnostic:**
```bash
# Vérifier le déploiement Vercel
vercel ls

# Vérifier les logs
vercel logs
```

**Solution:**
- Rollback via Vercel Dashboard
- Ou: `vercel rollback [deployment-url]`

### Problème: Erreurs 500

**Diagnostic:**
```bash
# Vérifier les logs CloudWatch
aws logs tail /huntaze/beta/application --since 1h

# Vérifier les variables d'environnement
vercel env ls
```

**Solution:**
- Vérifier DATABASE_URL
- Vérifier NEXTAUTH_SECRET
- Redéployer si nécessaire

### Problème: Design cassé

**Diagnostic:**
- Ouvrir DevTools → Network
- Vérifier que `design-system.css` est chargé
- Vérifier la console pour erreurs CSS

**Solution:**
- Vérifier que l'import est dans `app/layout.tsx`
- Clear cache et recharger
- Vérifier le build: `npm run build`

### Problème: Alarmes déclenchées

**Diagnostic:**
```bash
# Vérifier quelle alarme
aws cloudwatch describe-alarm-history \
  --alarm-name huntaze-beta-high-error-rate \
  --max-records 10
```

**Solution:**
- Consulter `docs/MONITORING_ALERTING.md` section "Alert Response Procedures"
- Suivre la procédure selon la gravité (P0/P1/P2)

---

## 📚 Documentation Complète

Pour plus de détails, consultez:

1. **Déploiement Complet:** `docs/BETA_DEPLOYMENT.md`
2. **Procédures Rollback:** `docs/ROLLBACK_PROCEDURE.md`
3. **Monitoring:** `docs/MONITORING_ALERTING.md`
4. **Checklist:** `docs/DEPLOYMENT_CHECKLIST.md`
5. **Analyse d'Intégration:** `docs/INTEGRATION_ANALYSIS.md`
6. **Ce que Beta Ajoute:** `docs/WHAT_BETA_ADDS.md`

---

## ✅ Intégration Complète!

Une fois toutes les étapes complétées:

1. ✅ Design system intégré
2. ✅ Variables d'environnement vérifiées
3. ✅ Alarmes CloudWatch configurées
4. ✅ Tests exécutés
5. ✅ Déploiement effectué
6. ✅ Vérifications post-déploiement passées

**Votre Huntaze est maintenant production-ready avec:**
- Documentation complète (4,000+ lignes)
- Tests exhaustifs (335 tests)
- Monitoring robuste (8 alarmes + 2 dashboards)
- Procédures de rollback documentées
- Design system professionnel

**Prochaines étapes:**
1. Monitorer pendant 24h
2. Inviter les beta testers (20-50 créateurs)
3. Collecter les retours
4. Itérer selon les besoins

**Félicitations! 🎉**

