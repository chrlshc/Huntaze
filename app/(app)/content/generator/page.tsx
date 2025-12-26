'use client';

/**
 * Content Generator Page
 * AI-powered content generation for creators
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyEmptyState } from '@/components/ui/shopify';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';

interface GenerationType {
  id: string;
  name: string;
  description: string;
}

interface GeneratedContent {
  type: string;
  content: Record<string, unknown>;
  metadata: {
    platform: string;
    tone: string;
    generatedAt: string;
  };
}

export default function ContentGeneratorPage() {
  const [types, setTypes] = useState<GenerationType[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('caption');
  const [selectedPlatform, setSelectedPlatform] = useState('onlyfans');
  const [selectedTone, setSelectedTone] = useState('casual');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/content/generator');
        const data = await res.json();
        if (data.success) {
          setTypes(data.data.types);
          setPlatforms(data.data.platforms);
          setTones(data.data.tones);
        }
      } catch (error) {
        console.error('Failed to fetch generator config:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/content/generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          prompt,
          platform: selectedPlatform,
          tone: selectedTone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getResultText = (): string => {
    if (!result?.content) return '';
    const content = result.content;
    if ('caption' in content) return String(content.caption);
    if ('message' in content) return String(content.message);
    if ('text' in content) return String(content.text);
    return JSON.stringify(content, null, 2);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <ShopifyPageLayout title="AI Content Generator" subtitle="Generate content with AI">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={24} />
          </div>
        </ShopifyPageLayout>
      </ProtectedRoute>
    );
  }

  if (types.length === 0) {
    return (
      <ProtectedRoute>
        <ShopifyPageLayout title="AI Content Generator" subtitle="Generate content with AI">
          <ShopifyEmptyState
            title="Content generator is not available yet"
            description="This page will be enabled once the AI generation API is wired."
            icon={Sparkles}
            action={{
              label: 'Back to Content',
              onClick: () => { window.location.href = '/content'; },
            }}
          />
        </ShopifyPageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ShopifyPageLayout title="AI Content Generator" subtitle="Generate captions, ideas, and messages with AI">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Panel */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Describe what you want</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A caption for my new beach photoshoot..."
                className="w-full px-3 py-2 border rounded-lg min-h-[120px]"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Generated Content</h3>
              {result && (
                <button
                  onClick={() => handleCopy(getResultText())}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                  {getResultText()}
                </div>
                {result.content && 'hashtags' in result.content && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Suggested hashtags:</p>
                    <div className="flex flex-wrap gap-2">
                      {(result.content.hashtags as string[]).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.content && 'ideas' in result.content && (
                  <div className="space-y-2">
                    {(result.content.ideas as Array<{ title: string; description: string }>).map((idea, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{idea.title}</p>
                        <p className="text-sm text-gray-600">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                <p>Your generated content will appear here</p>
              </div>
            )}
          </div>
        </div>
      </ShopifyPageLayout>
    </ProtectedRoute>
  );
}
