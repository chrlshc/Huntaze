'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft,
  Send,
  MoreVertical,
  Image,
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
  
  // Live message insertion
  useEffect(() => {
    const handleNewMessage = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (!detail || detail.type !== 'new-message') return;
      if (detail.conversationId !== conversationId) return;
      
      const { message } = detail;
      setMessages(prev => [...prev, message]);
      
      // Mark as read if visible
      if (document.visibilityState === 'visible') {
        fetch(`/api/messages/${message.id}/read`, { method: 'PATCH' }).then(() => {
          const ur = fetch('/api/messages/unread-count');
          ur.then(r => r.json()).then(({ count }) => {
            window.dispatchEvent(new CustomEvent('unread-count', { detail: { count } }));
          });
        });
      }
    };
    
    // Typing indicator
    const handleTyping = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (detail.conversationId !== conversationId) return;
      
      if (detail.type === 'typing-start') {
        setTyping(true);
      } else if (detail.type === 'typing-stop') {
        setTyping(false);
      }
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
  
  // Scroll to bottom when new messages arrive (if auto-scroll is on)
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Keyboard shortcuts for quick replies: Alt+1..5 insert; Shift+Alt+1..5 send
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
        // send immediately
        setInputText(text);
        setTimeout(() => {
          // ensure state update applied
          // @ts-ignore
          sendMessage();
        }, 0);
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
      setInputText(text); // Restore on error
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
    
    const timeStr = new Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
    
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    
    return new Intl.DateTimeFormat(navigator.language, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };
  
  const getMessageStatus = (msg: any) => {
    if (msg.direction === 'in') return null;
    if (msg.read) return <CheckCheck className="w-4 h-4 text-blue-500" />;
    if (msg.delivered) return <CheckCheck className="w-4 h-4 text-gray-400" />;
    return <Check className="w-4 h-4 text-gray-400" />;
  };
  
  const isBlocked = !!fan?.tags?.includes('blocked');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/90 supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={fan?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan?.name || 'Fan')}&background=gradient`}
              alt={fan?.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 flex items-center gap-2">
                {fan?.name || 'Loading...'}
                {fan?.tags?.includes('vip') && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">VIP</span>
                )}
              </h1>
              {typing ? (
                <p className="text-sm text-purple-600">typing...</p>
              ) : fan?.lastActive ? (
                <p className="text-sm text-gray-500">Active {fan.lastActive}</p>
              ) : null}
            </div>
          </div>
          <div className="relative">
            <button className="p-2" onClick={() => setMenuOpen((o) => !o)}>
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl ring-1 ring-black/5 z-50 transform transition-all duration-160 origin-top-right" style={{ transform: menuOpen ? 'scale(1)' : 'scale(0.95)', opacity: menuOpen ? '1' : '0' }}>
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
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
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
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
        <div className="mt-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in conversation..."
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </header>
      
      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 scroll-pb-28"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-atomic="false"
      >
        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4" aria-hidden>
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm px-4 py-3">
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="mt-2 h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && (
        {(searchQuery ? messages.filter(m => (m.text || '').toLowerCase().includes(searchQuery.toLowerCase())) : messages).map((msg, idx, arr) => {
          const isIncoming = msg.direction === 'in';
          const prevMsg = arr[idx-1];
          const nextMsg = arr[idx+1];
          const showTime = idx === 0 || (prevMsg && (
            new Date(msg.timestamp || msg.createdAt).getTime() - new Date(prevMsg.timestamp || prevMsg.createdAt).getTime() > 300000
          )); // 5 min gap
          const sameAuthor = prevMsg && prevMsg.direction === msg.direction;
          const isLastInGroup = !nextMsg || nextMsg.direction !== msg.direction;
          
          return (
            <div key={msg.id} className={sameAuthor && !showTime ? 'mt-1' : 'mt-4'}>
              {showTime && (
                <div className="text-center text-xs text-gray-600 font-medium my-4">
                  {formatTime(msg.timestamp || msg.createdAt)}
                </div>
              )}
              <div className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} items-end gap-2`}>
                {isIncoming && (
                  <img 
                    src={fan?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan?.name || 'Fan')}&background=gradient`}
                    alt={fan?.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className={`
                  max-w-[70%] lg:max-w-[60%] px-4 py-2 rounded-2xl
                  ${isIncoming 
                    ? 'bg-white text-gray-900 rounded-bl-none shadow-sm ring-1 ring-black/5' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-md'
                  }
                  ${msg.id === messages[messages.length - 1]?.id ? 'new-message-enter' : ''}
                `}>
                  {msg.attachments && msg.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {msg.attachments.filter((a: any) => a.type === 'image').map((a: any) => (
                        <img key={a.id} src={a.url} alt={a.name || 'image'} className="rounded-lg max-w-full h-auto" />
                      ))}
                      {msg.attachments.filter((a: any) => a.type !== 'image').map((a: any) => (
                        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isIncoming ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'} hover:opacity-90 transition`}>
                          <Paperclip className="w-4 h-4" />
                          <span className="text-sm truncate max-w-[220px]">{a.name || 'Attachment'}{typeof a.size === 'number' ? ` • ${formatBytes(a.size)}` : ''}</span>
                        </a>
                      ))}
                      {msg.text && <p className="text-sm">{msg.text}</p>}
                    </div>
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                  {msg.aiGenerated && (
                    <div className="flex items-center gap-1 mt-1 opacity-70">
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
        })}
        )}
        
        {typing && (
          <div className="flex items-center gap-2">
            <img 
              src={fan?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fan?.name || 'Fan')}&background=gradient`}
              alt={fan?.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none shadow-sm ring-1 ring-black/5">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4 safe-bottom space-y-3">
        <QuickRepliesBar fan={fan} onPick={(text) => setInputText(text)} onTemplatesChange={(arr) => setQuickReplies(arr)} />
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDocClick} disabled={isBlocked}>
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-200 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleImageClick} disabled={isBlocked}>
            <Image className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
          <input ref={docInputRef} type="file" onChange={handleDocSelected} className="hidden" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] disabled:opacity-50"
            disabled={sending || isBlocked}
          />
          <button 
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || sending || isBlocked}
            className={`p-2 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
              inputText.trim() && !sending
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
