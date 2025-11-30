'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";

interface ExtractedContent {
  title: string;
  description: string;
  content: string;
  images: string[];
  author?: string;
  publishedDate?: string;
  siteName?: string;
  url: string;
}

interface UrlImporterProps {
  onImportSuccess?: (contentId: string, extractedContent: ExtractedContent) => void;
  onCancel?: () => void;
}

export default function UrlImporter({ onImportSuccess, onCancel }: UrlImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content/import/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import content');
      }

      setExtractedContent(data.extractedContent);
      
      if (onImportSuccess) {
        onImportSuccess(data.contentItem.id, data.extractedContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import content');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleImport();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="import-url" className="block text-sm font-medium text-gray-700 mb-2">
          Import from URL
        </label>
        <div className="flex gap-2">
          <input
            id="import-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/article"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <Button variant="primary" onClick={handleImport} disabled={loading || !url.trim()}>
  {loading ? 'Importing...' : 'Import'}
</Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
  Cancel
</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Import Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-blue-700">Extracting content from URL...</span>
          </div>
        </div>
      )}

      {extractedContent && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Content Imported Successfully</h3>
              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-xs font-medium text-green-700">Title:</span>
                  <p className="text-sm text-green-900">{extractedContent.title}</p>
                </div>
                {extractedContent.description && (
                  <div>
                    <span className="text-xs font-medium text-green-700">Description:</span>
                    <p className="text-sm text-green-900">{extractedContent.description}</p>
                  </div>
                )}
                {extractedContent.siteName && (
                  <div>
                    <span className="text-xs font-medium text-green-700">Source:</span>
                    <p className="text-sm text-green-900">{extractedContent.siteName}</p>
                  </div>
                )}
                {extractedContent.images.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-green-700">Images found:</span>
                    <p className="text-sm text-green-900">{extractedContent.images.length} image(s)</p>
                  </div>
                )}
                <p className="text-xs text-green-600 mt-2">
                  Content has been saved as a draft. You can now edit and publish it.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>Supported content types:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Blog articles and news posts</li>
          <li>Social media posts (Twitter, LinkedIn, etc.)</li>
          <li>Video pages (YouTube, Vimeo, etc.)</li>
          <li>Any page with Open Graph or Twitter Card metadata</li>
        </ul>
      </div>
    </div>
  );
}
