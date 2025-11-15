# Requirements Document - Huntaze Platform Reorganization

## Introduction

Ce document définit les exigences pour la réorganisation complète de la plateforme Huntaze. L'objectif est de créer une architecture claire, cohérente et scalable qui regroupe toutes les fonctionnalités existantes (Content, Analytics, Marketing, Social Media, OnlyFans, Messages, etc.) dans une structure logique et intuitive.

## Glossary

- **Huntaze Platform**: La plateforme SaaS complète pour créateurs de contenu
- **Creator**: L'utilisateur principal de la plateforme (créateur de contenu)
- **Content Hub**: Section centralisée pour la création et gestion de contenu
- **Analytics Dashboard**: Tableau de bord unifié pour toutes les métriques
- **Marketing Automation**: Système d'automatisation des campagnes marketing
- **Social Media Manager**: Gestionnaire multi-plateformes (Instagram, TikTok, Reddit)
- **OnlyFans Suite**: Suite complète d'outils spécifiques à OnlyFans
- **Revenue Optimization**: Système d'optimisation des revenus avec IA
- **CIN AI**: Intelligence artificielle conversationnelle de Huntaze
- **BFF Pattern**: Backend For Frontend - API agrégateur
- **AWS Infrastructure**: Infrastructure cloud Amazon Web Services

---

## Requirements

### Requirement 1: Architecture Unifiée

**User Story:** En tant que créateur, je veux une plateforme avec une navigation claire et cohérente, afin de trouver rapidement toutes les fonctionnalités dont j'ai besoin.

#### Acceptance Criteria

1. WHEN THE Creator accède à la plateforme, THE Huntaze Platform SHALL afficher une navigation principale avec 7 sections maximum
2. WHILE THE Creator navigue entre sections, THE Huntaze Platform SHALL maintenir un contexte visuel cohérent (header, sidebar, thème)
3. THE Huntaze Platform SHALL regrouper les fonctionnalités similaires sous des sections logiques
4. THE Huntaze Platform SHALL fournir un breadcrumb pour indiquer la position actuelle
5. WHERE THE Creator utilise mobile, THE Huntaze Platform SHALL adapter la navigation en menu hamburger

---

### Requirement 2: Dashboard Centralisé

**User Story:** En tant que créateur, je veux un dashboard unique qui agrège toutes mes métriques importantes, afin d'avoir une vue d'ensemble de mon activité en un coup d'œil.

#### Acceptance Criteria

1. THE Huntaze Platform SHALL afficher un dashboard avec métriques de revenue, fans, messages, et engagement
2. WHEN THE Creator sélectionne une période, THE Huntaze Platform SHALL mettre à jour toutes les métriques en temps réel
3. THE Huntaze Platform SHALL afficher des graphiques de tendances pour revenue et croissance fans
4. THE Huntaze Platform SHALL lister les 10 dernières activités récentes
5. THE Huntaze Platform SHALL fournir des quick actions contextuelles (Create Content, Launch Campaign, etc.)
6. THE Huntaze Platform SHALL rafraîchir automatiquement les données toutes les 60 secondes

---

### Requirement 3: Content Hub Complet

**User Story:** En tant que créateur, je veux gérer tout mon contenu (création, scheduling, publication) depuis un seul endroit, afin de gagner du temps et d'être plus organisé.

#### Acceptance Criteria

1. THE Content Hub SHALL permettre la création de contenu (image, video, text)
2. THE Content Hub SHALL supporter l'upload de media avec drag & drop
3. THE Content Hub SHALL permettre le scheduling avec calendar picker
4. THE Content Hub SHALL afficher le contenu filtré par status (draft, scheduled, published)
5. THE Content Hub SHALL permettre l'édition et suppression de contenu
6. THE Content Hub SHALL suggérer les meilleurs moments de publication par plateforme
7. THE Content Hub SHALL supporter la publication multi-plateformes (OnlyFans, Instagram, TikTok, Fansly)

---

### Requirement 4: Analytics & Revenue Optimization

**User Story:** En tant que créateur, je veux comprendre mes performances et optimiser mes revenus, afin de maximiser mes gains et fidéliser mes fans.

#### Acceptance Criteria

1. THE Analytics Dashboard SHALL afficher 6 métriques clés (ARPU, LTV, Churn Rate, Subscribers, Revenue, MoM Growth)
2. THE Analytics Dashboard SHALL fournir des sparklines pour visualiser les tendances
3. THE Revenue Optimization SHALL recommander des prix optimaux avec IA
4. THE Revenue Optimization SHALL identifier les fans à risque de churn
5. THE Revenue Optimization SHALL suggérer des opportunités d'upsell automatiques
6. THE Revenue Optimization SHALL prévoir les revenus futurs avec forecast
7. THE Revenue Optimization SHALL gérer les payouts multi-plateformes

---

### Requirement 5: Marketing & Social Media Hub

**User Story:** En tant que créateur, je veux gérer mes campagnes marketing et mes réseaux sociaux depuis un seul endroit, afin de maintenir une présence cohérente et automatiser mes actions sans effort manuel.

#### Acceptance Criteria

1. THE Marketing & Social Hub SHALL connecter Instagram, TikTok, Reddit, Threads avec OAuth
2. THE Marketing & Social Hub SHALL permettre la publication cross-platform depuis une interface unique
3. THE Marketing & Social Hub SHALL créer des campagnes (retention, upsell, reactivation) sur OnlyFans
4. THE Marketing & Social Hub SHALL segmenter automatiquement les audiences (RFM, custom)
5. THE Marketing & Social Hub SHALL afficher un calendar view pour le scheduling multi-plateformes
6. THE Marketing & Social Hub SHALL tracker les analytics par plateforme avec vraies données API
7. THE Marketing & Social Hub SHALL fournir des templates de messages pré-configurés
8. THE Marketing & Social Hub SHALL suggérer les meilleurs hashtags, captions, et timing avec IA
9. THE Marketing & Social Hub SHALL permettre le repost de contenu performant
10. THE Marketing & Social Hub SHALL tracker les métriques de campagnes (sent, open rate, conversion rate) avec vraies données

---

### Requirement 6: OnlyFans Suite

**User Story:** En tant que créateur OnlyFans, je veux des outils spécialisés pour gérer ma page, mes messages, et mes fans, afin d'optimiser mon activité sur cette plateforme principale.

#### Acceptance Criteria

1. THE OnlyFans Suite SHALL afficher un dashboard dédié avec métriques OnlyFans
2. THE OnlyFans Suite SHALL gérer l'inbox avec AI suggestions
3. THE OnlyFans Suite SHALL permettre le mass messaging avec personnalisation
4. THE OnlyFans Suite SHALL tracker les fans avec RFM segmentation
5. THE OnlyFans Suite SHALL gérer les PPV (Pay-Per-View) content
6. THE OnlyFans Suite SHALL automatiser les welcome messages
7. THE OnlyFans Suite SHALL intégrer le chatbot CIN AI

---

### Requirement 7: Messages & Inbox Unifié

**User Story:** En tant que créateur, je veux gérer tous mes messages (OnlyFans, Instagram, etc.) depuis une inbox unifiée, afin de ne jamais manquer une conversation importante.

#### Acceptance Criteria

1. THE Unified Inbox SHALL agréger les messages de toutes les plateformes
2. THE Unified Inbox SHALL afficher le nombre de messages non lus par plateforme
3. THE Unified Inbox SHALL permettre la réponse directe depuis l'interface
4. THE Unified Inbox SHALL suggérer des réponses avec CIN AI
5. THE Unified Inbox SHALL prioriser les messages des top fans
6. THE Unified Inbox SHALL permettre les filtres (platform, read/unread, priority)
7. THE Unified Inbox SHALL supporter les quick replies personnalisées

---

### Requirement 8: CIN AI Assistant

**User Story:** En tant que créateur, je veux un assistant IA qui m'aide à répondre aux messages, créer du contenu, et optimiser ma stratégie, afin d'être plus efficace et professionnel.

#### Acceptance Criteria

1. THE CIN AI SHALL suggérer des réponses personnalisées aux messages
2. THE CIN AI SHALL générer des captions pour le contenu
3. THE CIN AI SHALL recommander des prix optimaux
4. THE CIN AI SHALL identifier les opportunités d'upsell
5. THE CIN AI SHALL prédire le churn des fans
6. THE CIN AI SHALL suggérer les meilleurs moments de publication
7. THE CIN AI SHALL apprendre des préférences du créateur

---

### Requirement 9: Infrastructure AWS & Real Data

**User Story:** En tant que plateforme, je veux une infrastructure cloud robuste avec vraies données, afin de garantir la disponibilité, la performance, et des insights réels pour tous les créateurs.

#### Acceptance Criteria

1. THE AWS Infrastructure SHALL utiliser ECS Fargate pour les services backend
2. THE AWS Infrastructure SHALL utiliser RDS PostgreSQL pour la base de données avec vraies données
3. THE AWS Infrastructure SHALL utiliser ElastiCache Redis pour le caching
4. THE AWS Infrastructure SHALL utiliser S3 pour le stockage des media
5. THE AWS Infrastructure SHALL utiliser CloudFront CDN pour la distribution
6. THE AWS Infrastructure SHALL utiliser Lambda pour les workers asynchrones
7. THE AWS Infrastructure SHALL utiliser CloudWatch pour le monitoring avec vraies métriques
8. THE AWS Infrastructure SHALL implémenter auto-scaling basé sur la charge réelle
9. THE AWS Infrastructure SHALL garantir 99.9% uptime SLA
10. THE AWS Infrastructure SHALL chiffrer toutes les données au repos et en transit
11. THE Huntaze Platform SHALL utiliser UNIQUEMENT des vraies données API (pas de mock data)
12. THE Huntaze Platform SHALL connecter toutes les UIs aux APIs backend existantes
13. THE Huntaze Platform SHALL afficher des loading states pendant le fetch de vraies données
14. THE Huntaze Platform SHALL gérer les erreurs API avec fallbacks gracieux

---

## Summary

Cette spécification définit les exigences pour une plateforme Huntaze complète, unifiée, et scalable **avec vraies données uniquement**. L'architecture proposée regroupe toutes les fonctionnalités existantes dans une structure logique avec **6 sections principales**:

1. **Dashboard** - Vue d'ensemble unifiée avec vraies métriques
2. **Content** - Création et gestion de contenu multi-plateformes
3. **Analytics** - Métriques et revenue optimization avec vraies données
4. **Marketing & Social** - Automation, campagnes, et gestion multi-plateformes (Instagram, TikTok, Reddit, Threads)
5. **OnlyFans** - Suite spécialisée avec vraies données OF
6. **Messages** - Inbox unifiée multi-plateformes

**Principes clés:**
- ✅ **Vraies données uniquement** - Pas de mock data
- ✅ **APIs backend existantes** - Connecter ce qui existe déjà (85% du backend est prêt)
- ✅ **UX cohérente** - Navigation unifiée, design system, dark mode
- ✅ **Performance** - Loading states, error handling, caching
- ✅ **Scalabilité** - Infrastructure AWS robuste

Chaque section est conçue pour être intuitive, performante, et intégrée avec les autres via des APIs BFF et une infrastructure AWS robuste.
