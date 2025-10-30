// Mock OnlyFans Gateway for testing and development

import { OnlyFansGateway, Conversation, Message } from '../types';

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export class MockOnlyFansGateway implements OnlyFansGateway {
  private convs: Conversation[];
  private store: Record<string, Message[]> = {};

  constructor(seed = 20) {
    this.convs = Array.from({ length: seed }).map((_, i) => ({
      userId: `u_${i + 1}`,
      username: `fan_${i + 1}`,
      lastMessage: 'Hey 👋',
      unreadCount: Math.random() > 0.7 ? 1 : 0,
      avatarUrl: undefined
    }));

    for (const c of this.convs) {
      this.store[c.userId] = [
        {
          id: `m_${c.userId}_1`,
          userId: c.userId,
          content: 'Hello',
          createdAt: new Date().toISOString(),
          direction: 'in'
        }
      ];
    }
  }

  async getConversations(): Promise<Conversation[]> {
    await delay(50);
    return this.convs;
  }

  async getMessages(userId: string, cursor?: string) {
    await delay(30);
    const msgs = this.store[userId] ?? [];
    return { messages: msgs, nextCursor: undefined };
  }

  async sendMessage(userId: string, content: string) {
    await delay(80);
    const msg: Message = {
      id: `m_${userId}_${Date.now()}`,
      userId,
      content,
      createdAt: new Date().toISOString(),
      direction: 'out'
    };
    this.store[userId] = (this.store[userId] ?? []).concat(msg);
    return { ok: true };
  }
}
