# 📋 Plan Prochaine Session

## Objectifs

1. ✅ **Tester Instagram** - Vérifier fonctionnement
2. 🆕 **Ajouter Reddit** - Nouvelle plateforme
3. 📚 **Documenter** - Guide complet
4. 🚀 **Lancer** - Déploiement production

---

## 1. Tests Instagram (30-45 min)

### Tests à exécuter
```bash
# Tests unitaires
npm test tests/unit/services/instagramOAuth.test.ts
npm test tests/unit/services/instagramPublish.test.ts
npm test tests/unit/db/repositories/instagramAccountsRepository.test.ts

# Tests d'intégration
npm test tests/integration/api/instagram-oauth-endpoints.test.ts
npm test tests/integration/api/instagram-publish-endpoints.test.ts
npm test tests/integration/db/instagram-accounts-repository.test.ts
```

### Vérifications manuelles
- [ ] OAuth flow fonctionne
- [ ] Publishing fonctionne (photo, vidéo, carousel)
- [ ] Webhooks configurés
- [ ] Database tables créées
- [ ] Repositories fonctionnent

---

## 2. Reddit Integration (3-4 heures)

### Architecture Reddit
- **OAuth:** Reddit OAuth 2.0
- **Token lifetime:** Access token (1 heure), Refresh token (permanent)
- **Publishing:** Submit link/text/image posts
- **Subreddits:** User selects target subreddit

### Fichiers à créer

**Services:**
- `lib/services/redditOAuth.ts`
- `lib/services/redditPublish.ts`

**API Endpoints:**
- `app/api/auth/reddit/route.ts`
- `app/api/auth/reddit/callback/route.ts`
- `app/api/reddit/publish/route.ts`

**UI:**
- `app/platforms/connect/reddit/page.tsx`
- `components/platforms/RedditDashboardWidget.tsx`

**Database:**
- Tables déjà créées dans migration existante
- `reddit_posts` table
- Utiliser `oauth_accounts` existant

### Reddit OAuth Flow
```
1. User clicks "Connect Reddit"
2. Redirect to Reddit OAuth
3. User authorizes
4. Callback receives code
5. Exchange for access + refresh tokens
6. Store encrypted tokens
7. Success!
```

### Reddit Publishing
```
POST /api/reddit/publish
{
  "subreddit": "r/test",
  "type": "link|text|image",
  "title": "My post",
  "content": "...",
  "url": "https://..." // for link posts
}
```

### Environment Variables
```bash
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_REDIRECT_URI=https://huntaze.com/api/auth/reddit/callback
REDDIT_USER_AGENT=Huntaze/1.0
```

---

## 3. Documentation (1-2 heures)

### Documents à créer

**Guide Utilisateur:**
- `docs/USER_GUIDE.md`
  - Comment connecter TikTok
  - Comment connecter Instagram
  - Comment connecter Reddit
  - Comment publier du contenu
  - Troubleshooting

**Guide Développeur:**
- `docs/DEVELOPER_GUIDE.md`
  - Architecture overview
  - OAuth flows
  - Database schema
  - API endpoints
  - Testing guide

**Guide Déploiement:**
- `docs/DEPLOYMENT.md`
  - Variables d'environnement
  - Database setup
  - Webhook configuration
  - Production checklist

---

## 4. Déploiement (30 min)

### Checklist

**Pré-déploiement:**
- [ ] Tous les tests passent
- [ ] Variables d'environnement configurées
- [ ] Database migrée
- [ ] Webhooks configurés (TikTok, Instagram)
- [ ] Code commité et pushé

**Déploiement:**
```bash
# 1. Commit
git add .
git commit -m "feat: complete social integrations (TikTok, Instagram, Reddit)"

# 2. Push
git push origin main

# 3. Deploy (AWS Amplify auto-deploy)
# Vérifier dans console AWS Amplify

# 4. Migrate database
npm run migrate:prod

# 5. Test en production
# - Test OAuth flows
# - Test publishing
# - Test webhooks
```

**Post-déploiement:**
- [ ] Tester OAuth (TikTok, Instagram, Reddit)
- [ ] Tester publishing
- [ ] Vérifier webhooks
- [ ] Monitorer logs
- [ ] Vérifier métriques

---

## Priorités

### Must Have (Critique)
1. ✅ Tests Instagram passent
2. 🆕 Reddit OAuth + Publishing
3. 📚 Documentation basique
4. 🚀 Déploiement

### Nice to Have (Optionnel)
- Monitoring dashboards
- Alertes avancées
- Tests E2E complets
- Documentation extensive

---

## Estimation Temps

| Tâche | Temps | Priorité |
|-------|-------|----------|
| Tests Instagram | 30-45 min | Critique |
| Reddit OAuth | 1-1.5h | Critique |
| Reddit Publishing | 1-1.5h | Critique |
| Reddit UI | 30-45 min | Critique |
| Documentation | 1-2h | Important |
| Déploiement | 30 min | Critique |
| **TOTAL** | **5-7 heures** | - |

---

## État Actuel

**Complété:**
- ✅ TikTok (OAuth, Publishing, Webhooks, UI)
- ✅ Instagram (OAuth, Publishing, Webhooks, CRM, UI)
- ✅ Database migrations
- ✅ Token encryption
- ✅ Shared infrastructure

**À faire:**
- ⏭️ Tests Instagram
- ⏭️ Reddit integration
- ⏭️ Documentation
- ⏭️ Déploiement

---

## Commandes Utiles

### Tests
```bash
# Tous les tests
npm test

# Tests spécifiques
npm test tests/unit/services/
npm test tests/integration/api/

# Coverage
npm test -- --coverage
```

### Database
```bash
# Migration locale
npm run migrate

# Migration production
npm run migrate:prod

# Rollback
npm run migrate:rollback
```

### Déploiement
```bash
# Build local
npm run build

# Start production
npm start

# Logs
npm run logs
```

---

## Notes Importantes

1. **Reddit Rate Limits:** 60 requests/minute
2. **Reddit OAuth:** Refresh tokens ne expirent pas
3. **Reddit Subreddits:** User doit avoir permissions
4. **Reddit Content:** Respecter rules de chaque subreddit

---

## Résumé

**Session actuelle:** Instagram OAuth + Publishing + Webhooks + CRM ✅

**Prochaine session:**
1. Tester Instagram
2. Implémenter Reddit
3. Documenter
4. Déployer

**Résultat final:** TikTok + Instagram + Reddit complets et en production ! 🚀

---

**Tokens utilisés cette session:** 135K/200K (67.5%)  
**Recommandation:** Nouvelle session pour Reddit avec contexte frais
