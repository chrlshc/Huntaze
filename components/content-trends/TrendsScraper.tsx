'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';

interface ScrapingJob {
  runId: string;
  platform: Platform;
  status: string;
  startedAt?: string;
}

const PLATFORMS: { id: Platform; name: string; icon: string }[] = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏' },
];

export function TrendsScraper() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['tiktok']);
  const [hashtags, setHashtags] = useState('');
  const [searchTerms, setSearchTerms] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const startScraping = async () => {
    if (selectedPlatforms.length === 0) return;

    setLoading(true);
    const newJobs: ScrapingJob[] = [];

    for (const platform of selectedPlatforms) {
      try {
        const response = await fetch('/api/ai/content-trends/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean),
            searchTerms: searchTerms.split(',').map(s => s.trim()).filter(Boolean),
            maxResults,
          }),
        });

        const data = await response.json();
        if (data.success) {
          newJobs.push({
            runId: data.data.runId,
            platform,
            status: data.data.status,
            startedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error starting ${platform} scrape:`, error);
      }
    }

    setJobs(prev => [...newJobs, ...prev]);
    setLoading(false);
  };

  const checkJobStatus = async (runId: string) => {
    try {
      const response = await fetch(`/api/ai/content-trends/scrape?runId=${runId}`);
      const data = await response.json();
      
      if (data.success) {
        setJobs(prev =>
          prev.map(job =>
            job.runId === runId ? { ...job, status: data.data.status } : job
          )
        );
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED': return 'bg-green-100 text-green-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">🔍 Scraper de Tendances</h2>
      
      <div className="space-y-4">
        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Plateformes</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hashtags (séparés par virgule)</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#viral, #trending, #fyp"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Termes de recherche</label>
            <input
              type="text"
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              placeholder="fitness, lifestyle, beauty"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {/* Max Results */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre max de résultats</label>
          <select
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        {/* Start Button */}
        <Button
          onClick={startScraping}
          disabled={loading || selectedPlatforms.length === 0}
          className="w-full"
        >
          {loading ? 'Lancement...' : `Lancer le scraping (${selectedPlatforms.length} plateforme${selectedPlatforms.length > 1 ? 's' : ''})`}
        </Button>

        {/* Active Jobs */}
        {jobs.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">Jobs en cours</h3>
            <div className="space-y-2">
              {jobs.map(job => (
                <div key={job.runId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span>{PLATFORMS.find(p => p.id === job.platform)?.icon}</span>
                    <span className="font-medium">{PLATFORMS.find(p => p.id === job.platform)?.name}</span>
                    <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {job.startedAt && new Date(job.startedAt).toLocaleTimeString()}
                    </span>
                    {job.status === 'RUNNING' && (
                      <Button variant="outline" size="sm" onClick={() => checkJobStatus(job.runId)}>
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
