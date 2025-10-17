'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  DollarSign, 
  Clock,
  Sparkles,
  MessageSquare,
  Send,
  Paperclip,
  Image,
  AlertCircle,
  CheckCheck,
  Check,
  Wand2,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FanCard, Fan } from './FanCard';
import { GhostwriterNetwork, MessageContext } from '@/lib/ai/ghostwriter-network';

interface Message {
  id: string;
  fanId: string;
  content: string;
  timestamp: Date;
  isFromFan: boolean;
  readStatus: 'unread' | 'read' | 'replied';
  hasMedia?: boolean;
  mediaPriceInfo?: {
    price: number;
    purchased: boolean;
  };
}

interface Conversation {
  fan: Fan;
  lastMessage: Message;
  unreadCount: number;
  priority: 'high' | 'medium' | 'low';
  aiSuggestion?: {
    action: string;
    confidence: number;
  };
}

interface AISuggestion {
  personality: string;
  message: string;
  confidence: number;
  upsellSuggestion?: {
    type: string;
    price: number;
  };
}

interface UnifiedInboxWithAIProps {
  conversations: Conversation[];
  onConversationSelect?: (conversation: Conversation) => void;
  onSendMessage?: (fanId: string, message: string) => Promise<void>;
  className?: string;
}

export function UnifiedInboxWithAI({ 
  conversations: initialConversations,
  onConversationSelect,
  onSendMessage,
  className 
}: UnifiedInboxWithAIProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'priority' | 'unread' | 'vip'>('all');
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<'seductive' | 'friendly' | 'playful'>('seductive');
  const [ghostwriter] = useState(() => new GhostwriterNetwork());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter conversations based on tab and search
  const filteredConversations = conversations.filter((conv) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        conv.fan.displayName.toLowerCase().includes(query) ||
        conv.fan.username.toLowerCase().includes(query) ||
        conv.lastMessage.content.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    switch (filterTab) {
      case 'priority':
        return conv.priority === 'high';
      case 'unread':
        return conv.unreadCount > 0;
      case 'vip':
        return conv.fan.tier === 'vip';
      default:
        return true;
    }
  });

  // Generate AI suggestions when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.lastMessage.isFromFan) {
      generateAISuggestions();
    }
  }, [selectedConversation]);

  const generateAISuggestions = async () => {
    if (!selectedConversation) return;
    
    setGeneratingAI(true);
    setAiSuggestions([]);

    const context: MessageContext = {
      fanId: selectedConversation.fan.id,
      fanData: {
        name: selectedConversation.fan.displayName,
        totalSpent: selectedConversation.fan.totalSpent,
        interests: ['exclusive content', 'personal messages', 'custom videos'],
        messageHistory: [
          { role: 'user', content: selectedConversation.lastMessage.content, timestamp: new Date() }
        ],
        lastPurchase: selectedConversation.fan.lastPurchase,
        tier: selectedConversation.fan.tier
      },
      creatorProfile: {
        name: 'Creator',
        bio: 'Exclusive content creator',
        contentTypes: ['photos', 'videos', 'live streams'],
        boundaries: ['no meetups', 'respectful only']
      }
    };

    try {
      // Generate suggestions for each personality
      const personalities: Array<'seductive' | 'friendly' | 'playful'> = ['seductive', 'friendly', 'playful'];
      const suggestions: AISuggestion[] = [];

      for (const personality of personalities) {
        const response = await ghostwriter.generateResponse(
          personality,
          context,
          selectedConversation.lastMessage.content
        );

        suggestions.push({
          personality,
          message: response.message,
          confidence: response.confidence,
          upsellSuggestion: response.suggestedUpsell ? {
            type: response.suggestedUpsell.type,
            price: response.suggestedUpsell.price
          } : undefined
        });
      }

      setAiSuggestions(suggestions);
      // Auto-select the personality with highest confidence
      const bestSuggestion = suggestions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      setSelectedSuggestion(bestSuggestion);
      setSelectedPersonality(bestSuggestion.personality as any);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !onSendMessage) return;

    setSending(true);
    try {
      await onSendMessage(selectedConversation.fan.id, messageInput);
      setMessageInput('');
      setSelectedSuggestion(null);
      setAiSuggestions([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleUseSuggestion = (suggestion: AISuggestion) => {
    setMessageInput(suggestion.message);
    setSelectedSuggestion(suggestion);
    textareaRef.current?.focus();
  };

  const handleCopySuggestion = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const getPriorityIcon = (priority: Conversation['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getReadStatusIcon = (status: Message['readStatus']) => {
    switch (status) {
      case 'replied':
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-gray-400" />;
      default:
        return <Check className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={cn('flex h-[800px] bg-white dark:bg-gray-900 rounded-lg shadow-sm', className)}>
      {/* Conversations List */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Unified Inbox
          </h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search fans or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-1 text-xs">
                  {conversations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="priority">
                <Star className="h-3 w-3 mr-1" />
                Priority
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="secondary" className="ml-1 text-xs">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="vip">
                VIP
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <AnimatePresence>
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.fan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors mb-2',
                    selectedConversation?.fan.id === conversation.fan.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    onConversationSelect?.(conversation);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {conversation.fan.avatar ? (
                          <img src={conversation.fan.avatar} alt={conversation.fan.displayName} />
                        ) : (
                          <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-full w-full flex items-center justify-center text-white font-semibold">
                            {conversation.fan.displayName[0].toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                      <div 
                        className={cn(
                          'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800',
                          conversation.fan.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {conversation.fan.displayName}
                          </h4>
                          {conversation.fan.tier === 'vip' && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {getPriorityIcon(conversation.priority)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(conversation.lastMessage.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {!conversation.lastMessage.isFromFan && 'You: '}
                          {conversation.lastMessage.content}
                        </p>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          {!conversation.lastMessage.isFromFan && 
                            getReadStatusIcon(conversation.lastMessage.readStatus)
                          }
                        </div>
                      </div>

                      {conversation.aiSuggestion && (
                        <div className="mt-2 flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            AI: {conversation.aiSuggestion.action}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {selectedConversation.fan.avatar ? (
                  <img src={selectedConversation.fan.avatar} alt={selectedConversation.fan.displayName} />
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-full w-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.fan.displayName[0].toUpperCase()}
                  </div>
                )}
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {selectedConversation.fan.displayName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${selectedConversation.fan.totalSpent}
                  </span>
                  <span>{selectedConversation.fan.subscriptionMonths} months</span>
                  {selectedConversation.fan.status === 'online' && (
                    <span className="text-green-500">● Online</span>
                  )}
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-sm">
                  <p className="text-sm">{selectedConversation.lastMessage.content}</p>
                  <span className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(selectedConversation.lastMessage.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI Suggestions
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={generateAISuggestions}
                  disabled={generatingAI}
                >
                  <RefreshCw className={cn("h-3 w-3", generatingAI && "animate-spin")} />
                </Button>
              </div>
              
              <Tabs value={selectedPersonality} onValueChange={(v) => setSelectedPersonality(v as any)}>
                <TabsList className="grid w-full grid-cols-3 mb-3">
                  <TabsTrigger value="seductive">🔥 Seductive</TabsTrigger>
                  <TabsTrigger value="friendly">😊 Friendly</TabsTrigger>
                  <TabsTrigger value="playful">😏 Playful</TabsTrigger>
                </TabsList>

                {generatingAI ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Wand2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-gray-500">Generating suggestions...</p>
                    </div>
                  </div>
                ) : (
                  aiSuggestions.map((suggestion) => (
                    <TabsContent 
                      key={suggestion.personality} 
                      value={suggestion.personality} 
                      className="mt-0"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                            {suggestion.message}
                          </p>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleCopySuggestion(suggestion.message)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleUseSuggestion(suggestion)}
                                  >
                                    <Wand2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Use this</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.confidence}% confidence
                            </Badge>
                            {suggestion.upsellSuggestion && (
                              <Badge variant="outline" className="text-xs">
                                💰 ${suggestion.upsellSuggestion.price} upsell
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))
                )}
              </Tabs>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Image className="h-4 w-4" />
              </Button>
              <Textarea
                ref={textareaRef}
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {selectedSuggestion && (
              <p className="text-xs text-gray-500 mt-2">
                Using {selectedSuggestion.personality} AI suggestion
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
}