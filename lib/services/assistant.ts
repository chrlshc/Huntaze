import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import {
  assistantConversationCreateResponseSchema,
  assistantConversationResponseSchema,
  assistantConversationsResponseSchema,
  assistantReplyResponseSchema,
} from '@/lib/schemas/api-responses';

export type AssistantConversationSummary = {
  id: string;
  title?: string;
  updatedAt?: string;
  messages?: { content: string }[];
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type AssistantConversationDetail = {
  id: string;
  title?: string;
  updatedAt?: string;
  messages?: AssistantMessage[];
};

export type AssistantConversationsResponse = {
  conversations: AssistantConversationSummary[];
};

export type AssistantConversationResponse = {
  conversation: AssistantConversationDetail;
};

export type AssistantReplyResponse = {
  reply: string;
  conversationId: string;
};

export type CreateConversationResponse = {
  conversation: AssistantConversationDetail;
};

export async function listAssistantConversations(): Promise<AssistantConversationsResponse> {
  return internalApiFetch('/api/assistant/conversations', {
    schema: assistantConversationsResponseSchema,
  });
}

export async function getAssistantConversation(id: string): Promise<AssistantConversationResponse> {
  return internalApiFetch(`/api/assistant/conversations/${id}`, {
    schema: assistantConversationResponseSchema,
  });
}

export async function createAssistantConversation(): Promise<CreateConversationResponse> {
  return internalApiFetch('/api/assistant/conversations', {
    method: 'POST',
    schema: assistantConversationCreateResponseSchema,
  });
}

export async function deleteAssistantConversation(id: string): Promise<unknown> {
  return internalApiFetch(`/api/assistant/conversations/${id}`, {
    method: 'DELETE',
  });
}

export async function sendAssistantMessage(data: {
  conversationId?: string | null;
  message: string;
}): Promise<AssistantReplyResponse> {
  return internalApiFetch('/api/assistant', {
    method: 'POST',
    body: {
      conversationId: data.conversationId || undefined,
      message: data.message,
    },
    schema: assistantReplyResponseSchema,
  });
}
