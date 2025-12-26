'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft,
  Send,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Bot,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import QuickRepliesBar from '@/components/quick-replies-bar';
import { formatBytes } from '@/lib/utils';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [fan, setFan] = useState<any>(null);
  const [fanId, setFanId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        // Load conversation messages
        const mr = await fetch(`/api/crm/conversations/${conversationId}/messages`);
        if (mr.ok) {
          const data = await mr.json();
          setMessages(data.messages || []);
          
          // Mark unread messages as read
          const unreadIds = (data.messages || [])
            .filter((m: any) => m.direction === 'in' && !m.read)
            .map((m: any) => m.id);
            
          for (const id of unreadIds) {
            await fetch(`/api/messages/${id}/read`, { method: 'PATCH' });
          }
          
          // Update unread count
          if (unreadIds.length > 0) {
            const ur = await fetch('/api/messages/unread-count');
            if (ur.ok) {
              const { count } = await ur.json();
              window.dispatchEvent(new CustomEvent('unread-count', { detail: { count } }));
            }
          }
        }
        
        // Load fan info
        const cr = await fetch(`/api/crm/conversations/${conversationId}`);
        if (cr.ok) {
          const conv = await cr.json();
          setFanId(conv.fanId);
          const fr = await fetch('/api/crm/fans');
          if (fr.ok) {
            const fansData = await fr.json();
            const fanData = fansData.fans?.find((f: any) => f.id === conv.fanId);
            setFan(fanData);
          }
        }
      } catch (e) {
        console.error('Error loading conversation:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);
  
  // Live message insertion and typing
  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (!detail || detail.type !== 'new-message') return;
      if (detail.conversationId !== conversationId) return;
      const { message } = detail;
      setMessages(prev => [...prev, message]);
    };
    const handleTyping = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (detail.conversationId !== conversationId) return;
      if (detail.type === 'typing-start') setTyping(true);
      if (detail.type === 'typing-stop') setTyping(false);
    };
    window.addEventListener('new-message', handleNewMessage as EventListener);
    window.addEventListener('typing-start', handleTyping as EventListener);
    window.addEventListener('typing-stop', handleTyping as EventListener);
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener);
      window.removeEventListener('typing-start', handleTyping as EventListener);
      window.removeEventListener('typing-stop', handleTyping as EventListener);
    };
  }, [conversationId]);

  // Auto-scroll management
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Alt+1..5 quick replies, Shift+Alt to send
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const num = parseInt(e.key, 10);
      if (!num || num < 1 || num > Math.min(5, quickReplies.length)) return;
      const tmpl = quickReplies[num - 1];
      if (!tmpl) return;
      const text = tmpl.replace(/\{\s*name\s*\}/gi, fan?.name || 'there');
      e.preventDefault();
      if (e.shiftKey) {
        setInputText(text);
        setTimeout(() => sendMessage(), 0);
      } else {
        setInputText(text);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [quickReplies, fan]);

  const sendMessage = async (opts?: { attachments?: any[] }) => {
    if ((!(opts?.attachments) || opts.attachments.length === 0) && (!inputText.trim() || sending)) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    try {
      const res = await fetch(`/api/crm/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, direction: 'out', fanId, attachments: opts?.attachments || [] })
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || data;
        setMessages(prev => [...prev, msg]);
      }
    } catch (e) {
      console.error('Error sending message:', e);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();
  const handleDocClick = () => docInputRef.current?.click();

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (!res.ok) return;
      const data = await res.json();
      const attachment = { id: data.url, type: 'image', url: data.url, name: data.name, size: data.size };
      await sendMessage({ attachments: [attachment] });
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleDocSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (!res.ok) return;
      const data = await res.json();
      const isImage = (data.type || '').startsWith('image/');
      const attachment = { id: data.url, type: isImage ? 'image' as const : 'file' as const, url: data.url, name: data.name, size: data.size };
      await sendMessage({ attachments: [attachment] });
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = new Intl.DateTimeFormat(navigator.language, { hour: 'numeric', minute: '2-digit' }).format(date);
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return new Intl.DateTimeFormat(navigator.language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  const getMessageStatus = (msg: any) => {
    if (msg.direction === 'in') return null;
    if (msg.read) return <CheckCheck className="w-4 h-4 text-blue-500" />;
    if (msg.delivered) return <CheckCheck className="w-4 h-4 text-gray-400" />;
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  const isBlocked = !!fan?.tags?.includes('blocked');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img 
              src={fan?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan?.name || 'Fan')}&background=gradient`}
              alt={fan?.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                {fan?.name || 'Loading...'}
                {fan?.tags?.includes('vip') && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">VIP</span>
                )}
              </h1>
              {typing ? (
                <p className="text-sm text-purple-600">typing…</p>
              ) : fan?.lastActive ? (
                <p className="text-sm text-gray-500">Active {fan.lastActive}</p>
              ) : null}
            </div>
          </div>
          <div className="relative">
            <button className="p-2" onClick={() => setMenuOpen((o) => !o)}>
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 z-50">
                <button
                  onClick={async () => {
                    if (!fan) return;
                    const tags: string[] = Array.isArray(fan.tags) ? [...fan.tags] : [];
                    const hasVip = tags.includes('vip');
                    const nextTags = hasVip ? tags.filter(t => t !== 'vip') : [...tags, 'vip'];
                    const res = await fetch(`/api/crm/fans/${fan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: nextTags }) });
                    if (res.ok) {
                      const { fan: updated } = await res.json();
                      setFan(updated);
                    }
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {fan?.tags?.includes('vip') ? 'Remove VIP' : 'Mark as VIP'}
                </button>
                <button
                  onClick={async () => {
                    if (!fan) return;
                    const tags: string[] = Array.isArray(fan.tags) ? [...fan.tags] : [];
                    const nextTags = tags.includes('blocked') ? tags.filter(t => t !== 'blocked') : [...tags, 'blocked'];
                    const res = await fetch(`/api/crm/fans/${fan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: nextTags }) });
                    if (res.ok) {
                      const { fan: updated } = await res.json();
                      setFan(updated);
                    }
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {fan?.tags?.includes('blocked') ? 'Unblock user' : 'Block user'}
                </button>
              </div>
            )}
          </div>
        </div>
        {isBlocked && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            <p className="text-sm font-medium">User blocked — messages are disabled</p>
            <button
              className="text-sm font-semibold underline hover:no-underline"
              onClick={async () => {
                if (!fan) return;
                const tags: string[] = Array.isArray(fan.tags) ? [...fan.tags] : [];
                const nextTags = tags.filter(t => t !== 'blocked');
                const res = await fetch(`/api/crm/fans/${fan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: nextTags }) });
                if (res.ok) {
                  const { fan: updated } = await res.json();
                  setFan(updated);
                }
              }}
            >
              Unblock
            </button>
          </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {loading ? (
          <div className="text-center text-gray-600">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-600">No messages yet</div>
        ) : (
          messages
            .filter((m) => !searchQuery || (m.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
            .map((msg) => {
              const isIncoming = msg.direction === 'in';
              return (
                <div key={msg.id} className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex items-end gap-2 max-w-[82%] ${isIncoming ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Avatar */}
                    <img 
                      src={(isIncoming ? fan?.avatar : undefined) || `https://ui-avatars.com/api/?name=${encodeURIComponent(isIncoming ? fan?.name || 'Fan' : 'You')}&background=gradient`}
                      alt={isIncoming ? fan?.name : 'You'}
                      className="w-8 h-8 rounded-full"
                    />
                    {/* Bubble */}
                    <div className={`px-4 py-2 rounded-2xl ${
                      isIncoming
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                        : 'bg-purple-600 text-white rounded-br-none shadow-sm'
                    }`}>
                      {msg.attachments && msg.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {msg.attachments.filter((a: any) => a.type === 'image').map((a: any) => (
                            <img key={a.id} src={a.url} alt={a.name || 'image'} className="rounded-lg max-w-full h-auto" />
                          ))}
                          {msg.attachments.filter((a: any) => a.type !== 'image').map((a: any) => (
                            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isIncoming ? 'bg-gray-100 text-gray-800' : 'bg-white/10 text-white'} hover:opacity-90 transition`}>
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm truncate max-w-[220px]">{a.name || 'Attachment'}{typeof a.size === 'number' ? ` • ${formatBytes(a.size)}` : ''}</span>
                            </a>
                          ))}
                          {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      )}
                      {msg.aiGenerated && (
                        <div className="flex items-center gap-1 mt-1 opacity-80">
                          <Bot className="w-3 h-3" />
                          <span className="text-xs">AI</span>
                        </div>
                      )}
                    </div>
                    {!isIncoming && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getMessageStatus(msg)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}

        {typing && (
          <div className="flex items-center gap-2">
            <img 
              src={fan?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan?.name || 'Fan')}&background=gradient`}
              alt={fan?.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <QuickRepliesBar fan={fan} onPick={(text) => setInputText(text)} onTemplatesChange={(arr) => setQuickReplies(arr)} />
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDocClick} disabled={isBlocked}>
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleImageClick} disabled={isBlocked}>
            <ImageIcon className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
          <input ref={docInputRef} type="file" onChange={handleDocSelected} className="hidden" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent min-h-[44px] disabled:opacity-50"
            disabled={sending || isBlocked}
          />
          <button 
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || sending || isBlocked}
            className={`p-2 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
              inputText.trim() && !sending
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
