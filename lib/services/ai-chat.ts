import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { aiChatResponseSchema } from '@/lib/schemas/api-responses';

export type AIChatRequest = {
  fanId?: string;
  message: string;
  context?: Record<string, any>;
};

export type AIChatData = {
  response: string;
  confidence: number;
  suggestedUpsell?: string;
  salesTactics?: string[];
  suggestedPrice?: number;
  agentsInvolved?: string[];
  usage?: Record<string, any>;
};

export type AIChatResponse = {
  success: boolean;
  data?: AIChatData;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
    severity?: string;
    metadata?: Record<string, any>;
  };
  meta?: {
    timestamp?: string;
    requestId?: string;
    duration?: number;
    version?: string;
  };
};

export async function sendAIChat(request: AIChatRequest): Promise<AIChatData> {
  const data = await internalApiFetch<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: request,
    schema: aiChatResponseSchema,
  });

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Failed to generate response');
  }

  return data.data;
}
