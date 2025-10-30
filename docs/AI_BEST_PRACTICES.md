# Best Practices AI pour Huntaze

## 🎯 Principes Fondamentaux

### 1. Toujours Router Intelligemment
❌ **Mauvais:**
```typescript
// Utilise toujours le même modèle
const response = await openai.chat.completions.create({
  model: 'gpt-4o', // Coûteux pour tout
  messages: [...]
});
```

✅ **Bon:**
```typescript
// Laisse le routeur choisir
const response = await aiService.processRequest({
  taskType: 'chatbot',
  prompt: message
});
// Utilisera gpt-4o-mini automatiquement
```

### 2. Structure pour le Cache
❌ **Mauvais:**
```typescript
const prompt = `
User: ${userName}
Context: ${context}
Instructions: ${longInstructions}
Query: ${query}
`;
// Contenu dynamique mélangé = pas de cache
```

✅ **Bon:**
```typescript
const { system, user } = buildCachedPrompt({
  systemInstructions: longInstructions, // Statique = caché
  userData: userName,                    // Dynamique
  userQuery: query                       // Dynamique
});
// 90% d'économie sur instructions répétées
```

### 3. Stream pour l'UX
❌ **Mauvais:**
```typescript
const response = await aiService.processRequest({
  taskType: 'chatbot',
  prompt: message
  // Pas de streaming = attente visible
});
```

✅ **Bon:**
```typescript
const response = await aiService.processRequest({
  taskType: 'chatbot',
  prompt: message,
  options: { stream: true } // Réponse progressive
});
```

### 4. Batch pour Non-Temps-Réel
❌ **Mauvais:**
```typescript
// Traiter 1000 analytics en temps réel
for (const item of items) {
  await aiService.processRequest({
    taskType: 'basic_analytics',
    prompt: item
  });
}
// Coût: $2/1000 requêtes
```

✅ **Bon:**
```typescript
// Utiliser Batch API
await batchAPI.submit({
  requests: items.map(item => ({
    taskType: 'basic_analytics',
    prompt: item
  })),
  completionWindow: '24h'
});
// Coût: $1/1000 requêtes (-50%)
```

## 🔒 Sécurité et Compliance

### 1. Toujours Valider les Inputs
```typescript
function sanitizeUserInput(input: string): string {
  // Supprimer injection prompts
  return input
    .replace(/system:|assistant:|user:/gi, '')
    .slice(0, 10000); // Limite longueur
}
```

### 2. Tâches Critiques = GPT-4o
```typescript
// Compliance, légal, finance
const result = await aiService.processRequest({
  taskType: 'compliance',
  prompt: content,
  // Utilisera TOUJOURS gpt-4o
});
```

### 3. Logs et Audit Trail
```typescript
// Logger toutes les requêtes critiques
await auditLog.create({
  type: 'ai_compliance_check',
  model: response.model,
  input: sanitized(content),
  output: sanitized(response.content),
  cost: response.cost,
  timestamp: new Date()
});
```

## 💰 Optimisation des Coûts

### 1. Monitorer Constamment
```typescript
// Dashboard temps réel
const stats = aiService.getStats();
if (stats.miniPercentage < 80) {
  alert('⚠️ Trop de requêtes full model');
}
if (stats.cacheHitRate < 70) {
  alert('⚠️ Cache hit rate faible');
}
```

### 2. Limiter les Tokens
```typescript
// Définir maxTokens approprié
const response = await aiService.processRequest({
  taskType: 'chatbot',
  prompt: message,
  options: {
    maxTokens: 150 // Pas 1000 pour un simple "Hi"
  }
});
```

### 3. Réutiliser les Réponses
```typescript
// Cache applicatif pour FAQ
const cachedResponse = await redis.get(`faq:${question}`);
if (cachedResponse) {
  return cachedResponse; // Coût: $0
}

const response = await aiService.processRequest({...});
await redis.set(`faq:${question}`, response, 'EX', 3600);
```

## 🚀 Performance

### 1. Paralléliser Quand Possible
❌ **Mauvais:**
```typescript
const caption = await generateCaption(post);
const hashtags = await generateHashtags(post);
const schedule = await suggestSchedule(post);
// 3 requêtes séquentielles = 3x latence
```

✅ **Bon:**
```typescript
const [caption, hashtags, schedule] = await Promise.all([
  generateCaption(post),
  generateHashtags(post),
  suggestSchedule(post)
]);
// 3 requêtes parallèles = 1x latence
```

### 2. Timeout Appropriés
```typescript
const response = await Promise.race([
  aiService.processRequest({...}),
  timeout(5000) // 5s max
]);
```

### 3. Retry avec Backoff
```typescript
async function callWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aiService.processRequest(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

## 📊 Monitoring et Alertes

### 1. Métriques Clés
```typescript
// Tracker ces métriques
const metrics = {
  requestsPerMinute: gauge(),
  miniPercentage: gauge(),
  cacheHitRate: gauge(),
  avgLatency: histogram(),
  costPerRequest: histogram(),
  errorRate: counter()
};
```

### 2. Alertes Automatiques
```typescript
// Alerter si anomalies
if (metrics.costPerRequest.avg() > 0.01) {
  slack.send('⚠️ Coût moyen par requête élevé');
}

if (metrics.errorRate.rate() > 0.05) {
  pagerduty.alert('🚨 Taux d\'erreur AI > 5%');
}
```

### 3. Dashboard Temps Réel
```
┌─────────────────────────────────────┐
│ AI Usage Dashboard                  │
├─────────────────────────────────────┤
│ Requests/min:        1,234          │
│ Mini usage:          92.3%  ✅      │
│ Cache hit rate:      87.5%  ✅      │
│ Avg latency:         234ms  ✅      │
│ Cost/1k requests:    $2.34  ✅      │
│ Error rate:          0.12%  ✅      │
└─────────────────────────────────────┘
```

## 🧪 Testing

### 1. Test Unitaires
```typescript
describe('AI Router', () => {
  it('should use mini for chatbot', () => {
    const decision = routeAIRequest({
      taskType: 'chatbot',
      complexityScore: 3,
      isCritical: false
    });
    expect(decision.model).toBe('gpt-4o-mini');
  });

  it('should use full for compliance', () => {
    const decision = routeAIRequest({
      taskType: 'compliance',
      complexityScore: 3,
      isCritical: true
    });
    expect(decision.model).toBe('gpt-4o');
  });
});
```

### 2. Tests d'Intégration
```typescript
describe('AI Service', () => {
  it('should handle real requests', async () => {
    const response = await aiService.processRequest({
      taskType: 'chatbot',
      prompt: 'Hello'
    });
    expect(response.content).toBeDefined();
    expect(response.cost).toBeLessThan(0.01);
  });
});
```

### 3. Load Testing
```typescript
// Simuler charge réelle
const results = await loadTest({
  duration: '5m',
  rps: 100,
  scenario: async () => {
    await aiService.processRequest({
      taskType: 'chatbot',
      prompt: randomMessage()
    });
  }
});

console.log(`Avg latency: ${results.avgLatency}ms`);
console.log(`P95 latency: ${results.p95Latency}ms`);
console.log(`Error rate: ${results.errorRate}%`);
```

## ✅ Checklist Pré-Production

- [ ] Routage intelligent activé
- [ ] Prompt caching configuré
- [ ] Streaming implémenté
- [ ] Fallback automatique testé
- [ ] Monitoring dashboard déployé
- [ ] Alertes configurées
- [ ] Logs audit en place
- [ ] Tests de charge passés
- [ ] Documentation à jour
- [ ] Équipe formée

## 🎓 Formation Équipe

### Pour Développeurs
1. Comprendre le routage automatique
2. Utiliser `buildCachedPrompt()` correctement
3. Choisir les bons `taskType`
4. Monitorer les coûts

### Pour Product Managers
1. Comprendre les économies (98%)
2. Prioriser les features par coût
3. Analyser les métriques d'usage
4. Optimiser le ROI

### Pour Support
1. Identifier les requêtes coûteuses
2. Suggérer alternatives moins chères
3. Escalader les anomalies
4. Éduquer les utilisateurs
