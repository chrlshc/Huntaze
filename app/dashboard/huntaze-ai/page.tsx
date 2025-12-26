'use client';

import React, { useState, useRef, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { Send, Plus, User, Bot, Menu, Sun, Moon, MessageSquare } from 'lucide-react';

type UIMessage = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
};

type Conversation = {
  id: number;
  title: string;
  date: string;
  messages: UIMessage[];
};

export default function DashboardHuntazeAIPage() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, title: 'VIP Analysis', date: "Today", messages: [] },
    { id: 2, title: 'Content Strategy', date: 'Yesterday', messages: [] },
  ]);
  const [activeConversation, setActiveConversation] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: UIMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let responseText = "I'll analyze your data and provide detailed insights.";
      const lower = newMessage.text.toLowerCase();
      if (lower.includes('vip')) {
        responseText = "Based on my analysis, you have several inactive VIPs. I recommend a personalized re-engagement campaign. Would you like me to generate the messages?";
      } else if (lower.includes('revenue') || lower.includes('revenu')) {
        responseText = "Your current revenue is progressing. For +30%, I suggest: +15% on performing PPV, 2 premium bundles, and post-purchase upsells.";
      } else if (lower.includes('content') || lower.includes('contenu')) {
        responseText = "Recommended schedule: Mon/Wed/Fri (teasing), Tue/Thu (PPV), Weekend (live/bundle).";
      }
      const aiResponse: UIMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = () => {
    const newConv: Conversation = {
      id: Date.now(),
      title: 'New conversation',
      date: 'Now',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv.id);
    setMessages([]);
  };

  const examplePrompts = [
    "📊 Analyze my inactive VIP fans",
    "💰 How to increase my revenue by 30%",
    "📅 Create a content calendar",
    "🎯 Re-engagement strategy",
  ];

  return (
    <DashboardShell>
      <div className={`flex h-[calc(100vh-4rem)] ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-xl overflow-hidden`}>
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} ${darkMode ? 'bg-gray-950' : 'bg-gray-900'} transition-all duration-300 overflow-hidden flex flex-col`}>
          <div className="p-3 border-b border-gray-800">
            <button onClick={startNewChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-sm text-gray-100">
              <Plus size={16} />
              New conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-xs text-gray-500 px-3 py-1">Today</div>
            {conversations.filter(c => c.date === "Today" || c.date === 'Now').map(conv => (
              <button key={conv.id} onClick={() => setActiveConversation(conv.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeConversation === conv.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50'}`}>
                <MessageSquare size={14} />
                <span className="truncate flex-1">{conv.title}</span>
              </button>
            ))}
            <div className="text-xs text-gray-500 px-3 py-1 pt-3">Yesterday</div>
            {conversations.filter(c => c.date === 'Yesterday').map(conv => (
              <button key={conv.id} onClick={() => setActiveConversation(conv.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeConversation === conv.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50'}`}>
                <MessageSquare size={14} />
                <span className="truncate flex-1">{conv.title}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800">
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">Settings</button>
          </div>
        </div>

        {/* Main column */}
        <div className="flex-1 flex flex-col">
          {/* Header inside card */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Menu size={20} />
              </button>
              <span className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Huntaze AI Assistant</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Messages area */}
          <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {messages.length === 0 ? (
              <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">HA</span>
                  </div>
                  <h1 className={`text-3xl font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>How can I help you today?</h1>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {examplePrompts.map((prompt, index) => (
                    <button key={index} onClick={() => setInput(prompt.substring(2))} className={`p-4 rounded-xl text-left transition-all hover:shadow-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      <div className="text-sm">{prompt}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.map((message) => (
                  <div key={message.id} className={`mb-6 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-purple-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'}`}>
                        {message.sender === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 ${message.sender === 'user' ? darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900' : darkMode ? 'bg-gray-700/50 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{message.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className={`border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="max-w-3xl mx-auto p-4">
              <div className={`relative rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} shadow-sm`}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send a message to Huntaze AI..."
                  className={`w-full px-4 py-3 pr-12 bg-transparent resize-none outline-none text-sm ${darkMode ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                  rows={1}
                  style={{ maxHeight: '120px' }}
                />
                <button onClick={sendMessage} disabled={!input.trim()} className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all ${input.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'}`}> 
                  <Send size={18} />
                </button>
              </div>
              <p className={`text-xs text-center mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Huntaze AI can make mistakes. Verify important information.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

