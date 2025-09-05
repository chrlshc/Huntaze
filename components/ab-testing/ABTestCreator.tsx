'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTrackingLink } from '@/src/utils/tracking-links';

interface Variant {
  id: string;
  name: string;
  caption: string;
  hashtags: string;
  trackingLink?: string;
}

interface ABTestCreatorProps {
  platform: string;
  baseUrl: string;
  onCreateTest?: (variants: Variant[]) => void;
}

export function ABTestCreator({ platform, baseUrl, onCreateTest }: ABTestCreatorProps) {
  const [variants, setVariants] = useState<Variant[]>([
    { id: 'A', name: 'Variant A', caption: '', hashtags: '' },
    { id: 'B', name: 'Variant B', caption: '', hashtags: '' }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addVariant = () => {
    const nextId = String.fromCharCode(65 + variants.length);
    setVariants([...variants, {
      id: nextId,
      name: `Variant ${nextId}`,
      caption: '',
      hashtags: ''
    }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 2) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const generateTrackingLinks = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/tracking/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          platform,
          variants: variants.map(v => ({
            id: v.id,
            name: v.name
          }))
        })
      });

      if (response.ok) {
        const { links } = await response.json();
        setVariants(variants.map(v => ({
          ...v,
          trackingLink: links[v.id]
        })));
      }
    } catch (error) {
      console.error('Failed to generate tracking links:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAISuggestions = async (variantId: string) => {
    try {
      const response = await fetch('/api/ai/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          niche: 'creator',
          generateVariants: true
        })
      });

      if (response.ok) {
        const { variants: suggestions } = await response.json();
        if (suggestions && suggestions.length > 0) {
          const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
          updateVariant(variantId, 'caption', suggestion.caption);
          updateVariant(variantId, 'hashtags', suggestion.caption.match(/#\w+/g)?.join(' ') || '');
        }
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }
  };

  const copyTrackingLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const startTest = () => {
    if (onCreateTest) {
      onCreateTest(variants);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold">A/B Test Setup</h3>
        </div>
        <Button
          onClick={generateTrackingLinks}
          disabled={isGenerating}
          size="sm"
          variant="outline"
        >
          Generate Tracking Links
        </Button>
      </div>

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={variant.id} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {variant.id}
                </span>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                  className="text-sm font-medium bg-transparent border-none focus:outline-none"
                  placeholder="Variant name"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => generateAISuggestions(variant.id)}
                  size="sm"
                  variant="ghost"
                  className="text-purple-600"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  AI Suggest
                </Button>
                {variants.length > 2 && (
                  <Button
                    onClick={() => removeVariant(variant.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Caption</label>
                <textarea
                  value={variant.caption}
                  onChange={(e) => updateVariant(variant.id, 'caption', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="Enter caption text..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Hashtags</label>
                <input
                  type="text"
                  value={variant.hashtags}
                  onChange={(e) => updateVariant(variant.id, 'hashtags', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="#hashtag1 #hashtag2..."
                />
              </div>

              {variant.trackingLink && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">Tracking:</span>
                  <code className="text-xs text-purple-600 flex-1">
                    {formatTrackingLink(variant.trackingLink)}
                  </code>
                  <Button
                    onClick={() => copyTrackingLink(formatTrackingLink(variant.trackingLink!))}
                    size="sm"
                    variant="ghost"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {variants.length < 5 && (
          <Button
            onClick={addVariant}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Variant
          </Button>
        )}
        <Button
          onClick={startTest}
          disabled={!variants.every(v => v.caption && v.trackingLink)}
          className="ml-auto"
        >
          Start A/B Test
        </Button>
      </div>
    </div>
  );
}