'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileMessages from './mobile-page';
import { 
  MessageSquare, 
  ChevronLeft,
  Bot,
  Plus,
  Send,
  ExternalLink
} from 'lucide-react';
import { ofIntegrationApi } from '@/src/lib/api';
import ResumeBanner from '@/components/onboarding/ResumeBanner';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function MessagesPage() {
  const { trackEvent } = useAnalytics();
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const [ofStatus, setOfStatus] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [fans, setFans] = useState<Record<string, any>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastInsertedId, setLastInsertedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getMessagePreview = (msg: any) => {
    if (!msg) return 'No content';
    const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
    if (attachments.length > 0) {
      const images = attachments.filter((a: any) => a.type === 'image').length;
      const files = attachments.filter((a: any) => a.type !== 'image').length;
      if (images > 0 && !msg.text) return '📷 Photo';
      if (files > 0 && !msg.text) return '📎 Document';
    }
    return msg.text || 'No content';
  };
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Live insert new messages from SSE
  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (!detail || detail.type !== 'new-message') return;
      const { conversationId, fanId, message } = detail;

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx >= 0) {
          const updated = [...prev];
          const conv = updated[idx];
          const newMessages = [...(conv.messages || []), message];
          const newConv = {
            ...conv,
            lastMessage: message,
            messages: newMessages,
            unread: (conv.unread || 0) + 1,
          };
          // move to top
          updated.splice(idx, 1);
          return [newConv, ...updated];
        } else {
          // New conversation container
          const newConv = {
            id: conversationId,
            fanId,
            lastMessage: message,
            messages: [message],
            unread: 1,
            createdAt: new Date().toISOString(),
          };
          return [newConv, ...prev];
        }
      });

      // bump global unread and notify badges
      setUnreadCount((prev) => {
        const next = prev + 1;
        window.dispatchEvent(new CustomEvent('unread-count', { detail: { count: next } }));
        return next;
      });

      // mark last inserted for animation
      setLastInsertedId(message?.id || null);
      setTimeout(() => setLastInsertedId(null), 1500);
    };

    window.addEventListener('new-message', handleNewMessage as EventListener);
    return () => window.removeEventListener('new-message', handleNewMessage as EventListener);
  }, []);
  
  if (isMobile) {
    return <MobileMessages />;
  }

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          fetch('/api/users/profile', { cache: 'no-store' }),
          fetch('/api/ai/config', { cache: 'no-store' }),
        ]);
        if (p.ok) setProfile(await p.json());
        if (a.ok) {
          const config = await a.json();
          setAiConfig(config);
          setHasConnectedPlatforms(config.platforms?.length > 0);
        }
        // OnlyFans connection status
        try {
          const st = await ofIntegrationApi.status();
          setOfStatus(st);
        } catch {}
        // Load fans
        const fr = await fetch('/api/crm/fans', { cache: 'no-store' });
        if (fr.ok) {
          const data = await fr.json();
          const map: Record<string, any> = {};
          (data.fans || []).forEach((f: any) => { map[f.id] = f; });
          setFans(map);
        }
        // Load conversations + messages
        const cr = await fetch('/api/crm/conversations', { cache: 'no-store' });
        let totalUnread = 0;
        if (cr.ok) {
          const data = await cr.json();
          const convs = data.conversations || [];
          const enriched: any[] = [];
          for (const c of convs) {
            const mr = await fetch(`/api/crm/conversations/${c.id}/messages`, { cache: 'no-store' });
            let messages: any[] = [];
            if (mr.ok) {
              const md = await mr.json();
              messages = md.messages || [];
            }
            const last = messages[messages.length - 1];
            const unread = messages.filter((m) => m.direction === 'in' && !m.read).length;
            totalUnread += unread;
            enriched.push({ ...c, lastMessage: last, unread, messages });
          }
          setConversations(enriched);
          setUnreadCount(totalUnread);
          window.dispatchEvent(new CustomEvent('unread-count', { detail: { count: totalUnread } }));
        }
      } catch {}
      finally {
        setLoading(false);
      }
    })();
  }, []);


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
              </div>
              {aiConfig?.responseStyle && (
                <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium">
                  AI: {aiConfig.responseStyle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/messages/onlyfans" className="px-3 py-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl text-sm font-medium flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                OnlyFans
              </Link>
              {ofStatus && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ofStatus.connected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                  {ofStatus.connected ? 'OF Connected' : 'OF Not Connected'}
                </span>
              )}
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('first_message_started', '1');
                    trackEvent('messages_compose_click');
                  } catch {}
                }}
                className="rounded-xl flex items-center gap-2 hover:shadow-md transition-all bg-purple-600 text-white px-4 py-2"
              >
                <Send className="w-4 h-4" />
                <span>Compose</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <ResumeBanner />
        {/* Alert for no platform */}
        {!hasConnectedPlatforms && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <p className="text-amber-900 font-medium">
              🔗 Connect a platform to start messaging fans
            </p>
            <Link href="/platforms/connect" className="text-amber-700 text-sm hover:text-amber-800 underline">
              Connect now →
            </Link>
          </div>
        )}

        {/* Conversations List */}
        <div className="elevated-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Conversations</h3>
            {unreadCount > 0 && (<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{unreadCount} unread</span>)}
          </div>
          {loading ? (
            <div className="p-4 divide-y divide-gray-100" aria-hidden>
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      <div className="mt-2 h-3 w-64 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-700 mb-3">No conversations yet</p>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('first_message_started', '1');
                    trackEvent('kpi_empty_state_cta_click', { area: 'messages', action: 'first_message' });
                  } catch {}
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Send your first message
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {conversations.map((c) => {
                const last = c.lastMessage
                const fan = fans[c.fanId]
                const isUnread = last && last.direction === 'in' && !last.read
                const handleClick = async () => {
                  if (isUnread) {
                    try {
                      await fetch(`/api/messages/${last.id}/read`, { method: 'PATCH' })
                      setConversations((prev) => prev.map((cv) => {
                        if (cv.id !== c.id) return cv
                        const newMsgs = (cv.messages || []).map((m: any) => m.id === last.id ? { ...m, read: true } : m)
                        const newUnread = Math.max(0, (cv.unread || 0) - 1)
                        return { ...cv, messages: newMsgs, unread: newUnread, lastMessage: { ...last, read: true } }
                      }))
                      setUnreadCount((prev) => {
                        const next = Math.max(0, prev - 1)
                        window.dispatchEvent(new CustomEvent('unread-count', { detail: { count: next } }))
                        return next
                      })
                    } catch {}
                  }
                }
                const animated = lastInsertedId && last && last.id === lastInsertedId;
                return (
                  <Link key={c.id} href={`/messages/${c.id}`}>
                    <button onClick={handleClick} className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${animated ? 'new-message-enter' : ''}`}>
                    <div className="flex items-center gap-3">
                      <img src={fan?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan?.name || 'Fan')}&background=gradient`} alt={fan?.name} className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`truncate ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{fan?.name || c.fanId}</p>
                          {isUnread && <span className="ml-1 w-2 h-2 bg-red-500/90 rounded-full ring-2 ring-white" />}
                        </div>
                        {last ? (
                          <p className={`line-clamp-1 text-sm ${isUnread ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-700 dark:text-gray-400'}`}>{getMessagePreview(last)}</p>
                        ) : (
                          <p className="truncate text-sm text-gray-600 dark:text-gray-400">No messages yet</p>
                        )}
                      </div>
                    </div>
                  </button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* AI Status */}
        {hasConnectedPlatforms && (
          <div className="mt-6 elevated-card rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">AI Assistant Ready</p>
                <p className="text-sm text-gray-700 dark:text-gray-400">Handles routine messages automatically with your personalized style</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Active</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
