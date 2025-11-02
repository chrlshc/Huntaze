# 🧪 AI Agent System - Testing Guide

## Quick Start

### 1. Configuration

Ajouter votre clé OpenAI dans `.env`:

```bash
# Copier .env.example vers .env
cp .env.example .env

# Éditer .env et ajouter votre clé
OPENAI_API_KEY=sk-your-actual-openai-key-here
OPENAI_MODEL=gpt-4o
```

### 2. Démarrer le serveur

```bash
npm run dev
```

### 3. Accéder à l'interface

Naviguer vers: `http://localhost:3000/ai/assistant`

## 🧪 Tests Manuels

### Test 1: Natural Language Processing

Essayer ces requêtes dans la zone de texte:

```
"Get my fan stats"
"Show me my analytics overview"
"Generate a caption for Instagram about beach sunset"
"Create a TikTok post"
"What are my social media statistics?"
```

**Résultat attendu**:
- Le système analyse l'intent
- Détermine quel(s) agent(s) utiliser
- Exécute les actions
- Retourne une réponse conversationnelle

### Test 2: Quick Actions

Cliquer sur les boutons Quick Actions:

**OnlyFans CRM**:
- Fan Stats
- Recent Fans
- New Campaign

**Content Creation**:
- Generate Caption
- Suggest Hashtags
- Create Content

**Social Media**:
- Social Stats
- Trending Tags
- Performance

**Analytics**:
- Overview
- Generate Report
- Track Growth

**Résultat attendu**:
- L'action s'exécute immédiatement
- Les résultats s'affichent dans ActionResultViewer
- Format lisible avec option JSON view

### Test 3: Agent Panel

1. Cliquer sur un agent dans le panneau de gauche
2. Observer l'expansion pour voir les actions disponibles
3. Vérifier que les 5 agents sont listés:
   - OnlyFans CRM (8 actions)
   - Content Creator (10 actions)
   - Social Media (8 actions)
   - Analytics (7 actions)
   - Coordinator (5 actions)

### Test 4: Error Handling

Tester les scénarios d'erreur:

1. **Sans authentification**:
   - Se déconnecter
   - Essayer d'accéder à `/ai/assistant`
   - Devrait rediriger vers login

2. **Requête invalide**:
   - Envoyer un message vide
   - Devrait être désactivé

3. **Action inexistante**:
   - Modifier le code pour appeler une action qui n'existe pas
   - Devrait retourner une erreur 404

### Test 5: UI/UX

1. **Responsive Design**:
   - Tester sur desktop (1920x1080)
   - Tester sur tablet (768x1024)
   - Tester sur mobile (375x667)
   - Vérifier que le layout s'adapte

2. **Keyboard Shortcuts**:
   - Taper un message
   - Appuyer sur Enter → devrait envoyer
   - Taper un message
   - Appuyer sur Shift+Enter → devrait ajouter une nouvelle ligne

3. **Loading States**:
   - Envoyer un message
   - Observer le typing indicator
   - Vérifier que le bouton Send est désactivé pendant le chargement

4. **Auto-scroll**:
   - Envoyer plusieurs messages
   - Vérifier que la conversation scroll automatiquement vers le bas

## 🔍 Tests API

### Test GET /api/ai/agents

```bash
curl http://localhost:3000/api/ai/agents
```

**Résultat attendu**:
```json
{
  "agents": [
    {
      "key": "onlyfans-crm",
      "name": "OnlyFans CRM Agent",
      "description": "...",
      "actions": ["get_fans", "send_message", ...]
    },
    ...
  ],
  "totalAgents": 5,
  "capabilities": 38
}
```

### Test POST /api/ai/agents (Natural Language)

```bash
curl -X POST http://localhost:3000/api/ai/agents \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get my fan stats",
    "context": {
      "currentPage": "/dashboard",
      "userRole": "creator"
    }
  }'
```

**Résultat attendu**:
```json
{
  "type": "natural_language",
  "message": "Here are your fan statistics...",
  "timestamp": "2025-11-01T..."
}
```

### Test POST /api/ai/agents (Direct Action)

```bash
curl -X POST http://localhost:3000/api/ai/agents \
  -H "Content-Type: application/json" \
  -d '{
    "directAction": {
      "agentKey": "onlyfans-crm",
      "action": "get_fan_stats",
      "params": {}
    }
  }'
```

**Résultat attendu**:
```json
{
  "type": "direct_action",
  "agentKey": "onlyfans-crm",
  "action": "get_fan_stats",
  "result": {
    "totalFans": 1250,
    "activeFans": 890,
    "topSpenders": [...]
  },
  "timestamp": "2025-11-01T..."
}
```

## 📊 Vérifications

### Checklist Fonctionnelle

- [ ] Page `/ai/assistant` accessible
- [ ] Authentication requise
- [ ] Agents chargés au mount
- [ ] Messages envoyés avec succès
- [ ] Quick Actions fonctionnent
- [ ] Résultats affichés correctement
- [ ] Erreurs gérées gracieusement
- [ ] Loading states visibles
- [ ] Auto-scroll fonctionne
- [ ] Responsive sur mobile

### Checklist Performance

- [ ] Intent analysis < 2 secondes
- [ ] Task execution < 3 secondes
- [ ] Response generation < 2 secondes
- [ ] Total request < 7 secondes
- [ ] UI responsive (pas de lag)

### Checklist Sécurité

- [ ] Authentication vérifiée
- [ ] User ID extrait de session
- [ ] Pas de user ID dans le body
- [ ] Erreurs ne révèlent pas de détails internes
- [ ] Validation des paramètres

## 🐛 Debugging

### Logs à vérifier

1. **Console Browser**:
   - Erreurs JavaScript
   - Requêtes API
   - Réponses API

2. **Console Server**:
   - Intent analysis results
   - Task execution logs
   - OpenAI API calls
   - Erreurs backend

3. **Network Tab**:
   - Status codes
   - Request/Response payloads
   - Timing

### Problèmes Communs

**Problème**: "Authentication required"
**Solution**: Se connecter avec NextAuth

**Problème**: "Failed to load agents"
**Solution**: Vérifier que le serveur est démarré

**Problème**: "OpenAI API error"
**Solution**: Vérifier OPENAI_API_KEY dans .env

**Problème**: "Agent not found"
**Solution**: Vérifier que l'agent key est correct

## 📝 Rapport de Test

Après les tests, documenter:

1. **Tests réussis**: Liste des fonctionnalités qui marchent
2. **Tests échoués**: Liste des bugs trouvés
3. **Performance**: Temps de réponse mesurés
4. **UX**: Feedback sur l'expérience utilisateur
5. **Suggestions**: Améliorations possibles

## 🚀 Next Steps

Après validation des tests manuels:

1. Implémenter les actions réelles des agents (Task 2-6)
2. Ajouter des tests automatisés (Task 11-12)
3. Optimiser les performances (Task 13)
4. Ajouter monitoring et logging (Task 14)
5. Déployer en production (Task 15)

---

**Happy Testing!** 🎉
