'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Users, 
  Target, 
  Lightbulb, 
  DollarSign,
  X,
  Send,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import './ai-assistant-panel.css';

// Types
export interface AITool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: AISuggestion[];
}

export interface AISuggestion {
  id: string;
  type: 'message' | 'content' | 'action';
  text: string;
  confidence: number;
}

export interface PageContext {
  currentPage: string;
  selectedFan?: { id: string; name: string };
  selectedContent?: { id: string; title: string };
}

export interface AIAssistantPanelProps {
  context?: PageContext;
  onToolSelect?: (toolId: string) => void;
  className?: string;
}

// AI Tools configuration
export const AI_TOOLS: AITool[] = [
  { 
    id: 'chat', 
    name: 'AI Chat', 
    description: 'Ask anything about your business',
    icon: <MessageSquare className="ai-tool-icon" />,
    href: '/ai/chat'
  },
  { 
    id: 'auto-reply', 
    name: 'Auto-Reply', 
    description: 'Automated fan responses',
    icon: <Bot className="ai-tool-icon" />,
    href: '/onlyfans/settings?tab=auto-reply'
  },
  { 
    id: 'segmentation', 
    name: 'Fan Segments', 
    description: 'AI-powered fan grouping',
    icon: <Users className="ai-tool-icon" />,
    href: '/analytics/fans?view=segments'
  },
  { 
    id: 'campaigns', 
    name: 'Campaign Gen', 
    description: 'Create AI campaigns',
    icon: <Target className="ai-tool-icon" />,
    href: '/marketing/campaigns/new'
  },
  { 
    id: 'insights', 
    name: 'Insights', 
    description: 'AI-powered analytics',
    icon: <Lightbulb className="ai-tool-icon" />,
    href: '/analytics?tab=insights'
  },
  { 
    id: 'pricing', 
    name: 'Pricing', 
    description: 'Optimize your prices',
    icon: <DollarSign className="ai-tool-icon" />,
    href: '/analytics/pricing'
  }
];

// Suggested prompts for chat
const SUGGESTED_PROMPTS = [
  "What's my best performing content this week?",
  "Which fans are at risk of churning?",
  "Suggest a PPV price for my new content",
  "Help me write a message to my top fans"
];

export type AIAssistantTab = 'chat' | 'tools' | 'insights';

export function AIAssistantPanel({ 
  context,
  onToolSelect,
  className = ''
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AIAssistantTab>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle keyboard shortcut (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleTabChange = useCallback((tab: AIAssistantTab) => {
    setActiveTab(tab);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: context
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.data?.response || data.response || 'I apologize, I could not process your request.',
        timestamp: new Date(),
        suggestions: data.data?.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, context]);

  const handlePromptClick = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  const handleToolClick = useCallback((tool: AITool) => {
    if (onToolSelect) {
      onToolSelect(tool.id);
    }
    if (tool.href) {
      window.location.href = tool.href;
    }
  }, [onToolSelect]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <>
      {/* Persistent AI Button */}
      <button
        className="ai-assistant-button"
        onClick={handleToggle}
        aria-label="Open AI Assistant"
        aria-expanded={isOpen}
        data-testid="ai-assistant-button"
      >
        <Sparkles className="ai-button-icon" />
        <span className="ai-button-label">AI</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="ai-panel-backdrop"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Panel */}
      <div 
        className={`ai-assistant-panel ${isOpen ? 'ai-panel-open' : ''} ${className}`}
        role="dialog"
        aria-label="AI Assistant"
        aria-hidden={!isOpen}
      >
        {/* Panel Header */}
        <div className="ai-panel-header">
          <div className="ai-panel-title">
            <Sparkles className="ai-panel-title-icon" />
            <span>AI Assistant</span>
          </div>
          <button 
            className="ai-panel-close"
            onClick={handleClose}
            aria-label="Close AI Assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="ai-panel-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'chat'}
            className={`ai-panel-tab ${activeTab === 'chat' ? 'ai-tab-active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            <MessageSquare size={16} />
            Chat
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'tools'}
            className={`ai-panel-tab ${activeTab === 'tools' ? 'ai-tab-active' : ''}`}
            onClick={() => handleTabChange('tools')}
          >
            <Sparkles size={16} />
            Tools
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'insights'}
            className={`ai-panel-tab ${activeTab === 'insights' ? 'ai-tab-active' : ''}`}
            onClick={() => handleTabChange('insights')}
          >
            <Lightbulb size={16} />
            Insights
          </button>
        </div>

        {/* Tab Content */}
        <div className="ai-panel-content">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="ai-chat-container">
              {/* Messages */}
              <div className="ai-chat-messages">
                {messages.length === 0 ? (
                  <div className="ai-chat-empty">
                    <Sparkles className="ai-chat-empty-icon" />
                    <p className="ai-chat-empty-title">How can I help you today?</p>
                    <p className="ai-chat-empty-subtitle">
                      Ask me anything about your fans, content, or business.
                    </p>
                    <div className="ai-suggested-prompts">
                      {SUGGESTED_PROMPTS.map((prompt, index) => (
                        <button
                          key={index}
                          className="ai-suggested-prompt"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          {prompt}
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`ai-chat-message ai-message-${message.role}`}
                    >
                      <div className="ai-message-content">
                        {message.content}
                      </div>
                      <div className="ai-message-time">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="ai-chat-message ai-message-assistant ai-message-loading">
                    <div className="ai-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="ai-chat-input-container">
                <textarea
                  className="ai-chat-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask AI anything..."
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  className="ai-chat-send"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="ai-tools-container">
              <p className="ai-tools-description">
                Access all AI-powered features to grow your business.
              </p>
              <div className="ai-tools-grid" data-testid="ai-tools-grid">
                {AI_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    className="ai-tool-card"
                    onClick={() => handleToolClick(tool)}
                    data-tool-id={tool.id}
                  >
                    <div className="ai-tool-icon-wrapper">
                      {tool.icon}
                    </div>
                    <div className="ai-tool-info">
                      <span className="ai-tool-name">{tool.name}</span>
                      <span className="ai-tool-description">{tool.description}</span>
                    </div>
                    <ChevronRight className="ai-tool-arrow" size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="ai-insights-container">
              <div className="ai-insight-card ai-insight-revenue">
                <div className="ai-insight-header">
                  <DollarSign className="ai-insight-icon" />
                  <span className="ai-insight-title">Revenue Insight</span>
                </div>
                <p className="ai-insight-text">
                  Your PPV sales increased 23% this week. Consider creating more exclusive content.
                </p>
                <Button variant="outline" size="sm" className="ai-insight-action">
                  View Details
                </Button>
              </div>

              <div className="ai-insight-card ai-insight-fans">
                <div className="ai-insight-header">
                  <Users className="ai-insight-icon" />
                  <span className="ai-insight-title">Fan Insight</span>
                </div>
                <p className="ai-insight-text">
                  5 fans haven't engaged in 7 days. Send them a personalized message to re-engage.
                </p>
                <Button variant="outline" size="sm" className="ai-insight-action">
                  View At-Risk Fans
                </Button>
              </div>

              <div className="ai-insight-card ai-insight-content">
                <div className="ai-insight-header">
                  <Target className="ai-insight-icon" />
                  <span className="ai-insight-title">Content Insight</span>
                </div>
                <p className="ai-insight-text">
                  Your best posting time is 8 PM EST. Schedule your next post for maximum engagement.
                </p>
                <Button variant="outline" size="sm" className="ai-insight-action">
                  Schedule Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AIAssistantPanel;
