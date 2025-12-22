'use client';

import React, { useEffect, useRef, useState } from 'react';
import FanNotesPanel from './FanNotesPanel';

interface Message {
  id: string;
  type: 'sent' | 'received';
  text: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp?: string;
  dayLabel?: string;
}

interface Chat {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: string;
  lastMessageTime: string;
  unreadCount?: number;
  subs: string;
  revenue: string;
  platform: string;
  userStatus: string;
  joined: string;
  username?: string;
  messages: Message[];
}

const mockChats: Record<string, Chat> = {
  '1': {
    id: '1',
    name: 'Alice Martin',
    email: 'alice@example.com',
    avatar: 'A',
    status: 'Online • 2 min',
    lastMessageTime: '2 min',
    unreadCount: 2,
    subs: '1,250',
    revenue: '$2,450',
    platform: 'OnlyFans',
    userStatus: 'Premium',
    joined: 'Nov 15, 2024',
    username: 'alice_m',
    messages: [
      { id: 'm1-1', type: 'received', text: 'Hey! How are you?', timestamp: '10:21', dayLabel: 'Today' },
      { id: 'm1-2', type: 'sent', text: 'Doing great! How about you?', status: 'read', timestamp: '10:22', dayLabel: 'Today' },
      { id: 'm1-3', type: 'received', text: 'Thanks for your help!', timestamp: '10:23', dayLabel: 'Today' }
    ]
  },
  '2': {
    id: '2',
    name: 'Bob Studio',
    email: 'bob@example.com',
    avatar: 'B',
    status: 'Online • 5 min',
    lastMessageTime: '5 min',
    unreadCount: 1,
    subs: '5,320',
    revenue: '$8,750',
    platform: 'OnlyFans',
    userStatus: 'Premium Plus',
    joined: 'Aug 2, 2024',
    username: 'bob_studio',
    messages: [
      { id: 'm2-1', type: 'received', text: 'Question about the features...', timestamp: '09:10', dayLabel: 'Today' },
      { id: 'm2-2', type: 'received', text: 'Do you have an API?', timestamp: '09:11', dayLabel: 'Today' }
    ]
  },
  '3': {
    id: '3',
    name: 'Clara Creator',
    email: 'clara@example.com',
    avatar: 'C',
    status: 'Offline • 30 min',
    lastMessageTime: '30 min',
    unreadCount: 0,
    subs: '3,890',
    revenue: '$5,200',
    platform: 'Patreon',
    userStatus: 'Starter',
    joined: 'Sep 22, 2024',
    username: 'clara_c',
    messages: [
      { id: 'm3-1', type: 'received', text: 'How do I access the dashboard?', timestamp: '15:40', dayLabel: 'Yesterday' }
    ]
  }
};

function ChatItem({ chat, isActive, onClick }: { chat: Chat; isActive: boolean; onClick: () => void }) {
  const lastMessage = chat.messages[chat.messages.length - 1]?.text ?? '';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'true' : 'false'}
      className={`
        flex w-full items-center px-4 py-4 text-left text-sm
        ${isActive ? "bg-white" : "bg-slate-50"}
        hover:bg-white transition-colors
      `}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
        {chat.avatar}
      </div>
      
      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900 truncate">{chat.name}</p>
          <span className="ml-2 text-xs text-slate-400">{chat.lastMessageTime}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-600 truncate">{lastMessage}</p>
      </div>
      
      {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold text-white">
          {chat.unreadCount}
        </span>
      )}
    </button>
  );
}

function MessageBubble({
  message,
  authorName,
}: {
  message: Message;
  authorName: string;
  isFirstOfGroup: boolean;
}) {
  const isMe = message.type === 'sent';

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {!isMe && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {authorName.charAt(0)}
          </div>
        )}
        
        <div
          className={`
            max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm
            ${isMe
              ? "text-white"
              : "bg-white text-slate-900 border border-slate-200"
            }
          `}
          style={
            isMe
              ? { backgroundColor: 'var(--color-accent-primary)' }
              : undefined
          }
        >
          <p>{message.text}</p>
          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-70">
            <span>{message.timestamp}</span>
            {isMe && message.status && (
              <span>
                {message.status === 'sending' && 'Sending...'}
                {message.status === 'sent' && 'Sent'}
                {message.status === 'delivered' && 'Delivered'}
                {message.status === 'read' && 'Read'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesComponent() {
  const [currentChat, setCurrentChat] = useState('1');
  const [messages, setMessages] = useState<Message[]>(mockChats['1'].messages);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isContactTyping, setIsContactTyping] = useState(false);

  const chats = Object.values(mockChats);
  const activeChat = mockChats[currentChat];

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectChat = (chatId: string) => {
    setCurrentChat(chatId);
    setMessages(mockChats[chatId].messages);
    setIsContactTyping(false);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: `local-${Date.now()}`,
        type: 'sent',
        text: inputValue,
        status: 'sending',
        timestamp: 'Now',
        dayLabel: 'Today',
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');

      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === newMessage.id ? { ...m, status: 'sent' } : m
          )
        );
      }, 400);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === newMessage.id ? { ...m, status: 'read' } : m
          )
        );
      }, 1200);

      setIsContactTyping(true);
      setTimeout(() => setIsContactTyping(false), 1800);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, activeChat.id]);

  return (
    <div className="flex flex-1 gap-4">
      {/* Left column: conversations list card */}
      <aside className="w-[320px] flex flex-col">
        <div className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <div className="border-b border-slate-100 px-4 py-3">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900"
            />
            {/* Simple filter chips under search */}
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <button className="px-2 py-1 rounded-full bg-slate-900 text-white font-medium">
                All
              </button>
              <button className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                Unread
              </button>
              <button className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                VIP
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={currentChat === chat.id}
                onClick={() => handleSelectChat(chat.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Center column: conversation card */}
      <section className="flex-1 flex flex-col">
        <div className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-col">
          {/* Conversation header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white flex-shrink-0">
                {activeChat.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {activeChat.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  @{activeChat.username ?? 'fan'} · {activeChat.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-slate-200 px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50">
                View profile
              </button>
              <button className="rounded-full border border-slate-200 px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50">
                Add note
              </button>
            </div>
          </header>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50"
            role="log"
            aria-label={`Conversation history with ${activeChat.name}`}
            aria-live="polite"
            tabIndex={0}
          >
            {messages.map((message, idx) => {
              const previous = idx > 0 ? messages[idx - 1] : undefined;
              const showDaySeparator =
                message.dayLabel && message.dayLabel !== previous?.dayLabel;

              return (
                <React.Fragment key={message.id}>
                  {showDaySeparator && (
                    <div className="flex items-center justify-center">
                      <span className="px-4 py-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-full">
                        {message.dayLabel}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    authorName={activeChat.name}
                    isFirstOfGroup={false}
                  />
                </React.Fragment>
              );
            })}

            {isContactTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-[10px] font-semibold text-slate-700">
                  {activeChat.avatar}
                </div>
                <div className="flex items-center gap-1">
                  <span>{activeChat.name} is typing</span>
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <footer className="border-t border-slate-200 bg-white px-4 py-3">
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Write a message..."
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="rounded-full px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </form>
          </footer>
        </div>
      </section>

      {/* Right column: notes card */}
      <aside className="w-[280px] flex flex-col">
        <div className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col">
          <FanNotesPanel
            key={activeChat.id}
            fanId={activeChat.id}
            fanName={activeChat.name}
            fanUsername={activeChat.username}
            fanAvatar={activeChat.avatar}
          />
        </div>
      </aside>
    </div>
  );
}
