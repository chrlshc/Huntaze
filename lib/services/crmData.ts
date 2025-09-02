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
  read?: boolean;
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
  size?: number;
};

// In-memory stores keyed by userId
const fansStore = new Map<string, Fan[]>();
const convStore = new Map<string, Conversation[]>();
const msgStore = new Map<string, Message[]>();
const quickRepliesStore = new Map<string, string[]>();

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
  getConversation(userId: string, conversationId: string): Conversation | undefined {
    return (convStore.get(userId) || []).find((c) => c.id === conversationId);
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
  createMessage(userId: string, conversationId: string, fanId: string, direction: 'in'|'out', text: string, priceCents?: number, attachments?: Attachment[]): Message {
    const now = new Date().toISOString();
    const msg: Message = { id: randomUUID(), userId, conversationId, fanId, direction, text, priceCents, createdAt: now, read: direction === 'out', attachments };
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
  markMessageRead(userId: string, messageId: string): Message | undefined {
    const arr = msgStore.get(userId) || [];
    const idx = arr.findIndex((m) => m.id === messageId);
    if (idx === -1) return undefined;
    const updated: Message = { ...arr[idx], read: true };
    arr[idx] = updated;
    msgStore.set(userId, arr);
    return updated;
  },
  listQuickReplies(userId: string): string[] {
    const existing = quickRepliesStore.get(userId);
    if (existing && existing.length) return existing;
    // Defaults
    return [
      "Hey {name}! Thanks for your message 💕",
      "I have a special photo set today — want a preview?",
      "You're awesome! Want to join my VIP list?",
    ];
  },
  setQuickReplies(userId: string, templates: string[]): string[] {
    const sanitized = (templates || [])
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter((t) => t.length > 0)
      .slice(0, 20);
    quickRepliesStore.set(userId, sanitized);
    return sanitized;
  },
};
