'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";

type Platform = 'instagram' | 'tiktok' | 'twitter' | 'onlyfans' | 'facebook';

type CaptionResult = {
  caption: string;
  hashtags: string[];
  confidence: number;
  performanceInsights?: string[];
};

export function AICaptionGenerator() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [contentType, setContentType] = useState('');
  const [description, setDescription] = useState('');
  const [mood, setMood] = useState('');
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platforms: { value: Platform; label: string; icon: string }[] = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
    { value: 'onlyfans', label: 'OnlyFans', icon: '🔥' },
    { value: 'facebook', label: 'Facebook', icon: '👥' },
  ];

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          contentInfo: {
            type: contentType,
            description,
            mood,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate caption');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate caption');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = () => {
    if (result) {
      const fullText = `${result.caption}\n\n${result.hashtags.join(' ')}`;
      navigator.clipboard.writeText(fullText);
    }
  };

  return (
    <div className="ai-caption-generator">
      <div className="generator-header">
        <span className="generator-icon">✨</span>
        <h3 className="generator-title">AI Caption Generator</h3>
      </div>

      <div className="generator-form">
        <div className="form-group">
          <label className="form-label">Platform</label>
          <div className="platform-selector">
            {platforms.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                disabled={loading}
                className={`platform-button ${platform === p.value ? 'active' : ''}`}
              >
                <span className="platform-icon">{p.icon}</span>
                <span className="platform-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="content-type" className="form-label">
            Content Type
          </label>
          <input
            id="content-type"
            type="text"
            className="form-input"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            placeholder="e.g., Photo, Video, Story"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Content Description
          </label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what's in your content..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mood" className="form-label">
            Mood/Tone (Optional)
          </label>
          <input
            id="mood"
            type="text"
            className="form-input"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g., Playful, Sexy, Professional"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="generate-button"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <span className="ai-icon">🎨</span>
              Generate Caption
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="generator-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {result && (
        <div className="generator-result">
          <div className="result-header">
            <span className="result-label">Generated Caption</span>
            <span className="confidence-badge">
              {Math.round(result.confidence * 100)}% confident
            </span>
          </div>

          <div className="result-caption">
            {result.caption}
          </div>

          {result.hashtags.length > 0 && (
            <div className="result-hashtags">
              <span className="hashtags-label">Suggested Hashtags:</span>
              <div className="hashtags-list">
                {result.hashtags.map((tag, index) => (
                  <span key={index} className="hashtag-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.performanceInsights && result.performanceInsights.length > 0 && (
            <div className="result-insights">
              <span className="insights-label">💡 Performance Insights:</span>
              <ul className="insights-list">
                {result.performanceInsights.map((insight, index) => (
                  <li key={index} className="insight-item">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="result-actions">
            <button onClick={handleCopyCaption} className="copy-button">
              📋 Copy Caption
            </button>
            <button onClick={handleGenerate} disabled={loading} className="regenerate-button">
              🔄 Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
