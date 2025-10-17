# 🚀 Guide des Intégrations Cloud Huntaze

## Accès rapide

Votre application Huntaze intègre maintenant des services cloud de pointe. Voici comment y accéder:

### 🌐 Pages principales

1. **Menu des intégrations**
   ```
   http://localhost:3000/app/integrations
   ```
   Vue d'ensemble de toutes vos intégrations cloud

2. **Chat AI (Azure OpenAI GPT-4o)**
   ```
   http://localhost:3000/app/ai-chat
   ```
   - Assistant AI en temps réel
   - Suivi des coûts par message
   - Historique des conversations

3. **Analytics temps réel (AWS DynamoDB)**
   ```
   http://localhost:3000/app/analytics/realtime
   ```
   - Métriques de revenus
   - Engagement des fans
   - Performance du contenu

4. **Tests d'intégration**
   ```
   http://localhost:3000/app/tests/integration
   ```
   - Vérification de l'état des services
   - Diagnostic des problèmes
   - Configuration des services

### 🔧 APIs disponibles

| Endpoint | Description | Méthode |
|----------|-------------|---------|
| `/api/ai/chat` | Chat avec l'IA | POST |
| `/api/media/upload` | Upload de fichiers sur S3 | POST |
| `/api/analytics/track` | Tracking d'événements | POST/GET |
| `/api/test-services` | Test de santé | GET |

### 📁 Structure des fichiers

```
/app/app/
├── integrations/        # Menu principal
├── ai-chat/            # Chat Azure OpenAI
├── analytics/
│   └── realtime/       # Dashboard temps réel
└── tests/
    └── integration/    # Tests des services

/lib/
├── ai/providers/       # Provider AI unifié
├── aws/               # Clients AWS (DynamoDB, S3, SQS)
├── analytics/         # Analytics temps réel
└── queue/            # Gestionnaire de queues
```

### ⚡ Démarrage rapide

1. **Vérifier l'état des services**
   - Allez sur http://localhost:3000/app/tests/integration
   - Cliquez sur "Run Integration Tests"
   - Vérifiez que tous les services sont "ok"

2. **Tester le chat AI**
   - Allez sur http://localhost:3000/app/ai-chat
   - Posez une question à l'assistant
   - Observez le coût en temps réel

3. **Voir les analytics**
   - Allez sur http://localhost:3000/app/analytics/realtime
   - Visualisez vos métriques
   - Explorez les graphiques interactifs

### 🔐 Configuration requise

Assurez-vous que votre `.env.local` contient:

```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=votre-clé
AZURE_OPENAI_ENDPOINT=votre-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=votre-access-key
AWS_SECRET_ACCESS_KEY=votre-secret-key
```

### 🛠 Résolution des problèmes

**Services non disponibles?**
1. Vérifiez vos clés API dans `.env.local`
2. Redémarrez le serveur: `npm run dev`
3. Créez les tables DynamoDB: `npx tsx scripts/create-dynamodb-tables.ts`

**Erreur d'authentification?**
- Vérifiez que vos clés AWS/Azure sont valides
- Les credentials AWS temporaires expirent après 12h

### 📊 Monitoring

Pour surveiller l'utilisation:
- **Coûts AI**: Visible directement dans le chat
- **Métriques**: Dashboard analytics temps réel
- **Logs**: Console du navigateur pour le debug

### 🎯 Prochaines étapes

1. Explorez chaque intégration
2. Testez les APIs avec vos propres données
3. Personnalisez les dashboards
4. Intégrez dans vos workflows existants

---

💡 **Astuce**: Gardez http://localhost:3000/app/integrations ouvert pour un accès rapide à toutes les fonctionnalités!