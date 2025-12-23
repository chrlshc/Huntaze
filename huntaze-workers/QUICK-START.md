# 🚀 Quick Start - Huntaze Workers

**Infrastructure déployée**: ✅  
**Function App**: `huntaze-workers-7a2abf94`  
**Service Bus**: `huntaze-sb-1eaef9fe`

---

## 📋 Étapes Rapides

### 1. Créer les fichiers workers (5 min)

Copie les fichiers depuis ce guide dans `src/functions/`:

- `VideoAnalysisWorker.ts`
- `ChatSuggestionsWorker.ts`
- `ContentSuggestionsWorker.ts`
- `ContentAnalysisWorker.ts`
- `SignalRNotificationWorker.ts`

### 2. Configurer local.settings.json

```bash
cat > local.settings.json <<'EOF'
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SERVICEBUS_CONNECTION": "Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=functions-rw;SharedAccessKey=REDACTED",
    "TOPIC_JOBS": "huntaze-jobs",
    "TOPIC_EVENTS": "huntaze-events",
    "AZURE_DEEPSEEK_V3_ENDPOINT": "https://your-endpoint.openai.azure.com/",
    "AZURE_DEEPSEEK_R1_ENDPOINT": "https://your-endpoint.openai.azure.com/",
    "DATABASE_URL": "postgresql://user:pass@host:5432/db",
    "REDIS_URL": "redis://host:6379"
  }
}
EOF
```

### 3. Build et Deploy

```bash
npm run build
func azure functionapp publish huntaze-workers-7a2abf94
```

### 4. Vérifier le déploiement

```bash
func azure functionapp list-functions huntaze-workers-7a2abf94
```

---

## 📝 Code Minimal des Workers

Crée le dossier `src/functions/` et ajoute ces fichiers:

### VideoAnalysisWorker.ts

```typescript
import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('VideoAnalysisWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'video-analysis',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[VideoAnalysisWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      const { videoUrl } = payload;
      
      // TODO: Appeler Azure AI pour analyse vidéo
      context.log(`[VideoAnalysisWorker] Analyzing video: ${videoUrl}`);
      
      // Simuler traitement (remplacer par vraie logique)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = {
        scenes: ['scene1', 'scene2'],
        objects: ['object1', 'object2'],
        transcript: 'Sample transcript'
      };
      
      // Publier événement de complétion
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'video.analysis',
          result,
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[VideoAnalysisWorker] Job ${jobId} completed in ${Date.now() - startTime}ms`);
      
    } catch (error: any) {
      context.error('[VideoAnalysisWorker] Error:', error);
      throw error; // Trigger retry
    }
  }
});
```

### ChatSuggestionsWorker.ts

```typescript
import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('ChatSuggestionsWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'chat-suggestions',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[ChatSuggestionsWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      const { fanMessage, context: chatContext } = payload;
      
      // TODO: Appeler Azure AI pour suggestions
      context.log(`[ChatSuggestionsWorker] Generating suggestions for: ${fanMessage}`);
      
      const suggestions = [
        'Hey! Thanks for your message 😊',
        'I appreciate you reaching out!',
        'That\'s so sweet of you to say!'
      ];
      
      // Publier événement
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'chat.suggest',
          result: { suggestions },
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[ChatSuggestionsWorker] Job ${jobId} completed`);
      
    } catch (error: any) {
      context.error('[ChatSuggestionsWorker] Error:', error);
      throw error;
    }
  }
});
```

### ContentSuggestionsWorker.ts

```typescript
import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('ContentSuggestionsWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'content-suggestions',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[ContentSuggestionsWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      
      // TODO: Générer suggestions de contenu
      const suggestions = [
        { type: 'photo', caption: 'Feeling cute today 💕' },
        { type: 'video', caption: 'Behind the scenes 🎬' }
      ];
      
      // Publier événement
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'content.suggest',
          result: { suggestions },
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[ContentSuggestionsWorker] Job ${jobId} completed`);
      
    } catch (error: any) {
      context.error('[ContentSuggestionsWorker] Error:', error);
      throw error;
    }
  }
});
```

### ContentAnalysisWorker.ts

```typescript
import { app, InvocationContext } from '@azure/functions';
import { ServiceBusClient } from '@azure/service-bus';

app.serviceBusTopic('ContentAnalysisWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-jobs',
  subscriptionName: 'content-analysis',
  handler: async (message: any, context: InvocationContext) => {
    const startTime = Date.now();
    context.log('[ContentAnalysisWorker] Processing job:', message.jobId);
    
    try {
      const { jobId, payload } = message;
      const { contentUrl } = payload;
      
      // TODO: Analyser le contenu
      const analysis = {
        sentiment: 'positive',
        tags: ['lifestyle', 'fashion'],
        score: 0.85
      };
      
      // Publier événement
      const sbClient = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION!);
      const sender = sbClient.createSender(process.env.TOPIC_EVENTS!);
      
      await sender.sendMessages({
        body: {
          eventType: 'job.completed',
          jobId,
          jobType: 'content.analyze',
          result: analysis,
          duration: Date.now() - startTime
        },
        contentType: 'application/json'
      });
      
      await sender.close();
      await sbClient.close();
      
      context.log(`[ContentAnalysisWorker] Job ${jobId} completed`);
      
    } catch (error: any) {
      context.error('[ContentAnalysisWorker] Error:', error);
      throw error;
    }
  }
});
```

### SignalRNotificationWorker.ts

```typescript
import { app, InvocationContext } from '@azure/functions';

app.serviceBusTopic('SignalRNotificationWorker', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'huntaze-events',
  subscriptionName: 'notify-signalr',
  handler: async (message: any, context: InvocationContext) => {
    context.log('[SignalRNotificationWorker] Processing event:', message.eventType);
    
    try {
      const { eventType, jobId, result } = message;
      
      // TODO: Envoyer notification SignalR
      context.log(`[SignalRNotificationWorker] Notifying client for job ${jobId}`);
      
      // Simuler envoi notification
      context.log(`[SignalRNotificationWorker] Event ${eventType} processed`);
      
    } catch (error: any) {
      context.error('[SignalRNotificationWorker] Error:', error);
      // Ne pas throw pour éviter retry sur notifications
    }
  }
});
```

---

## 🧪 Test Local

```bash
# Démarrer en local
func start

# Dans un autre terminal, tester avec curl
curl -X POST http://localhost:7071/admin/functions/VideoAnalysisWorker \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-123",
    "jobType": "video.analysis",
    "payload": {
      "videoUrl": "https://example.com/video.mp4"
    }
  }'
```

---

## 📊 Monitoring

```bash
# Voir les logs en temps réel
func azure functionapp logstream huntaze-workers-7a2abf94

# Vérifier les métriques Service Bus
az servicebus topic subscription show \
  --resource-group huntaze-beta-rg \
  --namespace-name huntaze-sb-1eaef9fe \
  --topic-name huntaze-jobs \
  --name video-analysis
```

---

## ✅ Checklist

- [ ] Fichiers workers créés dans `src/functions/`
- [ ] `local.settings.json` configuré
- [ ] Build réussi (`npm run build`)
- [ ] Déployé sur Azure (`func azure functionapp publish`)
- [ ] Functions listées (`func azure functionapp list-functions`)
- [ ] Test local réussi
- [ ] Logs visibles sur Azure

---

## 🔗 Prochaines Étapes

1. **Intégrer Azure AI**: Remplacer les TODO par vrais appels API
2. **Configurer Vercel**: Ajouter `SERVICEBUS_CONNECTION_SEND` dans env vars
3. **Créer API routes**: Pour enqueue jobs depuis Vercel
4. **Tester end-to-end**: Avec script `test-workers.sh`

---

**Connection Strings sauvegardées**:
- Vercel: `SERVICEBUS_CONNECTION_SEND="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED"`
- Functions: Déjà configuré dans Azure

**Coût**: ~$156.88/mois (production-ready)
