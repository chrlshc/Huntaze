'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Recommendation {
  id: string;
  type: 'content_idea' | 'timing' | 'hashtag' | 'format';
  title: string;
  description: string;
  confidence: number;
  platform: string;
  actionable: boolean;
  suggestedAction?: string;
}

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  platform: string;
  estimatedViralScore: number;
  suggestedHashtags: string[];
  bestPostingTime: string;
  contentType: string;
}

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/content-trends/recommendations');
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data?.recommendations || []);
        setContentIdeas(data.data?.contentIdeas || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewIdeas = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/content-trends/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_ideas' }),
      });
      const data = await response.json();
      
      if (data.success) {
        setContentIdeas(prev => [...(data.data?.contentIdeas || []), ...prev]);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content_idea': return '💡';
      case 'timing': return '⏰';
      case 'hashtag': return '#️⃣';
      case 'format': return '🎬';
      default: return '📌';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-100 rounded" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Recommendations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🤖 Recommandations IA</h2>
          <Button variant="outline" onClick={fetchRecommendations}>
            Actualiser
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucune recommandation disponible. Lancez le scraper pour obtenir des insights.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{rec.title}</h3>
                      <Badge className={getConfidenceColor(rec.confidence)}>
                        {rec.confidence}% confiance
                      </Badge>
                      <Badge variant="outline">{rec.platform}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    {rec.actionable && rec.suggestedAction && (
                      <Button size="sm" variant="outline">
                        {rec.suggestedAction}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Content Ideas Generator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">💡 Idées de Contenu</h2>
          <Button onClick={generateNewIdeas} disabled={generating}>
            {generating ? 'Génération...' : 'Générer des idées'}
          </Button>
        </div>

        {contentIdeas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Générez des idées de contenu basées sur les tendances actuelles
            </p>
            <Button onClick={generateNewIdeas} disabled={generating}>
              {generating ? 'Génération...' : 'Générer maintenant'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentIdeas.map(idea => (
              <div key={idea.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{idea.platform}</Badge>
                  <Badge variant="outline">{idea.contentType}</Badge>
                  <span className="text-sm text-green-600 font-medium">
                    🎯 {idea.estimatedViralScore}% viral
                  </span>
                </div>
                
                <h3 className="font-semibold mb-2">{idea.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">⏰ Meilleur moment:</span>
                    <span className="font-medium">{idea.bestPostingTime}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {idea.suggestedHashtags.slice(0, 5).map((tag, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Créer ce contenu
                  </Button>
                  <Button size="sm" variant="outline">
                    📋
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
