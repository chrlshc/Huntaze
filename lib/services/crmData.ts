import { randomUUID } from 'crypto';

export type Fan = {
  id: string;
  userId: string;
  name: string;
  platform?: 'onlyfans' | 'fansly' | 'patreon' | string;
  handle?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  valueCents?: number;
  lastSeenAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  fanId: string;
  platform?: string;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  userId: string;
  conversationId: string;
  fanId: string;
  direction: 'in' | 'out';
  text: string;
  priceCents?: number;
  createdAt: string;
};

// In-memory stores keyed by userId
const fansStore = new Map<string, Fan[]>();
const convStore = new Map<string, Conversation[]>();
const msgStore = new Map<string, Message[]>();

export const crmData = {
  listFans(userId: string): Fan[] {
    return (fansStore.get(userId) || []).slice().sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  },
  getFan(userId: string, fanId: string): Fan | undefined {
    return (fansStore.get(userId) || []).find((f) => f.id === fanId);
  },
  createFan(userId: string, data: Partial<Fan>): Fan {
    const now = new Date().toISOString();
    const fan: Fan = {
      id: randomUUID(),
      userId,
      name: data.name || 'Unnamed',
      platform: data.platform,
      handle: data.handle,
      email: data.email,
      phone: data.phone,
      tags: data.tags || [],
      valueCents: data.valueCents || 0,
      lastSeenAt: null,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    const arr = fansStore.get(userId) || [];
    arr.push(fan);
    fansStore.set(userId, arr);
    return fan;
  },
  updateFan(userId: string, fanId: string, patch: Partial<Fan>): Fan | undefined {
    const arr = fansStore.get(userId) || [];
    const idx = arr.findIndex((f) => f.id === fanId);
    if (idx === -1) return undefined;
    const updated: Fan = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
    arr[idx] = updated;
    fansStore.set(userId, arr);
    return updated;
  },
  deleteFan(userId: string, fanId: string): boolean {
    const arr = fansStore.get(userId) || [];
    const next = arr.filter((f) => f.id !== fanId);
    fansStore.set(userId, next);
    return next.length !== arr.length;
  },
  listConversations(userId: string): Conversation[] {
    return (convStore.get(userId) || []).slice().sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  },
  createConversation(userId: string, fanId: string, platform?: string): Conversation {
    const now = new Date().toISOString();
    const conv: Conversation = { id: randomUUID(), userId, fanId, platform, lastMessageAt: null, createdAt: now, updatedAt: now };
    const arr = convStore.get(userId) || [];
    arr.push(conv);
    convStore.set(userId, arr);
    return conv;
  },
  listMessages(userId: string, conversationId: string): Message[] {
    return (msgStore.get(userId) || []).filter((m) => m.conversationId === conversationId).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  },
  createMessage(userId: string, conversationId: string, fanId: string, direction: 'in'|'out', text: string, priceCents?: number): Message {
    const now = new Date().toISOString();
    const msg: Message = { id: randomUUID(), userId, conversationId, fanId, direction, text, priceCents, createdAt: now };
    const arr = msgStore.get(userId) || [];
    arr.push(msg);
    msgStore.set(userId, arr);
    // update conv timestamps
    const convs = convStore.get(userId) || [];
    const idx = convs.findIndex(c => c.id === conversationId);
    if (idx >= 0) convs[idx] = { ...convs[idx], lastMessageAt: now, updatedAt: now };
    convStore.set(userId, convs);
    return msg;
  },
};

