"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Conversation = {
  id: string;
  fanId: string;
  platform?: string;
  lastMessageAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type Message = {
  id: string;
  fanId: string;
  conversationId: string;
  direction: 'in' | 'out';
  text: string;
  createdAt: string;
  read?: boolean;
  priceCents?: number;
};

type Fan = {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  valueCents?: number;
  tags?: string[];
};

type MessagesPanelProps = {
  initialConversations: Conversation[];
  fans: Fan[];
  aiResponseStyle?: string;
};

export default function MessagesPanel({ initialConversations, fans, aiResponseStyle }: MessagesPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations?.[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [compose, setCompose] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fanMap = useMemo(() => new Map(fans.map((fan) => [fan.id, fan])), [fans]);

  useEffect(() => {
    void refreshConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      void loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  async function refreshConversations() {
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/crm/conversations', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Impossible de récupérer les conversations');
      const data = await res.json();
      const items = Array.isArray(data?.conversations) ? (data.conversations as Conversation[]) : [];
      setConversations(items);
      if (!selectedConversationId && items[0]) {
        setSelectedConversationId(items[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur de chargement');
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/crm/conversations/${conversationId}/messages`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Impossible de récupérer les messages');
      const data = await res.json();
      const items = Array.isArray(data?.messages) ? (data.messages as Message[]) : [];
      setMessages(items);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erreur de chargement');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!selectedConversationId) return;
    if (!compose.trim()) return;
    const conversation = conversations.find((conv) => conv.id === selectedConversationId);
    if (!conversation) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fanId: conversation.fanId,
          text: compose.trim(),
          direction: 'out',
        }),
      });
      if (!res.ok) throw new Error('Échec de l’envoi du message');
      const data = await res.json();
      if (data?.message) {
        setMessages((prev) => [...prev, data.message as Message]);
      }
      setCompose('');
      setAiDraft('');
      setError(null);
      void refreshConversations();
    } catch (err: any) {
      setError(err?.message || 'Impossible de répondre pour le moment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAIDraft() {
    if (!selectedConversationId) return;
    const conversation = conversations.find((conv) => conv.id === selectedConversationId);
    const incoming = [...messages].reverse().find((msg) => msg.direction === 'in');
    const prompt = buildPrompt(incoming?.text ?? '', aiResponseStyle);
    setSubmitting(true);
    try {
      const res = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          fanId: conversation?.fanId,
          context: incoming?.text,
        }),
      });
      if (!res.ok) throw new Error('Impossible de générer la réponse AI');
      const data = await res.json();
      const content = extractContent(data);
      if (!content) {
        throw new Error('Réponse AI vide');
      }
      setAiDraft(content);
      setCompose(content);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erreur AI');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedConversation = selectedConversationId
    ? conversations.find((conv) => conv.id === selectedConversationId)
    : undefined;
  const selectedFan = selectedConversation ? fanMap.get(selectedConversation.fanId) : undefined;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="grid gap-0 border-b border-gray-200 md:grid-cols-[320px,1fr] dark:border-gray-800">
        <div className="max-h-[460px] overflow-y-auto border-b border-gray-200 md:border-b-0 md:border-r dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversations</p>
            <button
              className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-gray-700"
              onClick={() => void refreshConversations()}
              disabled={loadingConversations}
            >
              Actualiser
            </button>
          </div>
          {loadingConversations ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-600">
              <p>Aucune conversation pour le moment.</p>
              <Link className="mt-3 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700" href="/app/app/platforms/connect">
                Connecter OnlyFans →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {conversations.map((conversation) => {
                const fan = fanMap.get(conversation.fanId);
                const active = selectedConversationId === conversation.id;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                        active ? 'bg-purple-50 dark:bg-purple-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <Avatar name={fan?.name || conversation.fanId} />
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {fan?.name || 'Fan'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {fan?.handle ? `@${fan.handle}` : conversation.platform ?? 'OnlyFans'}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {formatRelativeTime(conversation.lastMessageAt || conversation.updatedAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex min-h-[460px] flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedFan?.name || 'Sélectionnez une conversation'}
              </p>
              {selectedFan?.tags?.length ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedFan.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {aiResponseStyle ? (
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                AI style · {aiResponseStyle}
              </span>
            ) : null}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {loadingMessages ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucun message pour le moment. Dès qu’un fan écrit depuis OnlyFans, la conversation apparaît ici en temps réel.
              </p>
            ) : (
              messages.map((message) => {
                const incoming = message.direction === 'in';
                return (
                  <div
                    key={message.id}
                    className={`flex ${incoming ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        incoming
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {message.text || <span className="italic text-gray-400">Message sans contenu</span>}
                      <div className={`mt-2 text-xs ${incoming ? 'text-gray-500' : 'text-purple-200'}`}>
                        {formatRelativeTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-800">
            {error ? <p className="mb-3 text-xs text-red-600">{error}</p> : null}
            <div className="space-y-3">
              <textarea
                value={compose}
                onChange={(event) => {
                  setCompose(event.target.value);
                  if (aiDraft && event.target.value !== aiDraft) setAiDraft('');
                }}
                rows={3}
                placeholder="Écris ta réponse…"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                disabled={!selectedConversationId || submitting}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleAIDraft()}
                    className="inline-flex items-center gap-2 rounded-lg border border-purple-200 px-3 py-2 text-xs font-medium text-purple-700 transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!selectedConversationId || submitting}
                  >
                    Générer avec l’AI
                  </button>
                  {aiDraft ? (
                    <span className="text-xs text-gray-500">
                      Brouillon AI appliqué. Personnalise avant d’envoyer.
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!selectedConversationId || submitting || !compose.trim()}
                >
                  {submitting ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
      {initials || 'F'}
    </div>
  );
}

function buildPrompt(latestMessage: string, style?: string) {
  const tone = style ? `dans un style ${style}` : 'dans le style personnalisé du créateur';
  return `Le fan vient d'écrire : "${latestMessage}". Rédige une réponse ${tone}, avec un ton authentique Huntaze, en intégrant un call-to-action subtil pour générer une vente PPV si pertinent.`;
}

function extractContent(data: any): string | null {
  if (!data) return null;
  if (typeof data.content === 'string') return data.content.trim();
  if (Array.isArray(data.content)) {
    const text = data.content.map((chunk: any) => (typeof chunk === 'string' ? chunk : chunk?.text ?? '')).join(' ');
    return text.trim() || null;
  }
  if (typeof data.reply === 'string') return data.reply.trim();
  return null;
}

function formatRelativeTime(dateLike?: string | null) {
  if (!dateLike) return '—';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'À l’instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString();
}

function ConversationSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-10 flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className={`flex ${item % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div className="h-16 w-48 rounded-2xl bg-gray-100 animate-pulse dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}
