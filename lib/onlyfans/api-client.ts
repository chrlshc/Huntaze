import { OnlyFansApiClient } from './backend-integration/api-client';
import { SecureSessionStorage } from './backend-integration/secure-session-storage';

interface ClientContext {
  userId: string;
  ipAddress?: string;
}

interface CreatePostParams extends ClientContext {
  text: string;
  price?: number;
  media?: string[];
  isScheduled?: boolean;
  scheduledFor?: string;
}

interface SendMessageParams extends ClientContext {
  recipientId: string;
  text: string;
  price?: number;
}

interface FetchMessagesParams extends ClientContext {
  chatId: string;
  limit?: number;
  offset?: number;
}

interface ListChatsParams extends ClientContext {
  limit?: number;
  offset?: number;
}

let sessionStorage: SecureSessionStorage | null = null;

function getSessionStorage(): SecureSessionStorage {
  if (!sessionStorage) {
    sessionStorage = new SecureSessionStorage();
  }
  return sessionStorage;
}

async function createClient(context: ClientContext): Promise<OnlyFansApiClient> {
  const storage = getSessionStorage();
  const session = await storage.getSession(context.userId, 'onlyfans', context.ipAddress);

  if (!session) {
    throw new Error('OnlyFans session not found for user');
  }

  const client = new OnlyFansApiClient({
    cookies: session.cookies || [],
    userAgent: session.userAgent || 'Mozilla/5.0',
    userId: session.userId || context.userId,
  });

  if (!session.userId) {
    await client.initialize();
  }

  return client;
}

export const onlyfansIntegration = {
  async listChats(params: ListChatsParams) {
    const client = await createClient(params);
    return client.getChats(params.limit, params.offset);
  },

  async getMessages(params: FetchMessagesParams) {
    const client = await createClient(params);
    return client.getMessages(params.chatId, params.limit, params.offset);
  },

  async sendMessage(params: SendMessageParams) {
    const client = await createClient(params);
    return client.sendMessage(params.recipientId, params.text, params.price);
  },

  async createPost(params: CreatePostParams) {
    const client = await createClient(params);
    return client.createPost({
      text: params.text,
      price: params.price,
      media: params.media,
      isScheduled: params.isScheduled,
      scheduledFor: params.scheduledFor,
    });
  },
};

export async function getOnlyFansClient(userId: string, ipAddress?: string) {
  return createClient({ userId, ipAddress });
}

export default onlyfansIntegration;
