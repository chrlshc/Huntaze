'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';

interface NewFeature {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  category: string;
  tourAvailable: boolean;
  imageUrl?: string;
}

interface WhatsNewProps {
  onClose: () => void;
  onStartTour?: (featureId: string) => void;
}

export default function WhatsNew({ onClose, onStartTour }: WhatsNewProps) {
  const [features, setFeatures] = useState<NewFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewFeatures();
  }, []);

  const loadNewFeatures = async () => {
    try {
      // Mock data - replace with actual API call
      const mockFeatures: NewFeature[] = [
        {
          id: 'ai-content-gen-v2',
          title: 'Enhanced AI Content Generation',
          description: 'Our AI now generates even more engaging content with better context awareness and platform-specific optimization.',
          releaseDate: '2024-11-01',
          category: 'AI',
          tourAvailable: true
        },
        {
          id: 'cross-platform-scheduling',
          title: 'Cross-Platform Scheduling',
          description: 'Schedule content across multiple platforms simultaneously with intelligent timing suggestions.',
          releaseDate: '2024-10-28',
          category: 'Scheduling',
          tourAvailable: true
        },
        {
          id: 'advanced-analytics',
          title: 'Advanced Analytics Dashboard',
          description: 'Get deeper insights with our new analytics dashboard featuring trend analysis and audience insights.',
          releaseDate: '2024-10-25',
          category: 'Analytics',
          tourAvailable: false
        }
      ];

      setFeatures(mockFeatures);
    } catch (error) {
      console.error('Failed to load new features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = (featureId: string) => {
    onStartTour?.(featureId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">What's New</h2>
                <p className="text-blue-100 text-sm">Check out our latest features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : features.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No new features to show</p>
            </div>
          ) : (
            <div className="space-y-6">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {feature.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(feature.releaseDate).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {feature.description}
                  </p>

                  {feature.tourAvailable && (
                    <button
                      onClick={() => handleStartTour(feature.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Take a Tour
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
