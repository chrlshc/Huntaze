"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wand2, 
  Package, 
  Loader2,
  Check,
  Plus,
  Sparkles,
  Image,
  Video,
  FileText
} from 'lucide-react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { BundleSuggestion, ContentItem } from '@/lib/offers/types';

interface AIBundleCreatorProps {
  onCreateBundle: (bundle: BundleSuggestion) => void;
}

type ContentApiResponse = {
  data?: {
    items?: Array<{
      id: string;
      title: string;
      type: string;
      metadata?: Record<string, unknown>;
    }>;
  };
};

const contentTypeIcons: Record<string, typeof Image> = {
  photo: Image,
  video: Video,
  document: FileText,
};

function normalizeContentType(type: string): string {
  if (type === 'image') return 'photo';
  if (type === 'text') return 'document';
  return type;
}

export function AIBundleCreator({ onCreateBundle }: AIBundleCreatorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<BundleSuggestion[]>([]);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: contentData, error: contentError, isLoading: contentLoading } = useSWR<ContentApiResponse>(
    '/api/content?limit=50&offset=0',
    (url) => internalApiFetch<ContentApiResponse>(url)
  );

  const contentItems = useMemo<ContentItem[]>(() => {
    const items = contentData?.data?.items ?? [];
    return items.map((item) => {
      const metadata = item.metadata ?? {};
      const priceCents =
        typeof metadata.priceCents === 'number' && Number.isFinite(metadata.priceCents)
          ? metadata.priceCents
          : 0;
      const price =
        typeof metadata.price === 'number' && Number.isFinite(metadata.price)
          ? metadata.price
          : priceCents > 0
            ? priceCents / 100
            : 0;
      const salesCount =
        typeof metadata.salesCount === 'number' && Number.isFinite(metadata.salesCount)
          ? metadata.salesCount
          : 0;

      return {
        id: item.id,
        title: item.title,
        type: normalizeContentType(item.type),
        price,
        salesCount,
      };
    });
  }, [contentData]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      if (contentItems.length < 2) {
        setError('Add at least two content items to generate bundles');
        return;
      }

      const data = await internalApiFetch<{ suggestions?: BundleSuggestion[] }>(
        '/api/ai/offers/bundles',
        {
          method: 'POST',
          body: {
            contentItems,
            fanPreferences: [],
          },
        },
      );

      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
      if (!data?.suggestions?.length) {
        setError('No bundle suggestions returned');
      }
    } catch (err) {
      setSuggestions([]);
      setError(err instanceof Error ? err.message : 'Failed to generate bundles');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleContent = (contentId: string) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const getContentById = (id: string) => contentItems.find(c => c.id === id);

  const calculateBundleValue = (contentIds: string[]) => {
    return contentIds.reduce((sum, id) => {
      const content = getContentById(id);
      return sum + (content?.price || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Bundle Creator</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Let AI analyze your content and fan preferences to suggest optimal bundles
            </p>
          </div>
        </div>
      </Card>

      {/* Content Library */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Your Content Library
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {contentLoading && (
            <div className="text-sm text-muted-foreground">Loading content...</div>
          )}
          {!contentLoading && contentError && (
            <div className="text-sm text-red-500">Failed to load content</div>
          )}
          {!contentLoading && !contentError && contentItems.length === 0 && (
            <div className="text-sm text-muted-foreground">No content available yet.</div>
          )}
          {contentItems.map((item) => {
            const Icon = contentTypeIcons[item.type] || FileText;
            return (
              <div
                key={item.id}
                onClick={() => toggleContent(item.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedContent.includes(item.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedContent.includes(item.id)
                      ? 'bg-primary/20'
                      : 'bg-muted'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      selectedContent.includes(item.id) ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.price} • {item.salesCount} sales
                    </p>
                  </div>
                  {selectedContent.includes(item.id) && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedContent.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 mb-4">
            <p className="text-sm">
              <span className="font-medium">{selectedContent.length} items selected</span>
              <span className="text-muted-foreground"> • Total value: ${calculateBundleValue(selectedContent)}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-500">{error}</div>
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || contentLoading || contentItems.length < 2}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Bundles...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Bundle Suggestions
            </>
          )}
        </Button>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Bundle Suggestions
          </h3>
          
          <div className="space-y-4">
            {suggestions.map((bundle, index) => {
              const totalValue = calculateBundleValue(bundle.contentIds);
              
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{bundle.name}</h4>
                      <p className="text-sm text-green-500 font-medium">
                        {bundle.expectedValue}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${bundle.suggestedPrice}</p>
                      <p className="text-sm text-muted-foreground line-through">
                        ${totalValue}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {bundle.contentIds.map(id => {
                      const content = getContentById(id);
                      if (!content) return null;
                      const Icon = contentTypeIcons[content.type] || FileText;
                      return (
                        <span 
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                        >
                          <Icon className="w-3 h-3" />
                          {content.title}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {bundle.reasoning}
                  </p>

                  <Button 
                    onClick={() => onCreateBundle(bundle)}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create This Bundle
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
