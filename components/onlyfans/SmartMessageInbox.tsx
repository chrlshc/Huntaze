/**
 * Smart Message Inbox - Réponse rapide sans ouvrir la conv
 */

'use client';

import { useState } from 'react';
import { Send, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Fan {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  value: number;
}

interface QuickReply {
  fanId: string;
  expanded: boolean;
  suggestions: string[];
  loading: boolean;
}

export function SmartMessageInbox() {
  const [fans] = useState<Fan[]>([
    {
      id: 'fan_1',
      name: 'Sarah M.',
      avatar: '👩',
      lastMessage: 'Hey! How are you?',
      timestamp: new Date(Date.now() - 300000),
      unread: 2,
      value: 15000,
    },
    {
      id: 'fan_2',
      name: 'Emma L.',
      avatar: '👱‍♀️',
      lastMessage: 'Miss you babe 💕',
      timestamp: new Date(Date.now() - 600000),
      unread: 1,
      value: 8500,
    },
    {
      id: 'fan_3',
      name: 'Jessica K.',
      avatar: '👩‍🦰',
      lastMessage: 'Can I see more?',
      timestamp: new Date(Date.now() - 900000),
      unread: 3,
      value: 12000,
    },
  ]);

  const [quickReplies, setQuickReplies] = useState<Record<string, QuickReply>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const toggleQuickReply = async (fanId: string) => {
    const current = quickReplies[fanId];
    
    if (current?.expanded) {
      // Fermer
      setQuickReplies({
        ...quickReplies,
        [fanId]: { ...current, expanded: false },
      });
      return;
    }

    // Ouvrir et charger suggestions
    setQuickReplies({
      ...quickReplies,
      [fanId]: { fanId, expanded: true, suggestions: [], loading: true },
    });

    // Simuler appel API
    setTimeout(() => {
      setQuickReplies({
        ...quickReplies,
        [fanId]: {
          fanId,
          expanded: true,
          loading: false,
          suggestions: [
            "Hey! I'm doing great, thanks! 😊",
            "Missing you too babe! 💕",
            "Of course! Check your DMs 😘",
          ],
        },
      });
    }, 1000);
  };

  const sendQuickMessage = (fanId: string, text: string) => {
    console.log('Envoi à', fanId, ':', text);
    // Fermer après envoi
    setQuickReplies({
      ...quickReplies,
      [fanId]: { ...quickReplies[fanId], expanded: false },
    });
    setMessages({ ...messages, [fanId]: '' });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      
      <div className="space-y-2">
        {fans.map((fan) => {
          const quickReply = quickReplies[fan.id];
          const isExpanded = quickReply?.expanded;

          return (
            <div
              key={fan.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Fan Row */}
              <div className="p-4 flex items-center gap-4">
                <div className="relative">
                  <div className="text-4xl">{fan.avatar}</div>
                  {fan.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {fan.unread}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{fan.name}</h3>
                    <span className="text-xs text-gray-500">
                      {fan.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {fan.lastMessage}
                  </p>
                </div>

                <Button 
                  variant="primary" 
                  onClick={() => toggleQuickReply(fan.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Réponse rapide</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Quick Reply Panel */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                  {quickReply.loading ? (
                    <div className="text-center py-4 text-gray-600">
                      ⏳ Génération de suggestions...
                    </div>
                  ) : (
                    <>
                      {/* Suggestions */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Suggestions AI
                        </p>
                        {quickReply.suggestions.map((suggestion, idx) => (
                          <Button 
                            key={idx}
                            variant="secondary" 
                            onClick={() => setMessages({ ...messages, [fan.id]: suggestion })}
                            className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                          >
                            <p className="text-sm text-gray-900">{suggestion}</p>
                          </Button>
                        ))}
                      </div>

                      {/* Custom Message */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messages[fan.id] || ''}
                          onChange={(e) =>
                            setMessages({ ...messages, [fan.id]: e.target.value })
                          }
                          placeholder="Ou écrivez votre message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && messages[fan.id]) {
                              sendQuickMessage(fan.id, messages[fan.id]);
                            }
                          }}
                        />
                        <Button 
                          variant="primary" 
                          onClick={() => sendQuickMessage(fan.id, messages[fan.id])}
                          disabled={!messages[fan.id]}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
