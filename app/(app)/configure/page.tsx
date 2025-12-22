'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function ConfigurePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    personality: '',
    responseStyle: 'friendly',
    pricing: {
      monthlyPrice: '',
      welcomeMessage: '',
    },
    customResponses: [],
  });

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/ai/config');
      if (!response.ok) {
        setLoadError('Failed to load configuration');
        return;
      }
      const data = await response.json();
      setConfig(data);
    } catch {
      setLoadError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setSaveError('Failed to save configuration');
      }
    } catch {
      setSaveError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="shadow-sm border-b" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configure AI Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-300">
            Loading configuration…
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-4">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={loadConfig}
              className="text-sm font-medium text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personality Section */}
          <Card className="rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Personality</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="personality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How should your AI assistant behave?
                </label>
                <textarea
                  id="personality"
                  rows={4}
                  value={config.personality}
                  onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                  placeholder="Example: Be flirty and playful, use emojis, create a girlfriend experience..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] dark:bg-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="responseStyle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Style
                </label>
                <select
                  id="responseStyle"
                  value={config.responseStyle}
                  onChange={(e) => setConfig({ ...config, responseStyle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] dark:bg-gray-900 dark:text-white"
                >
                  <option value="friendly">Friendly & Casual</option>
                  <option value="flirty">Flirty & Playful</option>
                  <option value="professional">Professional</option>
                  <option value="dominant">Dominant</option>
                  <option value="submissive">Submissive</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Pricing Section */}
          <Card className="rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing & Welcome Message</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="monthlyPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Subscription Price ($)
                </label>
                <input
                  id="monthlyPrice"
                  type="number"
                  step="0.01"
                  value={config.pricing.monthlyPrice}
                  onChange={(e) => setConfig({
                    ...config,
                    pricing: { ...config.pricing, monthlyPrice: e.target.value }
                  })}
                  placeholder="9.99"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] dark:bg-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Welcome Message for New Subscribers
                </label>
                <textarea
                  id="welcomeMessage"
                  rows={3}
                  value={config.pricing.welcomeMessage}
                  onChange={(e) => setConfig({
                    ...config,
                    pricing: { ...config.pricing, welcomeMessage: e.target.value }
                  })}
                  placeholder="Hey babe! 💕 Welcome to my exclusive content..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2c6ecb] dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </Link>
            <Button variant="primary" type="submit" disabled={saving || loading}>
              <Save className="w-5 h-5" />
              {saving ? 'Saving…' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
