# 🚀 Sprint Ready - Intégrations Sociales

## ✅ Spec Complète et Validée

La spec est maintenant complète avec :
- ✅ Requirements (12 requirements EARS)
- ✅ Design (architecture, interfaces, schéma DB)
- ✅ Tasks (16 tâches, 50+ sous-tâches)
- ✅ Credentials configurés
- ✅ Plan de sprint 5 jours
- ✅ Checklists DoD
- ✅ Plan de tests

## 🎯 Prêt à Démarrer

**Vous pouvez maintenant commencer l'implémentation !**

### 📂 Fichiers de la Spec

1. `.kiro/specs/social-integrations/requirements.md` - Requirements complets
2. `.kiro/specs/social-integrations/design.md` - Architecture et design
3. `.kiro/specs/social-integrations/tasks.md` - Plan d'implémentation détaillé

### 🔧 Pour Commencer

**Ouvrez le fichier des tâches :**
```
.kiro/specs/social-integrations/tasks.md
```

**Cliquez sur "Start task" à côté de la première tâche :**
- **Tâche 1: Database Schema and Migrations**

## 📅 Plan de Sprint (5 Jours)

### J1 - Base de Données & Sécurité (4-6h)
- ✅ Migrations PostgreSQL (oauth_accounts, tiktok_posts, webhook_events, ig_media, ig_comments)
- ✅ Service de chiffrement AES-GCM + KMS
- ✅ Upserts idempotents (ON CONFLICT)

### J2 - TikTok OAuth + UI (5-6h)
- ✅ TikTokOAuthService (state, code→token, refresh avec rotation)
- ✅ GET /api/auth/tiktok (init)
- ✅ GET /api/auth/tiktok/callback
- ✅ Page de connexion TikTok

### J3 - TikTok Upload (5-6h)
- ✅ TikTokUploadService (FILE_UPLOAD + PULL_FROM_URL)
- ✅ POST /api/tiktok/upload
- ✅ Rate limiting (6 req/min)
- ✅ Quota enforcement (5 pending/24h)
- ✅ Gestion erreurs (access_token_invalid, scope_not_authorized, url_ownership_unverified, rate_limit_exceeded, spam_risk_too_many_pending_share)

### J4 - Webhooks & CRM Sync (6-8h)
- ✅ WebhookProcessor (signature, idempotence)
- ✅ POST /api/webhooks/tiktok (200 <150ms)
- ✅ Webhook worker (async, retry, dedup)
- ✅ CRM sync (upserts, workers)
- ✅ Monitoring initial

### J5 - Instagram (7-10h)
- ✅ InstagramOAuthService (Facebook OAuth, Page↔IG mapping)
- ✅ InstagramPublishService (container → poll → publish)
- ✅ POST /api/webhooks/instagram (verification handshake)
- ✅ CRM sync (accounts, media, comments)
- ✅ UI minimale

## 🔑 Credentials Configurés

Tous les credentials sont prêts dans les variables d'environnement :

**TikTok:**
- TIKTOK_CLIENT_KEY
- TIKTOK_CLIENT_SECRET
- NEXT_PUBLIC_TIKTOK_REDIRECT_URI

**Instagram:**
- NEXT_PUBLIC_INSTAGRAM_APP_ID
- INSTAGRAM_APP_SECRET
- NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI

**Threads:**
- NEXT_PUBLIC_THREADS_APP_ID
- THREADS_APP_SECRET
- NEXT_PUBLIC_THREADS_REDIRECT_URI

## ⚠️ Points Critiques à Respecter

### TikTok OAuth
- ✅ redirect_uri STRICTEMENT identique (app & callback)
- ✅ access_token: 24h, refresh_token: 365j
- ✅ **ROTATION du refresh_token** : remplacer si nouveau reçu

### TikTok Upload
- ✅ FILE_UPLOAD: chunks 5-64 MB, séquentiels
- ✅ PULL_FROM_URL: préfixe d'URL vérifié
- ✅ upload_url valide 1h seulement
- ✅ Rate limit: 6 req/min par access_token
- ✅ Cap anti-spam: 5 pending shares/24h

### TikTok Webhooks
- ✅ Répondre 200 immédiatement (<150ms)
- ✅ At-least-once delivery
- ✅ Retry jusqu'à 72h
- ✅ **Idempotence stricte** (external_id unique)

### Instagram
- ✅ Flow: Container → Poll status → Publish
- ✅ Permissions: instagram_basic, instagram_content_publish, instagram_manage_insights, instagram_manage_comments, pages_show_list
- ✅ Webhook verification: hub.challenge / verify_token

### Sécurité
- ✅ AES-GCM (authentifié) pour tokens
- ✅ KMS/Vault pour clés
- ✅ Envelope encryption (DEK + KEK)
- ✅ Rotation de clés planifiée
- ✅ State parameter (CSRF protection)

## 📊 Definition of Done

### TikTok
- [ ] OAuth complet (code→token, refresh auto, rotation testée)
- [ ] Upload Inbox (FILE_UPLOAD + PULL_FROM_URL, erreurs mappées)
- [ ] Webhooks (200 <150ms, idempotence, retry observé)
- [ ] CRM sync (upserts atomiques, jobs observables)
- [ ] Tests (OAuth, upload, webhook, caps)

### Instagram
- [ ] OAuth (token OK pour IG Business/Creator)
- [ ] Publish (container → publish avec poll)
- [ ] Webhooks (verification, 200 rapide)
- [ ] CRM sync (media, insights, comments)
- [ ] Tests (scopes, publish, webhooks)

## 🧪 Tests à Implémenter

### TikTok
1. **OAuth**: mauvais state, redirect_uri mismatch, refresh rotation
2. **Upload FILE_UPLOAD**: chunks 5-64 MB, ordre séquentiel
3. **Upload PULL_FROM_URL**: préfixe non vérifié → url_ownership_unverified
4. **Rate limits**: 6 req/min (init), 5 pending/24h (spam_risk)
5. **Webhooks**: duplicatas (même external_id), retry si ≠200

### Instagram
1. **OAuth**: scopes manquants → erreurs contrôlées
2. **Publish**: container → poll → publish (E2E)
3. **Webhooks**: handshake hub.challenge, retry, duplicatas

## 📚 Références Officielles

### TikTok
- OAuth v2: https://developers.tiktok.com/doc/oauth-user-access-token-management
- Content Posting API: https://developers.tiktok.com/doc/content-posting-api-get-started
- Webhooks: https://developers.tiktok.com/doc/webhooks-overview
- Rate Limits: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post

### Instagram
- Graph API: https://developers.facebook.com/docs/instagram-api
- Postman Collections: https://www.postman.com/meta (workspace Meta)
- Webhooks Sample: https://github.com/fbsamples/graph-api-webhooks-samples

### Sécurité
- OWASP Crypto: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- OWASP Secrets: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

### PostgreSQL
- Upserts: https://www.postgresql.org/docs/current/sql-insert.html (ON CONFLICT)

## 🎯 Première Tâche à Implémenter

**Tâche 1: Database Schema and Migrations**

Créer le fichier de migration :
```sql
-- lib/db/migrations/2024-10-31-social-integrations.sql

-- OAuth accounts (all platforms)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  open_id VARCHAR(255) NOT NULL,
  scope TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, open_id)
);

CREATE INDEX idx_oauth_accounts_expires ON oauth_accounts(expires_at) 
WHERE expires_at > NOW();

-- TikTok posts
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  publish_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  title TEXT,
  error_code VARCHAR(100),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tiktok_posts_user ON tiktok_posts(user_id);
CREATE INDEX idx_tiktok_posts_status ON tiktok_posts(status) 
WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX');

-- Instagram accounts
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  ig_business_id VARCHAR(255) UNIQUE NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  access_level VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ig_business_id)
);

-- Instagram media
CREATE TABLE IF NOT EXISTS ig_media (
  id SERIAL PRIMARY KEY,
  instagram_account_id INTEGER NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  ig_id VARCHAR(255) UNIQUE NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  caption TEXT,
  permalink VARCHAR(500),
  timestamp TIMESTAMP,
  metrics_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ig_media_account ON ig_media(instagram_account_id);
CREATE INDEX idx_ig_media_timestamp ON ig_media(timestamp DESC);

-- Instagram comments
CREATE TABLE IF NOT EXISTS ig_comments (
  id SERIAL PRIMARY KEY,
  ig_media_id INTEGER NOT NULL REFERENCES ig_media(id) ON DELETE CASCADE,
  ig_id VARCHAR(255) UNIQUE NOT NULL,
  from_user VARCHAR(255),
  text TEXT,
  hidden BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ig_comments_media ON ig_comments(ig_media_id);

-- Webhook events (shared)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at) 
WHERE processed_at IS NULL;
```

## 🚀 Comment Démarrer

1. **Ouvrez le fichier des tâches** : `.kiro/specs/social-integrations/tasks.md`
2. **Cliquez sur "Start task"** à côté de "Tâche 1: Database Schema and Migrations"
3. **Implémentez la tâche** en suivant les acceptance criteria
4. **Marquez la tâche comme complète** une fois terminée
5. **Passez à la tâche suivante**

## 📝 Notes Importantes

- Toutes les tâches référencent les requirements spécifiques
- Les tâches optionnelles (tests) sont marquées avec `*`
- Chaque tâche a des acceptance criteria clairs
- Le plan suit l'ordre optimal pour minimiser les dépendances

**Bonne chance pour le sprint ! 🎉**
