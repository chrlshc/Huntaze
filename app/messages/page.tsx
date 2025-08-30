'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  ChevronLeft,
  Bot,
  Plus,
  Send
} from 'lucide-react';

export default function MessagesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const router = useRouter();

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
      } catch {}
    })();
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              </div>
              {aiConfig?.responseStyle && (
                <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium">
                  AI: {aiConfig.responseStyle}
                </span>
              )}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium">
              <Send className="w-4 h-4" />
              <span>Compose</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 max-w-7xl mx-auto">
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

        {/* Empty State */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl mb-6">
              <MessageSquare className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Start Meaningful Conversations</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
              {hasConnectedPlatforms 
                ? "Engage with your fans and let AI handle the routine messages"
                : "Connect a platform to start messaging with your community"}
            </p>
            
            <Link 
              href={hasConnectedPlatforms ? "/messages/compose" : "/platforms/connect"}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              {hasConnectedPlatforms ? "Send First Message" : "Connect Platform"}
            </Link>
          </div>
        </div>

        {/* AI Status */}
        {hasConnectedPlatforms && (
          <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">AI Assistant Ready</p>
                <p className="text-sm text-gray-600">Handles routine messages automatically with your personalized style</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Active</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
