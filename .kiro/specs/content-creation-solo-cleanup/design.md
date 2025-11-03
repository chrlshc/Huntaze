# Design Document - Content Creation Solo Cleanup

## Overview

Cette spec vise à simplifier le système de création de contenu en supprimant toutes les fonctionnalités de collaboration (partage, commentaires, révisions, présence en temps réel) qui ne sont pas nécessaires pour une beta solo. L'objectif est de créer une version allégée et optimisée pour les créateurs individuels.

## Architecture

### Composants à Supprimer

1. **Real-time Collaboration**
   - WebSocket server pour la présence
   - Indicateurs de présence
   - Synchronisation en temps réel

2. **Commenting System**
   - Threads de commentaires
   - Système de résolution
   - Notifications de commentaires

3. **Content Sharing**
   - Gestion des collaborateurs
   - Système de permissions
   - Invitations par email

4. **Revision History**
   - Historique automatique des révisions
   - Comparaison de versions
   - Restauration de versions

### Composants à Conserver

1. **Core Content Creation**
   - Éditeur de texte riche
   - Upload et gestion de médias
   - Templates et AI assistance

2. **Platform Optimization**
   - Prévisualisation multi-plateforme
   - Validation de contenu
   - Optimisation automatique

3. **Scheduling & Publishing**
   - Calendrier de contenu
   - Publication programmée
   - Métriques de performance

## Database Schema Changes

### Tables à Supprimer
```sql
DROP TABLE IF EXISTS content_collaborators;
DROP TABLE IF EXISTS content_comments;
DROP TABLE IF EXISTS content_revisions;
DROP TABLE IF EXISTS collaboration_sessions;
```

### Colonnes à Supprimer
```sql
ALTER TABLE content_items 
DROP COLUMN IF EXISTS shared_with,
DROP COLUMN IF EXISTS collaboration_enabled,
DROP COLUMN IF EXISTS last_collaborator_id;
```

### Optimisations
- Simplifier les index pour les requêtes single-user
- Supprimer les contraintes de permissions complexes
- Optimiser les requêtes pour un seul propriétaire

## API Endpoints Changes

### Endpoints à Supprimer
- `POST /api/content/[id]/collaborators`
- `GET /api/content/[id]/collaborators`
- `DELETE /api/content/[id]/collaborators/[userId]`
- `POST /api/content/[id]/comments`
- `GET /api/content/[id]/comments`
- `PUT /api/content/comments/[commentId]`
- `DELETE /api/content/comments/[commentId]`
- `GET /api/content/[id]/revisions`
- `POST /api/content/[id]/revisions`
- `GET /api/content/revisions/[revisionId]`
- `POST /api/content/revisions/[revisionId]/restore`
- `DELETE /api/content/revisions/[revisionId]`
- `GET /api/socket/presence`
- `POST /api/socket/presence`

### Endpoints à Simplifier
- `GET /api/content` - Supprimer les filtres de collaboration
- `POST /api/content` - Supprimer les options de partage
- `PUT /api/content/[id]` - Supprimer les checks de permissions

## UI Components Changes

### Composants à Supprimer
- `CollaboratorManager.tsx`
- `CommentThread.tsx`
- `CommentableText.tsx`
- `RevisionHistory.tsx`
- `RevisionComparison.tsx`
- `PresenceIndicators.tsx`
- `CollaborativeEditor.tsx`

### Hooks à Supprimer
- `useComments.ts`
- `useRevisions.ts`
- `usePresence.ts`

### Services à Supprimer
- `collaborationEmailService.ts`
- `presenceService.ts`
- `revisionService.ts`

### Pages à Supprimer
- `app/content/collaborate/[token]/page.tsx`
- `app/content/edit/[id]/page.tsx` (si spécifique à la collaboration)

## Migration Strategy

### Phase 1: Data Backup
1. Créer un backup complet de la base de données
2. Exporter les données de collaboration importantes
3. Sauvegarder les fichiers de révision

### Phase 2: Code Cleanup
1. Supprimer les composants UI de collaboration
2. Nettoyer les API endpoints
3. Supprimer les services et workers
4. Mettre à jour les imports et références

### Phase 3: Database Migration
1. Créer un script de migration pour supprimer les tables
2. Nettoyer les colonnes inutiles
3. Optimiser les index pour single-user
4. Tester l'intégrité des données

### Phase 4: Testing & Validation
1. Tester toutes les fonctionnalités core
2. Vérifier que les données sont préservées
3. Valider les performances améliorées
4. Tester l'expérience utilisateur simplifiée

## Performance Improvements

### Database Optimizations
- Requêtes plus simples sans joins complexes
- Index optimisés pour single-user queries
- Suppression des checks de permissions coûteux

### Frontend Optimizations
- Bundle size réduit sans les composants de collaboration
- Moins de state management complexe
- Interface plus réactive

### Backend Optimizations
- Moins d'endpoints à maintenir
- Logique métier simplifiée
- Moins de workers en arrière-plan

## Error Handling

### Migration Errors
- Rollback automatique en cas d'échec
- Validation des données avant suppression
- Logs détaillés pour debugging

### Runtime Errors
- Gestion gracieuse des références manquantes
- Messages d'erreur clairs pour l'utilisateur
- Fallbacks pour les fonctionnalités supprimées

## Testing Strategy

### Unit Tests
- Tester les nouvelles API simplifiées
- Valider la migration de données
- Tester les composants UI modifiés

### Integration Tests
- Workflow complet de création de contenu
- Upload et gestion de médias
- Scheduling et publication

### Performance Tests
- Mesurer l'amélioration des temps de réponse
- Tester la charge avec moins de complexité
- Valider l'utilisation mémoire réduite