# Huntaze AI System - Documentation Complète

## Vue d'ensemble

Le système AI Huntaze utilise Azure AI Foundry avec un router intelligent déployé sur AWS ECS. Le router sélectionne automatiquement le meilleur modèle en fonction du type de requête.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HUNTAZE AI ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────────────┐  │
│  │   Next.js    │────▶│   AWS ECS        │────▶│   Azure AI Foundry      │  │
│  │   App        │     │   AI Router      │     │   (East US 2)           │  │
│  │              │     │   (Python)       │     │                         │  │
│  │  TypeScript  │     │                  │     │  ┌─────────────────┐    │  │
│  │  Client      │     │  ┌────────────┐  │     │  │ DeepSeek R1     │    │  │
│  │              │     │  │ Classifier │  │     │  │ (Math/Coding)   │    │  │
│  └──────────────┘     │  │ (Phi-4)    │  │     │  └─────────────────┘    │  │
│                       │  └────────────┘  │     │                         │  │
│                       │        │         │     │  ┌─────────────────┐    │  │
│                       │        ▼         │     │  │ Llama 3.3 70B   │    │  │
│                       │  ┌────────────┐  │     │  │ (Chat/Creative) │    │  │
│                       │  │  Routing   │──│────▶│  └─────────────────┘    │  │
│                       │  │  Engine    │  │     │                         │  │
│                       │  └────────────┘  │     │  ┌─────────────────┐    │  │
│                       │                  │     │  │ Mistral Large   │    │  │
│                       └──────────────────┘     │  │ (French)        │    │  │
│                                                │  └─────────────────┘    │  │
│                                                │                         │  │
│                                                └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Modèles Disponibles

| Modèle | Use Case | Coût Input/1K | Coût Output/1K | Status |
|--------|----------|---------------|----------------|--------|
| DeepSeek R1 | Math, Coding complexe | $0.0014 | $0.0028 | ✅ Actif |
| Llama 3.3 70B | Chat, Creative | $0.00099 | $0.00099 | ✅ Actif |
| Mistral Large 2411 | Fallback/Backup | $0.002 | $0.006 | ✅ Disponible |
| Phi-4 Mini | Classifier interne | $0.0001 | $0.0001 | ✅ Actif |

## Logique de Routing

```
1. Math/Coding (high complexity) → DeepSeek R1
2. Creative / VIP tier → Llama 3.3 70B
3. Chat → Llama 3.3 70B
4. Fallback → Llama 3.3 70B
```

Note: Mistral Large est disponible comme backup mais pas activement routé.

## Configuration

### Variables d'environnement

```bash
# .env.local ou .env.production
AI_ROUTER_URL=http://huntaze-ai-router-production-1441889632.us-east-2.elb.amazonaws.com
AI_ROUTER_API_KEY=<your-api-key>

# Azure AI Foundry (pour accès direct si nécessaire)
AZURE_DEEPSEEK_ENDPOINT=https://deepseek-r1-endpoint.eastus2.models.ai.azure.com
AZURE_DEEPSEEK_API_KEY=<key>
AZURE_LLAMA_ENDPOINT=https://llama-3-3-70b-endpoint.eastus2.models.ai.azure.com
AZURE_LLAMA_API_KEY=<key>
AZURE_MISTRAL_ENDPOINT=https://mistral-large-2411-endpoint.eastus2.models.ai.azure.com
AZURE_MISTRAL_API_KEY=<key>
AZURE_PHI4_ENDPOINT=https://phi-4-mini-endpoint.eastus2.models.ai.azure.com
AZURE_PHI4_API_KEY=<key>
```

## Intégration TypeScript

### 1. Import du client

```typescript
import { 
  getRouterClient, 
  RouterClient,
  RouterRequest,
  RouterResponse,
  RouterError,
  RouterErrorCode 
} from '@/lib/ai/foundry/router-client';

import { 
  calculateCost, 
  calculateCostBreakdown,
  convertRouterUsage 
} from '@/lib/ai/foundry/cost-calculator';
```

### 2. Utilisation basique

```typescript
// Obtenir le client singleton
const client = getRouterClient();

// Requête simple
const response = await client.route({
  prompt: "Explique-moi le théorème de Pythagore",
  client_tier: "standard",
  type_hint: "math"
});

console.log(response.model);      // "DeepSeek-R1" ou "Llama-3.3-70B"
console.log(response.output);     // La réponse du modèle
console.log(response.usage);      // { prompt_tokens, completion_tokens, total_tokens }
```

### 3. Avec calcul des coûts

```typescript
const response = await client.route({
  prompt: "Write a poem about the ocean",
  client_tier: "standard",
  type_hint: "creative"
});

if (response.usage) {
  const usage = convertRouterUsage(response.usage);
  const cost = calculateCostBreakdown(response.model, usage);
  
  console.log(`Model: ${cost.model}`);
  console.log(`Input cost: $${cost.inputCost.toFixed(6)}`);
  console.log(`Output cost: $${cost.outputCost.toFixed(6)}`);
  console.log(`Total cost: $${cost.totalCost.toFixed(6)}`);
}
```

### 4. Gestion des erreurs

```typescript
import { RouterError, RouterErrorCode } from '@/lib/ai/foundry/router-client';

try {
  const response = await client.route({
    prompt: "Hello",
    client_tier: "standard"
  });
} catch (error) {
  if (error instanceof RouterError) {
    switch (error.code) {
      case RouterErrorCode.VALIDATION_ERROR:
        console.error("Invalid request:", error.message);
        break;
      case RouterErrorCode.TIMEOUT_ERROR:
        console.error("Request timed out");
        break;
      case RouterErrorCode.CONNECTION_ERROR:
        console.error("Cannot reach router:", error.endpoint);
        break;
      case RouterErrorCode.SERVICE_ERROR:
        console.error("Router error:", error.statusCode);
        break;
    }
  }
}
```

### 5. Health check

```typescript
const health = await client.healthCheck();
console.log(health.status);  // "healthy"
console.log(health.region);  // "eastus2"
```

## Exemples d'intégration

### API Route (Next.js App Router)

```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRouterClient } from '@/lib/ai/foundry/router-client';
import { calculateCost, convertRouterUsage } from '@/lib/ai/foundry/cost-calculator';

export async function POST(request: NextRequest) {
  try {
    const { message, type } = await request.json();
    
    const client = getRouterClient();
    const response = await client.route({
      prompt: message,
      client_tier: "standard",
      type_hint: type || "chat"
    });
    
    // Calculer le coût
    let cost = 0;
    if (response.usage) {
      const usage = convertRouterUsage(response.usage);
      cost = calculateCost(response.model, usage);
    }
    
    return NextResponse.json({
      message: response.output,
      model: response.model,
      cost,
      tokens: response.usage?.total_tokens || 0
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

### Server Action

```typescript
// app/actions/ai.ts
'use server';

import { getRouterClient } from '@/lib/ai/foundry/router-client';

export async function generateCaption(description: string) {
  const client = getRouterClient();
  
  const response = await client.route({
    prompt: `Generate a catchy social media caption for: ${description}`,
    client_tier: "standard",
    type_hint: "creative"
  });
  
  return {
    caption: response.output,
    model: response.model
  };
}

export async function solvemath(problem: string) {
  const client = getRouterClient();
  
  const response = await client.route({
    prompt: problem,
    client_tier: "standard",
    type_hint: "math"
  });
  
  return {
    solution: response.output,
    model: response.model  // Will be DeepSeek-R1 for complex problems
  };
}
```

### React Hook

```typescript
// hooks/useAI.ts
'use client';

import { useState, useCallback } from 'react';

interface AIResponse {
  message: string;
  model: string;
  cost: number;
  tokens: number;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = useCallback(async (
    message: string, 
    type: 'chat' | 'math' | 'coding' | 'creative' = 'chat'
  ): Promise<AIResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, type })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { chat, loading, error };
}
```

### Composant React

```tsx
// components/AIChat.tsx
'use client';

import { useState } from 'react';
import { useAI } from '@/hooks/useAI';

export function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    cost?: number;
  }>>([]);
  
  const { chat, loading, error } = useAI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userMessage = input;
    setInput('');

    // Get AI response
    const response = await chat(userMessage);
    
    if (response) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        model: response.model,
        cost: response.cost
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              <p>{msg.content}</p>
              {msg.model && (
                <p className="text-xs mt-1 opacity-70">
                  {msg.model} • ${msg.cost?.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Infrastructure AWS

### ECS Service

- Cluster: `huntaze-ai-router-production`
- Service: `huntaze-ai-router`
- Task Definition: `huntaze-ai-router:4`
- Instances: 2 (auto-scaling)
- Load Balancer: `huntaze-ai-router-production-1441889632.us-east-2.elb.amazonaws.com`

### Secrets Manager

| Secret | Description |
|--------|-------------|
| `huntaze/ai-router/api-key` | API key pour authentifier les requêtes au router |
| `huntaze/ai-router/azure-endpoint` | Endpoint Azure AI (DeepSeek) |
| `huntaze/ai-router/azure-key` | Clé API Azure AI (DeepSeek) |

## Endpoints API

### Health Check
```
GET /health
Response: { "status": "healthy", "region": "eastus2", "service": "ai-router" }
```

### Route Request
```
POST /route
Headers:
  Content-Type: application/json
  X-API-Key: <api-key>

Body:
{
  "prompt": "Your question here",
  "client_tier": "standard" | "vip",
  "type_hint": "math" | "coding" | "creative" | "chat",  // optional
  "language_hint": "fr" | "en" | "other"  // optional
}

Response:
{
  "model": "Llama-3.3-70B",
  "deployment": "llama33-70b-us",
  "region": "eastus2",
  "routing": {
    "type": "chat",
    "complexity": "low",
    "language": "en",
    "client_tier": "standard"
  },
  "output": "AI response here...",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  }
}
```

## Monitoring

### Métriques disponibles

- Latence par modèle
- Tokens consommés
- Coûts par requête
- Taux d'erreur
- Distribution des types de requêtes

### Endpoint métriques
```
GET /api/admin/ai-metrics
```

## Troubleshooting

### Router ne répond pas
1. Vérifier le health check: `curl http://<router-url>/health`
2. Vérifier les logs ECS dans CloudWatch
3. Vérifier que les secrets AWS sont configurés

### Erreur 401 Unauthorized
- Vérifier que `X-API-Key` est inclus dans les headers
- Vérifier que la clé correspond à celle dans Secrets Manager

### Erreur 400 Bad Request
- Vérifier le format du body JSON
- Vérifier que `client_tier` est "standard" ou "vip"
- Vérifier que `type_hint` est valide si fourni

### Modèle incorrect sélectionné
- Utiliser `type_hint` pour forcer un type de requête
- Vérifier la complexité de la requête (DeepSeek nécessite "high" complexity)

## Fichiers clés

```
lib/ai/
├── foundry/
│   ├── router-client.ts      # Client TypeScript pour le router
│   ├── cost-calculator.ts    # Calcul des coûts
│   ├── index.ts              # Exports
│   └── ...
├── router/                   # Router Python (déployé sur ECS)
│   ├── main.py               # API FastAPI
│   ├── client.py             # Client Azure AI
│   ├── routing.py            # Logique de routing
│   ├── classifier.py         # Classification avec Phi-4
│   └── ...
└── config/
    └── provider-config.ts    # Configuration des providers
```


## Quick Start

### 1. Vérifier que le router fonctionne

```bash
# Health check
curl http://huntaze-ai-router-production-1441889632.us-east-2.elb.amazonaws.com/health

# Test simple
curl -X POST http://huntaze-ai-router-production-1441889632.us-east-2.elb.amazonaws.com/route \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"prompt": "Hello", "client_tier": "standard", "type_hint": "chat"}'
```

### 2. Utiliser dans l'app (Server-side)

```typescript
// Dans une API route ou Server Action
import { getAIService, aiChat, aiSolve, aiCode, aiCreate } from '@/lib/ai/service';

// Option 1: Fonctions simples
const chatResponse = await aiChat("Hello, how are you?");
const mathSolution = await aiSolve("What is the integral of x^2?");
const code = await aiCode("Write a function to sort an array");
const poem = await aiCreate("Write a haiku about coding");

// Option 2: Service complet avec tracking
const ai = getAIService();
const result = await ai.request({
  prompt: "Explain quantum computing",
  type: "chat",
  tier: "standard"
});

console.log(result.content);  // La réponse
console.log(result.model);    // "Llama-3.3-70B"
console.log(result.cost);     // { inputCost, outputCost, totalCost }

// Voir les stats accumulées
console.log(ai.getStats());   // { totalCost, requestCount, avgCost }
```

### 3. Utiliser dans un composant React

```tsx
'use client';

import { useAI, useAIChat, useAIMath } from '@/hooks/useAI';

function MyComponent() {
  const { send, messages, loading, error, totalCost } = useAI();

  const handleSubmit = async (message: string) => {
    const response = await send(message, 'chat');
    if (response) {
      console.log('AI said:', response.content);
      console.log('Cost:', response.cost);
    }
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.role}: {msg.content}</div>
      ))}
      {loading && <div>Thinking...</div>}
      {error && <div>Error: {error}</div>}
      <div>Total cost: ${totalCost.toFixed(6)}</div>
    </div>
  );
}
```

### 4. API Endpoint direct

```bash
# POST /api/ai/foundry
curl -X POST http://localhost:3000/api/ai/foundry \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello world",
    "type": "chat",
    "tier": "standard"
  }'

# Response:
{
  "success": true,
  "message": "Hello! How can I help you today?",
  "model": "Llama-3.3-70B",
  "tokens": { "input": 10, "output": 15, "total": 25 },
  "cost": { "input": 0.0000099, "output": 0.0000149, "total": 0.0000248 }
}
```

## Coûts estimés

| Opération | Tokens moyens | Coût estimé |
|-----------|---------------|-------------|
| Chat simple | 100 | $0.0001 |
| Question complexe | 500 | $0.0005 |
| Génération de code | 1000 | $0.001 |
| Raisonnement math (DeepSeek) | 2000 | $0.006 |

## Support

- Documentation: `docs/AI-SYSTEM-INTEGRATION.md`
- Code source router: `lib/ai/router/`
- Client TypeScript: `lib/ai/foundry/router-client.ts`
- Service unifié: `lib/ai/service.ts`
- Hook React: `hooks/useAI.ts`
