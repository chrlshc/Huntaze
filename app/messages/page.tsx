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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold">Messages</h1>
              {aiConfig?.responseStyle && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  AI: {aiConfig.responseStyle}
                </span>
              )}
            </div>

            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              <Send className="w-4 h-4 inline mr-1" />
              Compose
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Alert for no platform */}
        {!hasConnectedPlatforms && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <Link href="/platforms/connect" className="text-amber-800">
              Connect a platform to start messaging →
            </Link>
          </div>
        )}

        {/* Empty State */}
        <div className="bg-white rounded-lg border p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
          <p className="text-gray-600 mb-6">
            {hasConnectedPlatforms 
              ? "Your messages will appear here"
              : "Connect a platform to start messaging"}
          </p>
          
          <Link 
            href={hasConnectedPlatforms ? "/messages/compose" : "/platforms/connect"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            {hasConnectedPlatforms ? "Send First Message" : "Connect Platform"}
          </Link>
        </div>

        {/* AI Status */}
        {hasConnectedPlatforms && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">AI Assistant Ready</p>
                <p className="text-sm text-purple-700">Handles routine messages automatically</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
