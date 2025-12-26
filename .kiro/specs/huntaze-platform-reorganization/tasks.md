# Implementation Plan - Huntaze Platform Reorganization

**Date:** 13 Novembre 2025  
**Durée estimée:** 6 semaines  
**Objectif:** Réorganiser Huntaze en 6 sections claires avec vraies données

---

## Phase 1: Foundation & Layout (Semaine 1)

- [x] 1. Créer le nouveau App Shell
- [x] 1.1 Créer `app/(app)/layout.tsx` avec sidebar 6 sections
  - Implémenter navigation principale (Dashboard, Content, Analytics, Marketing, OnlyFans, Messages)
  - Ajouter header avec user menu et notifications
  - Implémenter responsive sidebar (collapse sur mobile)
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 1.2 Créer composant Sidebar réutilisable
  - Navigation items avec icons (lucide-react)
  - Active state highlighting
  - Sub-sections expandable
  - Badge pour unread count (Messages)
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Créer composant Header réutilisable
  - Breadcrumb navigation
  - Search bar (global)
  - Notifications dropdown
  - User menu avec dark mode toggle
  - _Requirements: 1.2, 1.4_

- [x] 1.4 Migrer pages existantes vers nouveau layout
  - Vérifier Dashboard page fonctionne
  - Vérifier Content page fonctionne
  - Vérifier Analytics page fonctionne
  - Tester navigation entre sections
  - _Requirements: 1.1, 1.2_

---

## Phase 2: Analytics Pages Détaillées (Semaine 2)

- [x] 2. Créer pages Analytics détaillées
- [x] 2.1 Créer page Pricing (`/analytics/pricing`)
  - Afficher recommandations prix actuelles (API `/api/revenue/pricing`)
  - Composant PricingCard pour subscription et PPV
  - Bouton "Apply" pour appliquer recommandations
  - Historique des changements de prix
  - _Requirements: 4.3_

- [x] 2.2 Créer page Churn (`/analytics/churn`)
  - Liste fans à risque (API `/api/revenue/churn`)
  - Composant ChurnRiskList avec filtres (high, medium, low)
  - Bouton "Re-engage" par fan
  - Bouton "Bulk Re-engage" pour sélection multiple
  - Stats: total at-risk, avg churn rate, retention rate
  - _Requirements: 4.4_

- [x] 2.3 Créer page Upsells (`/analytics/upsells`)
  - Liste opportunités upsell (API `/api/revenue/upsells`)
  - Composant UpsellOpportunity avec détails
  - Bouton "Send" pour envoyer suggestion
  - Bouton "Dismiss" pour ignorer
  - Configuration automation (toggle on/off)
  - _Requirements: 4.5_

- [x] 2.4 Créer page Forecast (`/analytics/forecast`)
  - Graphique forecast revenue (Recharts)
  - Composant MonthProgress (current vs projected)
  - Composant GoalAchievement (objectifs)
  - Scénarios "what-if" (add X subscribers, post Y PPV)
  - _Requirements: 4.6_

- [x] 2.5 Créer page Payouts (`/analytics/payouts`)
  - Liste payouts multi-plateformes (API `/api/revenue/payouts`)
  - Composant PayoutTimeline (upcoming payouts)
  - Tax estimate calculator
  - Export button pour comptable (CSV/PDF)
  - _Requirements: 4.7_

---

## Phase 3: Marketing & Social Hub (Semaine 3-4)

- [ ] 3. Créer Marketing Campaigns Backend
- [x] 3.1 Créer API routes campaigns
  - `POST /api/marketing/campaigns` - Create campaign
  - `GET /api/marketing/campaigns` - List campaigns
  - `GET /api/marketing/campaigns/[id]` - Get campaign
  - `PUT /api/marketing/campaigns/[id]` - Update campaign
  - `DELETE /api/marketing/campaigns/[id]` - Delete campaign
  - `POST /api/marketing/campaigns/[id]/launch` - Launch campaign
  - _Requirements: 5.3, 5.4, 5.10_

- [x] 3.2 Créer data model Campaign
  - Table `campaigns` dans PostgreSQL
  - Migration script
  - Zod schema pour validation
  - TypeScript interface
  - _Requirements: 5.3, 5.4_

- [x] 3.3 Créer hook `useMarketingCampaigns`
  - Fetch campaigns avec SWR
  - Fonction `createCampaign`
  - Fonction `launchCampaign`
  - Fonction `deleteCampaign`
  - Auto-refresh après mutations
  - _Requirements: 5.3, 5.4_

- [x] 4. Créer Marketing Campaigns Frontend
- [x] 4.1 Créer page Marketing overview (`/marketing`)
  - Stats cards (Active Campaigns, Total Sent, Avg Open Rate, Conversions)
  - Liste campaigns avec status badges
  - Bouton "Create Campaign"
  - Filtres (status, channel, goal)
  - _Requirements: 5.3, 5.10_

- [x] 4.2 Créer page New Campaign (`/marketing/campaigns/new`)
  - Formulaire création campaign
  - Champs: name, goal, channel, audience, message
  - Audience selector (segment, RFM, custom)
  - Message template selector
  - Preview message
  - Bouton "Create" et "Save as Draft"
  - _Requirements: 5.3, 5.4, 5.7_

- [x] 4.3 Créer page Campaign Details (`/marketing/campaigns/[id]`)
  - Afficher détails campaign
  - Stats en temps réel (sent, open rate, click rate, conversion)
  - Liste des recipients
  - Bouton "Launch" si draft
  - Bouton "Duplicate"
  - _Requirements: 5.10_

- [x] 5. Créer Social Media Hub
- [x] 5.1 Créer page Social overview (`/marketing/social`)
  - Cards par plateforme (Instagram, TikTok, Reddit, Threads)
  - Status connexion OAuth
  - Bouton "Connect" si non connecté
  - Stats par plateforme (followers, posts, engagement)
  - _Requirements: 5.1, 5.6_

- [x] 5.2 Créer page Instagram (`/marketing/social/instagram`)
  - Afficher profil Instagram
  - Liste posts récents
  - Analytics (reach, impressions, engagement)
  - Bouton "Publish New Post"
  - _Requirements: 5.1, 5.2, 5.6_

- [x] 5.3 Créer page TikTok (`/marketing/social/tiktok`)
  - Afficher profil TikTok
  - Liste videos récentes
  - Analytics (views, likes, shares)
  - Bouton "Publish New Video"
  - _Requirements: 5.1, 5.2, 5.6_

- [x] 5.4 Créer page Reddit (`/marketing/social/reddit`)
  - Afficher subreddits connectés
  - Liste posts récents
  - Analytics (upvotes, comments)
  - Bouton "Create Post"
  - _Requirements: 5.1, 5.2, 5.6_

- [x] 6. Créer Content Calendar
- [x] 6.1 Créer page Calendar (`/marketing/calendar`)
  - Vue calendrier mensuel (react-big-calendar ou similaire)
  - Afficher scheduled content par jour
  - Color coding par plateforme
  - Drag & drop pour reschedule
  - Bouton "Add Content" sur date
  - _Requirements: 5.5_

- [x] 6.2 Intégrer avec Content Hub
  - Fetch scheduled content depuis `/api/content?status=scheduled`
  - Afficher dans calendar view
  - Click sur content → ouvre modal détails
  - Reschedule → update via `/api/content/[id]`
  - _Requirements: 5.5_

---

## Phase 4: Unified Inbox (Semaine 5)

- [x] 7. Créer Unified Inbox Backend
- [x] 7.1 Créer API route unified messages
  - `GET /api/messages/unified` - Aggregate messages from all platforms
  - Query params: platform, filter, limit, offset
  - Fetch from OnlyFans, Instagram, TikTok, Reddit en parallèle
  - Normaliser format
  - Sort by date (most recent first)
  - _Requirements: 7.1, 7.2_

- [x] 7.2 Créer hook `useUnifiedMessages`
  - Fetch messages avec SWR
  - Auto-refresh every 30s
  - Fonction `markAsRead`
  - Fonction `sendReply`
  - Fonction `starMessage`
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 8. Créer Unified Inbox Frontend
- [x] 8.1 Créer page Messages overview (`/messages`)
  - Layout 3 colonnes (platforms, threads, conversation)
  - Colonne 1: Platform selector avec unread count
  - Colonne 2: Thread list avec preview
  - Colonne 3: Conversation view
  - _Requirements: 7.1, 7.2_

- [x] 8.2 Créer composant ThreadList
  - Liste threads avec avatar, name, preview, date
  - Badge unread count
  - Star icon pour favoris
  - Priority badge (high, normal, low)
  - Click → ouvre conversation
  - _Requirements: 7.2, 7.5, 7.6_

- [x] 8.3 Créer composant ConversationView
  - Afficher messages du thread
  - Bubble layout (sender vs receiver)
  - Media preview (images, videos)
  - Timestamp
  - Read receipts
  - _Requirements: 7.3_

- [x] 8.4 Créer composant MessageComposer
  - Textarea pour message
  - AI suggestions dropdown (CIN AI)
  - Quick replies selector
  - Media upload button
  - Send button
  - _Requirements: 7.3, 7.4, 7.7_

- [x] 8.5 Intégrer CIN AI suggestions
  - Fetch suggestions depuis `/api/ai/suggestions`
  - Afficher 3-5 suggestions personnalisées
  - Click suggestion → insert dans composer
  - Sentiment analysis badge
  - _Requirements: 7.4, 8.1_

---

## Phase 5: OnlyFans Suite Improvements (Semaine 6)

- [ ] 9. Améliorer OnlyFans Dashboard
- [x] 9.1 Créer page Fans (`/onlyfans/fans`)
  - Liste fans avec RFM segmentation
  - Filtres (VIP, Active, At-Risk, Churned)
  - Search par nom
  - Click fan → ouvre profil détaillé
  - _Requirements: 6.4_

- [x] 9.2 Créer page Fan Profile (`/onlyfans/fans/[id]`)
  - Afficher profil fan (avatar, name, tier)
  - Stats (LTV, ARPU, last active, messages sent)
  - Purchase history
  - Message history
  - Bouton "Send Message"
  - Bouton "Add to Segment"
  - _Requirements: 6.4_

- [x] 9.3 Créer page PPV Management (`/onlyfans/ppv`)
  - Liste PPV content
  - Stats par PPV (sent, opened, purchased, revenue)
  - Bouton "Create PPV"
  - Filtres (status, date, revenue)
  - _Requirements: 6.5_

- [x] 9.4 Créer page Mass Messaging (`/onlyfans/messages/mass`)
  - Formulaire mass message
  - Audience selector (segment, RFM, custom)
  - Message composer avec variables ({{name}}, {{tier}})
  - Preview avec sample fans
  - Schedule send (now, later, recurring)
  - _Requirements: 6.3_

- [x] 9.5 Créer page Welcome Messages (`/onlyfans/settings/welcome`)
  - Liste welcome message templates
  - Bouton "Create Template"
  - Toggle automation on/off
  - Preview template
  - Test send
  - _Requirements: 6.6_

---

## Phase 6: Polish & Optimization (Semaine 6)

- [ ] 10. Performance Optimization
- [x] 10.1 Implémenter Redis caching
  - Cache dashboard data (5 min TTL)
  - Cache analytics data (10 min TTL)
  - Cache campaigns data (2 min TTL)
  - Cache messages data (30s TTL)
  - _Requirements: 9.3, 9.11_

- [x] 10.2 Implémenter lazy loading
  - Lazy load TrendChart component
  - Lazy load RevenueForecastChart component
  - Lazy load Calendar component
  - Lazy load heavy modals
  - _Requirements: 9.11_

- [x] 10.3 Implémenter pagination
  - Paginate campaigns list (20 per page)
  - Paginate messages list (50 per page)
  - Paginate fans list (50 per page)
  - Infinite scroll pour threads
  - _Requirements: 9.11_

- [ ] 11. Testing
- [ ] 11.1 Écrire tests d'intégration API
  - Test `/api/dashboard` aggregation
  - Test `/api/marketing/campaigns` CRUD
  - Test `/api/messages/unified` aggregation
  - Test error scenarios
  - _Requirements: 9.11, 9.14_

- [ ] 11.2 Écrire tests E2E critiques
  - Test dashboard load avec vraies données
  - Test campaign creation flow
  - Test unified inbox message send
  - Test OnlyFans mass messaging
  - _Requirements: 9.11, 9.14_

- [ ] 12. Documentation
- [ ] 12.1 Documenter APIs
  - OpenAPI spec pour toutes les routes
  - Exemples de requêtes/réponses
  - Error codes documentation
  - _Requirements: 9.11_

- [ ] 12.2 Créer guide utilisateur
  - Guide navigation plateforme
  - Guide création campaign
  - Guide unified inbox
  - Guide OnlyFans suite
  - _Requirements: 1.1_

---

## Résumé par Phase

### Phase 1: Foundation (Semaine 1)
- **Tâches:** 4 tasks principales
- **Effort:** 5 jours
- **Livrable:** Nouveau layout avec 6 sections, pages existantes migrées

### Phase 2: Analytics (Semaine 2)
- **Tâches:** 5 pages détaillées
- **Effort:** 5 jours
- **Livrable:** Pages Pricing, Churn, Upsells, Forecast, Payouts complètes

### Phase 3: Marketing & Social (Semaines 3-4)
- **Tâches:** 6 sections (Backend + Frontend)
- **Effort:** 10 jours
- **Livrable:** Marketing campaigns, Social media hub, Content calendar

### Phase 4: Unified Inbox (Semaine 5)
- **Tâches:** 2 sections (Backend + Frontend)
- **Effort:** 5 jours
- **Livrable:** Inbox unifiée multi-plateformes avec CIN AI

### Phase 5: OnlyFans (Semaine 6)
- **Tâches:** 5 pages améliorées
- **Effort:** 5 jours
- **Livrable:** Fans management, PPV, Mass messaging, Welcome messages

### Phase 6: Polish (Semaine 6)
- **Tâches:** 3 sections (Performance, Tests, Docs)
- **Effort:** 3 jours
- **Livrable:** Caching, lazy loading, tests, documentation

---

## Métriques de Succès

### Technique
- ✅ 0 erreurs TypeScript
- ✅ API response time < 200ms (p95)
- ✅ Page load time < 2s (p95)
- ✅ Cache hit rate > 80%
- ✅ Test coverage > 70%

### Fonctionnel
- ✅ Toutes les pages utilisent vraies données (pas de mock)
- ✅ Navigation claire en 6 sections
- ✅ Unified inbox agrège toutes les plateformes
- ✅ Marketing campaigns fonctionnels
- ✅ OnlyFans suite complète

---

## Notes Importantes

**Vraies Données:**
- Toutes les UIs doivent fetch depuis les APIs backend
- Pas de mock data hardcodé
- Loading states pendant fetch
- Error handling avec fallbacks

**Backends Existants:**
- 85% du backend est déjà codé
- Réutiliser au maximum les APIs existantes
- Créer seulement les nouveaux endpoints nécessaires

**Performance:**
- Implémenter caching Redis dès le début
- Lazy load les composants lourds
- Paginer les listes longues

**Tests:**
- Tous les tests sont obligatoires pour garantir la qualité
- Tests d'intégration API pour chaque endpoint
- Tests E2E pour les flows critiques

---

**Document créé par:** Kiro AI Assistant  
**Date:** 13 Novembre 2025  
**Version:** 1.0
