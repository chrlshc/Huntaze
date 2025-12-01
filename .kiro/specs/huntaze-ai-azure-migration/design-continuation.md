# Design Document (Suite) - Composants Azure AI

## 2. AzureOpenAIRouter

Remplace le LLM Router actuel pour router vers Azure OpenAI Service.

**Interface:**
```typescript
interface AzureOpenAIRouter {
  generateWithPolicy(options: RouterOptions): Promise<RouterResponse>;
  decideTier(policy: PolicyInput): ModelTier;
  getFallbackChain(tier: ModelTier): DeploymentConfig[];
}

interface RouterOptions {
  policy: PolicyInput;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  meta?: {
    accountId?: string;
    plan: UserPlan;
    segment?: string;
    action?: string;
  };
}

interface RouterResponse {
  content: string;
  tier: ModelTier;
  deployment: string;
  usage: TokenUsage;
  latency: number;
}

type ModelTier = 'premium' | 'standard' | 'economy';
type UserPlan = 'starter' | 'pro' | 'scale' | 'enterprise';

interface DeploymentConfig {
  deployment: AzureDeployment;
  maxTokens: number;
  temperature: number;
}
```

**Fallback Chain:**
```typescript
const FALLBACK_CHAINS: Record<ModelTier, DeploymentConfig[]> = {
  premium: [
    { deployment: 'gpt-4-turbo', maxTokens: 8192, temperature: 0.7 },
    { deployment: 'gpt-4', maxTokens: 4096, temperature: 0.7 },
  ],
  standard: [
    { deployment: 'gpt-4', maxTokens: 4096, temperature: 0.7 },
    { deployment: 'gpt-35-turbo', maxTokens: 4096, temperature: 0.7 },
  ],
  economy: [
    { deployment: 'gpt-35-turbo', maxTokens: 2048, temperature: 0.5 },
    { deployment: 'gpt-35-turbo', maxTokens: 1024, temperature: 0.4 },
  ],
};
```
