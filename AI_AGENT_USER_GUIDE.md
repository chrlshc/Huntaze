# 👤 AI Agent System - User Guide

## 🚀 Getting Started

### Accéder à l'Assistant AI

1. Naviguer vers: `http://localhost:3000/ai/assistant` (ou votre URL de production)
2. Se connecter si nécessaire (authentication requise)
3. L'interface de l'assistant AI s'affiche

### Interface Overview

L'interface est divisée en 3 sections:

```
┌─────────────┬──────────────────┬─────────────┐
│   Agents    │   Conversation   │   Actions   │
│   Panel     │      Area        │   Rapides   │
│             │                  │             │
│  5 agents   │  Chat interface  │ 12 actions  │
│  38 actions │  Messages        │  Par        │
│             │  Historique      │  catégorie  │
└─────────────┴──────────────────┴─────────────┘
```

## 💬 Utiliser le Langage Naturel

### Comment ça marche

Tapez simplement votre demande en langage naturel dans la zone de texte en bas de la conversation.

### Exemples de Requêtes

#### OnlyFans CRM
```
"Get my fan statistics"
"Show me my top 10 fans"
"Create a new messaging campaign"
"How many active fans do I have?"
"Send a message to all my fans"
```

#### Content Creation
```
"Generate a caption for Instagram about beach sunset"
"Suggest hashtags for fitness content"
"Create a new content piece for TikTok"
"Help me write a caption with a casual tone"
"What hashtags are trending for lifestyle content?"
```

#### Social Media
```
"Show me my social media statistics"
"Publish this video to TikTok"
"What are the trending hashtags on Instagram?"
"Analyze my social media performance"
"Post to Instagram feed"
```

#### Analytics
```
"Show me my analytics overview"
"Generate a report for the last 30 days"
"What are my growth trends?"
"Compare my platform performance"
"Track my audience growth"
```

#### Multi-Agent (Complexe)
```
"Create a TikTok post about beach sunset and publish it"
"Analyze my fans and create a targeted campaign"
"Generate a caption and optimize it for Instagram"
"Show me my stats and suggest improvements"
```

### Tips pour de Meilleures Requêtes

✅ **Soyez spécifique**: "Generate a caption for Instagram about beach sunset with a casual tone"
✅ **Incluez le contexte**: "Show me my fan stats for the last 30 days"
✅ **Utilisez des verbes d'action**: "Create", "Generate", "Show", "Analyze"
✅ **Mentionnez la plateforme**: "for Instagram", "on TikTok", "to Reddit"

❌ **Évitez les requêtes vagues**: "Help me"
❌ **Évitez les questions trop larges**: "What should I do?"

## ⚡ Utiliser les Quick Actions

### Qu'est-ce que c'est?

Les Quick Actions sont des raccourcis pour exécuter des actions spécifiques sans taper de texte.

### Comment les utiliser

1. Regarder le panneau de droite "Quick Actions"
2. Choisir une catégorie (OnlyFans, Content, Social, Analytics)
3. Cliquer sur le bouton de l'action désirée
4. L'action s'exécute immédiatement
5. Les résultats s'affichent dans la conversation

### Actions Disponibles

#### OnlyFans CRM (3 actions)
- **Fan Stats**: Obtenir vos statistiques de fans
- **Recent Fans**: Voir vos 10 derniers fans
- **New Campaign**: Créer une nouvelle campagne de messages

#### Content Creation (3 actions)
- **Generate Caption**: Générer une caption pour Instagram
- **Suggest Hashtags**: Obtenir des suggestions de hashtags
- **Create Content**: Créer un nouveau contenu

#### Social Media (3 actions)
- **Social Stats**: Voir vos statistiques sur toutes les plateformes
- **Trending Tags**: Obtenir les hashtags tendance
- **Performance**: Analyser vos performances

#### Analytics (3 actions)
- **Overview**: Vue d'ensemble de vos métriques
- **Generate Report**: Créer un rapport pour les 30 derniers jours
- **Track Growth**: Suivre votre croissance

## 🤖 Comprendre les Agents

### Les 5 Agents Spécialisés

#### 1. OnlyFans CRM Agent (8 actions)
**Spécialité**: Gestion de vos fans OnlyFans

**Actions disponibles**:
- Get Fans
- Send Message
- Create Campaign
- Get Fan Stats
- Import Fans CSV
- Schedule Message
- Get Conversations
- Analyze Fan Engagement

**Quand l'utiliser**: Pour tout ce qui concerne vos fans OnlyFans

#### 2. Content Creation Agent (10 actions)
**Spécialité**: Création et optimisation de contenu

**Actions disponibles**:
- Create Content
- Generate Caption
- Suggest Hashtags
- Upload Media
- Edit Image
- Edit Video
- Optimize For Platform
- Schedule Content
- Create Variation
- Apply Template

**Quand l'utiliser**: Pour créer, éditer ou optimiser du contenu

#### 3. Social Media Agent (8 actions)
**Spécialité**: Publication et gestion des réseaux sociaux

**Actions disponibles**:
- Publish TikTok
- Publish Instagram
- Publish Reddit
- Get Social Stats
- Connect Platform
- Schedule Post
- Get Trending Hashtags
- Analyze Performance

**Quand l'utiliser**: Pour publier ou analyser vos réseaux sociaux

#### 4. Analytics Agent (7 actions)
**Spécialité**: Analyse et rapports

**Actions disponibles**:
- Get Overview
- Generate Report
- Analyze Trends
- Compare Platforms
- Get Audience Insights
- Track Growth
- Export Data

**Quand l'utiliser**: Pour comprendre vos performances et tendances

#### 5. Coordinator Agent (5 actions)
**Spécialité**: Orchestration de workflows complexes

**Actions disponibles**:
- Plan Campaign
- Execute Workflow
- Optimize Strategy
- Automate Routine
- Cross Platform Sync

**Quand l'utiliser**: Pour des tâches complexes impliquant plusieurs agents

### Comment le Système Choisit les Agents

Quand vous envoyez une requête en langage naturel:

1. **Intent Analysis**: GPT-4o analyse votre intention
2. **Agent Selection**: Le système détermine quel(s) agent(s) utiliser
3. **Action Planning**: GPT-4o crée un plan d'exécution
4. **Execution**: Les actions sont exécutées séquentiellement
5. **Response**: GPT-4o génère une réponse conversationnelle

### Voir les Agents Actifs

Dans le panneau de gauche "AI Agents":
- Cliquer sur un agent pour voir ses actions
- L'agent utilisé pour votre dernière requête est surligné
- Le nombre d'actions disponibles est affiché

## 📊 Comprendre les Résultats

### Types de Résultats

#### 1. Texte Simple
Réponse conversationnelle de l'assistant.

**Exemple**:
```
"I've retrieved your fan statistics. You have 1,250 total fans..."
```

#### 2. Données Structurées
Résultats formatés avec icons et couleurs.

**Exemple**:
```
Total Fans: 👥 1,250
Active Fans: 👥 890
Revenue: 💰 $5,420
```

#### 3. Listes et Arrays
Affichage des premiers 5 éléments avec "... and X more items"

#### 4. JSON View
Pour les résultats complexes, cliquer sur l'icône expand pour voir le JSON complet.

### Actions sur les Résultats

- **Copy**: Copier le résultat dans le clipboard
- **Download**: Télécharger le résultat en JSON
- **Expand**: Voir le JSON brut

## ⌨️ Raccourcis Clavier

- **Enter**: Envoyer le message
- **Shift + Enter**: Nouvelle ligne dans le message
- **Esc**: Effacer le champ de saisie (à implémenter)

## 🔍 Suggestions Rapides

Quand le champ de saisie est vide, 5 suggestions rapides s'affichent:

1. "Get my fan stats"
2. "Generate a caption for Instagram"
3. "Show my analytics overview"
4. "Create a TikTok post"
5. "Help me with content ideas"

Cliquer sur une suggestion pour la copier dans le champ.

## 💡 Tips & Best Practices

### Pour de Meilleurs Résultats

1. **Soyez précis**: Plus votre requête est précise, meilleur sera le résultat
2. **Utilisez le contexte**: Mentionnez la plateforme, le ton, le sujet
3. **Testez les Quick Actions**: Plus rapide pour les actions courantes
4. **Explorez les agents**: Cliquez sur les agents pour voir toutes leurs capacités
5. **Lisez les résultats**: Les résultats contiennent souvent des suggestions

### Quand Utiliser Quoi

**Natural Language** → Pour des requêtes complexes ou exploratoires
**Quick Actions** → Pour des actions répétitives ou simples
**Agent Panel** → Pour découvrir les capacités disponibles

### Gestion des Erreurs

Si une erreur se produit:
1. Lisez le message d'erreur
2. Vérifiez votre connexion
3. Essayez de reformuler votre requête
4. Utilisez une Quick Action à la place
5. Contactez le support si le problème persiste

## 📱 Utilisation Mobile

L'interface est responsive et fonctionne sur mobile:

- **Agent Panel**: Scroll horizontal ou collapse
- **Conversation**: Pleine largeur
- **Quick Actions**: Scroll vertical
- **Input**: Clavier mobile optimisé

## 🆘 Support

### Problèmes Communs

**"Authentication required"**
→ Vous devez être connecté pour utiliser l'assistant

**"Failed to load agents"**
→ Rafraîchir la page ou vérifier votre connexion

**"Request failed"**
→ Réessayer ou reformuler votre requête

**Résultats inattendus**
→ Soyez plus spécifique dans votre requête

### Obtenir de l'Aide

1. Essayez de reformuler votre requête
2. Utilisez les Quick Actions
3. Consultez ce guide
4. Contactez le support technique

## 🎯 Exemples d'Utilisation

### Scénario 1: Créer et Publier du Contenu

```
1. "Generate a caption for Instagram about beach sunset with a casual tone"
2. Copier la caption générée
3. "Publish this to Instagram feed"
4. Confirmer la publication
```

### Scénario 2: Analyser et Optimiser

```
1. Cliquer sur "Analytics Overview" (Quick Action)
2. Lire les métriques
3. "What can I do to improve my engagement?"
4. Suivre les suggestions
```

### Scénario 3: Gérer les Fans

```
1. Cliquer sur "Fan Stats" (Quick Action)
2. "Show me my top 10 spenders"
3. "Create a campaign targeting high spenders"
4. Configurer la campagne
```

---

**Besoin d'aide?** Tapez simplement "Help" dans la conversation! 🤝
