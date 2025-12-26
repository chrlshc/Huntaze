import { externalFetchJson } from '@/lib/services/external/http';

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

// Configuration for different Azure AI models
const AZURE_MODELS = {
  deepseek: {
    endpoint: process.env.AZURE_DEEPSEEK_ENDPOINT,
    apiKey: process.env.AZURE_DEEPSEEK_API_KEY,
    name: 'deepseek-r1'
  },
  phi4: {
    endpoint: process.env.AZURE_PHI4_ENDPOINT,
    apiKey: process.env.AZURE_PHI4_API_KEY,
    name: 'phi-4-mini'
  },
  llama: {
    endpoint: process.env.AZURE_LLAMA_ENDPOINT,
    apiKey: process.env.AZURE_LLAMA_API_KEY,
    name: 'llama-33-70b'
  }
};

export function cleanDeepSeekOutput(rawOutput: string): string {
  // 1. Supprimer les balises de pensée <think>...</think>
  let clean = rawOutput.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // 2. Nettoyer les potentiels blocs markdown ```json ... ```
  clean = clean.replace(/```json/g, '').replace(/```/g, '');
  
  // 3. Trim pour enlever les espaces vides résiduels
  return clean.trim();
}

export async function callAzureAI(opts: {
  model: 'deepseek' | 'phi4' | 'llama'
  messages: ChatMsg[]
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
  tools?: any[]
  toolChoice?: 'auto' | string
}) {
  const config = AZURE_MODELS[opts.model];
  
  if (!config?.endpoint || !config?.apiKey) {
    throw new Error(`Azure AI ${opts.model} not configured. Check ${opts.model.toUpperCase()}_ENDPOINT and ${opts.model.toUpperCase()}_API_KEY`);
  }

  // 🛡️ SÉCURITÉ: Limites par défaut pour éviter les factures infinies
  // 2000 tokens ~= 1500 mots, suffisant pour la plupart des cas
  const DEFAULT_MAX_TOKENS = 2000;
  const MAX_ALLOWED_TOKENS = 8000; // Hard limit de sécurité

  const safeMaxTokens = Math.min(
    opts.maxTokens ?? DEFAULT_MAX_TOKENS,
    MAX_ALLOWED_TOKENS
  );

  // Build request body
  const requestBody: any = {
    messages: opts.messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: safeMaxTokens,
    stream: false,
  };

  // Add tools if provided
  if (opts.tools && opts.tools.length > 0) {
    requestBody.tools = opts.tools;
    if (opts.toolChoice) {
      requestBody.tool_choice = opts.toolChoice;
    }
  }

  const data: any = await externalFetchJson(
    `${config.endpoint}/chat/completions?api-version=2024-02-15-preview`,
    {
      service: `azure-ai:${opts.model}`,
      operation: 'chat.completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: opts.abortSignal as any,
      cache: 'no-store',
      timeoutMs: 30_000,
      retry: {
        maxRetries: 1,
        retryMethods: ['POST'],
      },
    }
  );

    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? '';
    const tool_calls = choice?.message?.tool_calls ?? null;
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      content,
      tool_calls,
      usage: {
        input: usage.prompt_tokens,
        output: usage.completion_tokens,
        total: usage.total_tokens,
      },
    };
}

// For embeddings, we'll use DeepSeek or fallback to OpenAI if needed
export async function getAzureEmbedding(text: string): Promise<number[]> {
  // If DeepSeek supports embeddings, use it
  if (AZURE_MODELS.deepseek.endpoint && AZURE_MODELS.deepseek.apiKey) {
    try {
      const data: any = await externalFetchJson(
        `${AZURE_MODELS.deepseek.endpoint}/embeddings?api-version=2024-02-15-preview`,
        {
          service: 'azure-ai:deepseek',
          operation: 'embeddings',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_MODELS.deepseek.apiKey,
          },
          body: JSON.stringify({
            input: text,
            model: 'text-embedding-3-small',
          }),
          cache: 'no-store',
          timeoutMs: 20_000,
          retry: {
            maxRetries: 1,
            retryMethods: ['POST'],
          },
        }
      );

      const embedding = data?.data?.[0]?.embedding;
      if (Array.isArray(embedding)) {
        return embedding as number[];
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to OpenAI for embeddings
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('No embedding service available. Configure OPENAI_API_KEY as fallback.');
  }

  const data: any = await externalFetchJson('https://api.openai.com/v1/embeddings', {
    service: 'openai',
    operation: 'embeddings',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
    }),
    cache: 'no-store',
    timeoutMs: 20_000,
    retry: {
      maxRetries: 1,
      retryMethods: ['POST'],
    },
  });

  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error('Failed to generate embeddings');
  }
  return embedding as number[];
}
