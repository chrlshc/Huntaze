'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ofIntegrationApi, ofAiApi } from '@/src/lib/api';
import { ChevronLeft, MessageSquare, Bot, RefreshCw, Send } from 'lucide-react';
import ComplianceNotice from '@/components/compliance/ComplianceNotice';
import { useNotifications } from '@/components/notifications';

interface OfMessage {
  id: string;
  ofMessageId: string;
  sender?: string;
  content?: string;
  tipAmount?: number;
  messageDate: string;
}

export default function OnlyFansMessagesPage() {
  const [status, setStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [messages, setMessages] = useState<OfMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<Record<string, { id: string; reply: string; confidence: number; tone: string }>>({});
  const [syncing, setSyncing] = useState(false);
  const { showNotification } = useNotifications();

  useEffect(() => {
    (async () => {
      try {
        const [st, an, ms] = await Promise.all([
          ofIntegrationApi.status(),
          ofIntegrationApi.analytics('30d'),
          ofIntegrationApi.messages(undefined, 50),
        ]);
        setStatus(st);
        setAnalytics(an);
        setMessages(ms.messages || []);
      } catch (e) {
        // ignored
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const syncNow = async () => {
    setSyncing(true);
    try {
      await ofIntegrationApi.sync(['earnings', 'messages', 'subscribers']);
      const ms = await ofIntegrationApi.messages(undefined, 50);
      setMessages(ms.messages || []);
      const an = await ofIntegrationApi.analytics('30d');
      setAnalytics(an);
      showNotification({ type: 'success', title: 'Sync Complete', message: 'OnlyFans data has been refreshed.' });
    } catch (e: any) {
      showNotification({ type: 'error', title: 'Sync Failed', message: e?.message || 'An error occurred during sync.' });
    } finally {
      setSyncing(false);
    }
  };

  const getSuggestion = async (m: OfMessage) => {
    try {
      const res = await ofAiApi.suggest({ messageId: m.ofMessageId, messageText: m.content });
      if (res?.success) {
        setSuggestion(prev => ({
          ...prev,
          [m.id]: {
            id: res.suggestion.id,
            reply: res.suggestion.reply,
            confidence: res.suggestion.confidence,
            tone: res.suggestion.tone,
          }
        }));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {syncing && <div className="fixed top-0 left-0 right-0 h-1 bg-purple-600 animate-pulse z-50" />}
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/messages" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Messages</span>
              </Link>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">OnlyFans</h1>
              </div>
              {status && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.connected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                  {status.connected ? 'Connected' : 'Not Connected'}
                </span>
              )}
            </div>
            <button onClick={syncNow} disabled={syncing} className="rounded-xl flex items-center gap-2 hover:shadow-md transition-all bg-purple-600 text-white px-4 py-2 disabled:opacity-60">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing…' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 max-w-6xl mx-auto">
        <ComplianceNotice platform="OnlyFans" />
        {/* Connection banner */}
        {!status?.connected && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <p className="text-amber-900 font-medium">
              🔗 Connect OnlyFans to view your messages and analytics
            </p>
            <Link href="/platforms/connect" className="text-amber-700 text-sm hover:text-amber-800 underline">
              Connect now →
            </Link>
          </div>
        )}

        {/* Analytics cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="elevated-card rounded-xl p-6">
              <h3 className="text-sm text-gray-600">Total Earnings</h3>
              <p className="text-2xl font-bold text-green-600">${analytics.earnings?.total?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="elevated-card rounded-xl p-6">
              <h3 className="text-sm text-gray-600">Active Subscribers</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.subscribers?.active || 0}</p>
            </div>
            <div className="elevated-card rounded-xl p-6">
              <h3 className="text-sm text-gray-600">Messages (30d)</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.messages?.total || 0}</p>
            </div>
          </div>
        )}

        {/* Messages list */}
        <div className="elevated-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Messages</h3>
          </div>
          {loading ? (
            <div className="p-6 text-gray-600">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-gray-600">No messages yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{new Date(m.messageDate).toLocaleString()}</span>
                        {m.tipAmount ? (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Tip ${m.tipAmount.toFixed(2)}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-gray-900 whitespace-pre-line">{m.content || '(no content)'}</p>
                    </div>
                    <button onClick={() => getSuggestion(m)} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Suggest
                    </button>
                  </div>

                  {suggestion[m.id] && (
                    <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm">
                          <Bot className="w-4 h-4" />
                          <span>{Math.round(suggestion[m.id].confidence * 100)}% • {suggestion[m.id].tone}</span>
                        </div>
                      </div>
                      <textarea
                        className="w-full border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2 text-sm"
                        rows={3}
                        value={suggestion[m.id].reply}
                        onChange={(e) => setSuggestion(prev => ({ ...prev, [m.id]: { ...prev[m.id], reply: e.target.value } }))}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button disabled className="px-3 py-2 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Send (manual only)
                        </button>
                        <span className="text-xs text-gray-500">Manual send only — autopilot disabled</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
