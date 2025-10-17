'use client';

import { useAIChat } from '@/hooks/useAIChat';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, DollarSign, MessageSquare, Sparkles, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';

export default function AIChatPage() {
  const { messages, loading, error, sendMessage, clearMessages, getTotalCost } = useAIChat({
    tone: 'professional',
    useCase: 'chat',
  });
  const router = useRouter();

  const totalMessages = messages.length;
  const userMessages = messages.filter(m => m.role === 'user').length;
  const aiMessages = messages.filter(m => m.role === 'assistant').length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">Huntaze AI Assistant</h1>
                <p className="text-sm text-muted-foreground">Powered by Azure OpenAI GPT-4o</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <button
                      onClick={() => router.push('/app/huntazeai/cheat-sheet')}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Cheat Sheet</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>View AI Permissions & Commands</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{totalMessages} messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(getTotalCost())}</span>
                </div>
              </div>
              
              {/* Clear button */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          loading={loading}
          onSendMessage={sendMessage}
          className="h-full"
        />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-destructive text-destructive-foreground rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
