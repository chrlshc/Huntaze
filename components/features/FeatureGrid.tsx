'use client';

import { FeatureCard, FeatureCardProps } from './FeatureCard';

export interface FeatureGridProps {
  features: FeatureCardProps[];
  onFeatureClick?: (id: string) => void;
}

/**
 * Grid layout for displaying features organized by category
 * Groups features by their category and displays them in a responsive grid
 */
export function FeatureGrid({ features, onFeatureClick }: FeatureGridProps) {
  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureCardProps[]>);

  const categoryTitles: Record<string, string> = {
    automation: 'Automation',
    analytics: 'Analytics',
    growth: 'Growth',
  };

  const categoryOrder: Array<'automation' | 'analytics' | 'growth'> = [
    'automation',
    'analytics',
    'growth',
  ];

  return (
    <div className="space-y-16" data-testid="feature-grid">
      {categoryOrder.map((category) => {
        const categoryFeatures = featuresByCategory[category];
        if (!categoryFeatures || categoryFeatures.length === 0) return null;

        return (
          <div key={category} data-testid={`category-${category}`}>
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              {categoryTitles[category]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryFeatures.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  {...feature}
                  onClick={onFeatureClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
