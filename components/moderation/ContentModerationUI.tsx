'use client';

import { useState } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  Camera, Upload, Loader2, Info,
  Instagram, Video, MessageSquare, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModerationResult {
  safe: boolean;
  platform: string;
  labels: Array<{ name: string; confidence: number }>;
  confidence: number;
  warnings: string[];
  recommendations?: string[];
}

interface CrossPlatformResults {
  results: Record<string, ModerationResult>;
  summary: {
    safeForAll: boolean;
    safePlatforms: string[];
    unsafePlatforms: string[];
    recommendations: string[];
  };
}

export function ContentModerationUI() {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CrossPlatformResults | null>(null);
  const [error, setError] = useState('');

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-600 to-pink-600' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-black' },
    { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'bg-orange-600' },
    { id: 'threads', name: 'Threads', icon: Hash, color: 'bg-gray-900' },
    { id: 'onlyfans', name: 'OnlyFans', icon: Camera, color: 'bg-blue-600' }
  ];

  const checkContent = async (crossPlatform: boolean = true) => {
    if (!imageUrl) {
      setError('Please provide an image URL');
      return;
    }

    setChecking(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/content/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          platform: selectedPlatform,
          checkCrossPlatform: crossPlatform
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Moderation failed');
      }

      if (crossPlatform) {
        setResults(data);
      } else {
        // Convert single result to cross-platform format
        setResults({
          results: { [selectedPlatform]: data },
          summary: {
            safeForAll: data.safe,
            safePlatforms: data.safe ? [selectedPlatform] : [],
            unsafePlatforms: data.safe ? [] : [selectedPlatform],
            recommendations: data.recommendations || []
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check content');
    } finally {
      setChecking(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In production, upload to S3/Cloudinary first
    // For demo, use a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    const Icon = platform?.icon || Camera;
    return <Icon className="w-4 h-4" />;
  };

  const getPlatformColor = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform?.color || 'bg-gray-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-xl font-bold">Content Moderation</h2>
          <p className="text-sm text-gray-600">Check if your content meets platform guidelines</p>
        </div>
      </div>

      {/* Image Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL or Upload
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-5 h-5" />
            </label>
          </div>
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Platform
          </label>
          <div className="grid grid-cols-5 gap-2">
            {platforms.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPlatform === platform.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <platform.icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs">{platform.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => checkContent(false)}
          disabled={checking || !imageUrl}
          variant="outline"
          className="flex-1"
        >
          {checking ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Shield className="w-4 h-4 mr-2" />
          )}
          Check {platforms.find(p => p.id === selectedPlatform)?.name}
        </Button>
        <Button
          onClick={() => checkContent(true)}
          disabled={checking || !imageUrl}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {checking ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Shield className="w-4 h-4 mr-2" />
          )}
          Check All Platforms
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          {results.summary && (
            <div className={`p-4 rounded-lg border ${
              results.summary.safeForAll 
                ? 'bg-green-50 border-green-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {results.summary.safeForAll ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium mb-1">
                    {results.summary.safeForAll 
                      ? 'Content is safe for all platforms' 
                      : `Content is safe for: ${results.summary.safePlatforms.join(', ') || 'None'}`}
                  </p>
                  {results.summary.unsafePlatforms.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Not suitable for: {results.summary.unsafePlatforms.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Platform Details */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Platform Analysis</h3>
            {Object.entries(results.results).map(([platform, result]) => (
              <div key={platform} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getPlatformColor(platform)}`}>
                      {getPlatformIcon(platform)}
                    </div>
                    <div>
                      <p className="font-medium">{platform}</p>
                      <p className="text-sm text-gray-600">
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  {result.safe ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                {/* Labels */}
                {result.labels.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Detected Labels:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.labels.map((label, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            label.confidence > 0.8
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {label.name} ({(label.confidence * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <p className="text-sm text-gray-700">{warning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {results.summary.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {results.summary.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {imageUrl && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt="Content preview"
              className="w-full h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}