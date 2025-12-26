import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { aiAgentActionResponseSchema, aiAgentsResponseSchema } from '@/lib/schemas/api-responses';

export type AIAgent = {
  key: string;
  name: string;
  description?: string;
  actions?: string[];
};

export type AIAgentsResponse = {
  agents?: AIAgent[];
};

export type AIAgentActionResponse = {
  message?: string;
  type?: string;
  result?: unknown;
  error?: string;
};

export async function listAIAgents(): Promise<AIAgentsResponse> {
  return internalApiFetch('/api/ai/agents', {
    schema: aiAgentsResponseSchema,
  });
}

export async function sendAIAgentMessage(payload: Record<string, unknown>): Promise<AIAgentActionResponse> {
  return internalApiFetch('/api/ai/agents', {
    method: 'POST',
    body: payload,
    schema: aiAgentActionResponseSchema,
  });
}
