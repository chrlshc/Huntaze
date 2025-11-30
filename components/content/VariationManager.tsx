'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface Variation {
  id: string;
  variation_name: string;
  text: string;
  media_ids: string[];
  audience_percentage: number;
  created_at: string;
}

interface VariationManagerProps {
  parentContentId: string;
  parentContent: {
    text: string;
    mediaIds?: string[];
  };
  onVariationSelect?: (variation: Variation) => void;
}

export default function VariationManager({ parentContentId, parentContent, onVariationSelect }: VariationManagerProps) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
  
  // Form state
  const [variationName, setVariationName] = useState('');
  const [variationText, setVariationText] = useState('');
  const [audiencePercentage, setAudiencePercentage] = useState(20);

  useEffect(() => {
    fetchVariations();
  }, [parentContentId]);

  const fetchVariations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/variations?parentContentId=${parentContentId}`);
      if (response.ok) {
        const data = await response.json();
        setVariations(data.variations || []);
      }
    } catch (error) {
      console.error('Error fetching variations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVariation = async () => {
    try {
      const response = await fetch('/api/content/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentContentId,
          variationName,
          text: variationText,
          mediaIds: parentContent.mediaIds || [],
          audiencePercentage
        })
      });

      if (response.ok) {
        await fetchVariations();
        setShowCreateForm(false);
        setVariationName('');
        setVariationText('');
        setAudiencePercentage(20);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create variation');
      }
    } catch (error) {
      console.error('Error creating variation:', error);
      alert('Failed to create variation');
    }
  };

  const deleteVariation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variation?')) return;

    try {
      const response = await fetch(`/api/content/variations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchVariations();
      }
    } catch (error) {
      console.error('Error deleting variation:', error);
    }
  };

  const getTotalPercentage = () => {
    return variations.reduce((sum, v) => sum + v.audience_percentage, 0);
  };

  const getRemainingPercentage = () => {
    return 100 - getTotalPercentage();
  };

  const getTextDiff = (originalText: string, variationText: string) => {
    // Simple diff highlighting
    if (originalText === variationText) return null;
    
    const words1 = originalText.split(' ');
    const words2 = variationText.split(' ');
    
    const added = words2.filter(w => !words1.includes(w)).length;
    const removed = words1.filter(w => !words2.includes(w)).length;
    
    return { added, removed };
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading variations...</div>;
  }

  return (
    <Card className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">A/B Test Variations</h3>
          <p className="text-sm text-gray-600">
            Create up to 5 variations to test different versions of your content
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={variations.length >= 5 || getRemainingPercentage() === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          + Add Variation
        </button>
      </div>

      {/* Audience Distribution */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Audience Distribution</span>
          <span className="text-sm text-gray-600">{getRemainingPercentage()}% remaining</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
          {variations.map((variation, index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
            return (
              <div
                key={variation.id}
                className={`${colors[index % colors.length]} h-full transition-all`}
                style={{ width: `${variation.audience_percentage}%` }}
                title={`${variation.variation_name}: ${variation.audience_percentage}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50">
          <h4 className="font-medium mb-3">Create New Variation</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Variation Name</label>
              <input
                type="text"
                value={variationName}
                onChange={(e) => setVariationName(e.target.value)}
                placeholder="e.g., Version A, Emoji Version, etc."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content Text</label>
              <textarea
                value={variationText}
                onChange={(e) => setVariationText(e.target.value)}
                placeholder="Enter variation text..."
                rows={4}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Audience Percentage: {audiencePercentage}% (Max: {getRemainingPercentage()}%)
              </label>
              <input
                type="range"
                min="1"
                max={getRemainingPercentage()}
                value={audiencePercentage}
                onChange={(e) => setAudiencePercentage(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={createVariation}
                disabled={!variationName || !variationText}
              >
                Create Variation
              </Button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Original Content */}
      <div className="mb-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold text-blue-900">Original Content</span>
            <span className="ml-2 text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">Control</span>
          </div>
          <span className="text-sm text-blue-700">{100 - getTotalPercentage()}% of audience</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{parentContent.text}</p>
      </div>

      {/* Variations List */}
      {variations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No variations created yet</p>
          <p className="text-sm mt-2">Create variations to test different versions of your content</p>
        </div>
      ) : (
        <div className="space-y-3">
          {variations.map((variation, index) => {
            const diff = getTextDiff(parentContent.text, variation.text);
            const colors = ['border-blue-300 bg-blue-50', 'border-green-300 bg-green-50', 'border-purple-300 bg-purple-50', 'border-orange-300 bg-orange-50', 'border-pink-300 bg-pink-50'];
            
            return (
              <div
                key={variation.id}
                className={`p-4 border-2 rounded-lg ${colors[index % colors.length]} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => onVariationSelect?.(variation)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedVariations.includes(variation.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setSelectedVariations(prev =>
                          prev.includes(variation.id)
                            ? prev.filter(id => id !== variation.id)
                            : [...prev, variation.id]
                        );
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold">{variation.variation_name}</span>
                    {diff && (
                      <span className="text-xs text-gray-600">
                        ({diff.added > 0 && `+${diff.added} words`} {diff.removed > 0 && `-${diff.removed} words`})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{variation.audience_percentage}%</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVariation(variation.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{variation.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      {variations.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">💡</span>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">How A/B Testing Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Each variation will be shown to the specified percentage of your audience</li>
                <li>The original content will be shown to the remaining {100 - getTotalPercentage()}%</li>
                <li>Performance metrics will be tracked for each variation</li>
                <li>You can compare results to determine the best performing version</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
