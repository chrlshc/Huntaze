# Backend API Routes - Documentation Complète

## 📋 Vue d'ensemble

Ce document liste toutes les routes API backend créées pour l'application Huntaze, organisées par section fonctionnelle.

## ✅ Routes Créées

### 1. OnlyFans Section

#### `/api/onlyfans/subscribers`
- **GET** - Liste des abonnés avec pagination et filtres
  - Query params: `page`, `pageSize`, `tier`, `search`
  - Retourne: Liste paginée des abonnés avec compteurs de messages et transactions
  
- **POST** - Ajouter un nouvel abonné
  - Body: `{ username, email, tier?, onlyfansId? }`
  - Retourne: Abonné créé

#### `/api/onlyfans/earnings`
- **GET** - Données de revenus avec breakdown
  - Query params: `range` (week/month/year)
  - Retourne: Total earnings, breakdown par type, top spenders

### 2. Marketing Section

#### `/api/marketing/segments`
- **GET** - Liste des segments d'audience
  - Retourne: Segments avec compteur d'abonnés
  
- **POST** - Créer un nouveau segment
  - Body: `{ name, description, criteria }`
  - Retourne: Segment créé

#### `/api/marketing/automation`
- **GET** - Liste des règles d'automation
  - Retourne: Automations avec compteur d'exécutions
  
- **POST** - Créer une règle d'automation
  - Body: `{ name, description, trigger, actions, isActive?, priority? }`
  - Retourne: Automation créée

### 3. Content Creation Section

#### `/api/content/library`
- **GET** - Bibliothèque de contenu avec pagination
  - Query params: `page`, `pageSize`, `type`, `search`, `tags`
  - Retourne: Liste paginée de médias avec engagement
  
- **POST** - Upload de nouveau contenu
  - Body: `{ title, description, type, url, thumbnailUrl?, tags?, metadata? }`
  - Retourne: Média créé

#### `/api/content/ai-generate`
- **POST** - Génération de contenu AI
  - Body: `{ type, prompt, style?, length?, tone? }`
  - Retourne: Contenu généré avec quota restant
  - Limite: 50 générations/jour

### 4. Analytics Section

#### `/api/analytics/overview`
- **GET** - Vue d'ensemble des analytics
  - Query params: `range` (week/month/year)
  - Retourne: 
    - Overview (revenue, subscribers, messages, views) avec changements
    - Top content par engagement
    - Croissance des abonnés

### 5. Chatbot Section

#### `/api/chatbot/conversations`
- **GET** - Liste des conversations
  - Query params: `page`, `pageSize`, `status`
  - Retourne: Conversations paginées avec info abonné
  
- **POST** - Créer/récupérer une conversation
  - Body: `{ subscriberId, initialMessage? }`
  - Retourne: Conversation (existante ou nouvelle)

#### `/api/chatbot/auto-reply`
- **GET** - Récupérer les règles d'auto-réponse
  - Retourne: Liste des règles par priorité
  
- **POST** - Créer une règle d'auto-réponse
  - Body: `{ name, triggers, response, isActive?, priority?, conditions? }`
  - Retourne: Règle créée
  
- **PUT** - Traiter un message pour auto-réponse
  - Body: `{ messageId, content, subscriberId }`
  - Retourne: Réponse automatique si match trouvé

### 6. Management Section

#### `/api/management/settings`
- **GET** - Récupérer les paramètres utilisateur
  - Retourne: Settings (notifications, automation, privacy, billing)
  
- **PUT** - Mettre à jour les paramètres
  - Body: `{ settings }`
  - Retourne: Settings mis à jour

#### `/api/management/profile`
- **GET** - Récupérer le profil utilisateur
  - Retourne: Profil avec compteurs (subscribers, campaigns, media)
  
- **PUT** - Mettre à jour le profil
  - Body: `{ name?, bio?, website?, location?, onlyfansUsername?, image? }`
  - Retourne: Profil mis à jour

## 🔒 Sécurité

Toutes les routes implémentent :
- ✅ Authentification via Auth.js v5 (`auth()`)
- ✅ Validation des données d'entrée
- ✅ Gestion d'erreurs complète
- ✅ Messages d'erreur standardisés

## 📊 Format de Réponse Standardisé

### Succès
```json
{
  "success": true,
  "data": { ... },
  "metadata": { ... } // Pour les listes paginées
}
```

### Erreur
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur"
  }
}
```

## 🎯 Codes d'Erreur

- `UNAUTHORIZED` (401) - Authentification requise
- `VALIDATION_ERROR` (400) - Données invalides
- `NOT_FOUND` (404) - Ressource non trouvée
- `QUOTA_EXCEEDED` (429) - Quota dépassé
- `INTERNAL_ERROR` (500) - Erreur serveur

## ⚙️ Configuration

Toutes les routes utilisent :
```typescript
export const runtime = 'nodejs';
```

Ceci est requis pour l'utilisation de Prisma dans les API routes Next.js.

## 📝 Notes d'Implémentation

### Pagination
Les routes de liste supportent la pagination standard :
- `page` : Numéro de page (défaut: 1)
- `pageSize` : Taille de page (défaut: 20)

### Filtres
Les routes supportent des filtres spécifiques :
- Recherche textuelle (`search`)
- Filtres par type/statut
- Filtres par tags
- Filtres par date range

### Relations Prisma
Les routes incluent les relations nécessaires via `include` et `select` pour optimiser les requêtes.

## 🚀 Prochaines Étapes

1. Connecter ces routes au frontend
2. Ajouter des tests d'intégration
3. Implémenter le rate limiting
4. Ajouter la documentation OpenAPI
5. Configurer le monitoring et les logs

## 📚 Ressources

- [Auth.js v5 Documentation](https://authjs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Date de création**: 2025-01-30
**Version**: 1.0.0
**Statut**: ✅ Complet
