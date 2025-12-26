'use client';

/**
 * Content Editor Page
 * Draft management and editing
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshCw, Plus, FileText, Loader2, Trash2 } from 'lucide-react';

interface Draft {
  id: string;
  title: string;
  preview: string;
  mediaCount: number;
  platform: string;
  updatedAt: string;
}

export default function ContentEditorPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/content/editor');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.data.drafts);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleCreateDraft = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/content/editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Draft' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchDrafts();
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <ContentPageErrorBoundary pageName="Content Editor">
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin" size={24} />
            </div>
          </div>
        </ContentPageErrorBoundary>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ContentPageErrorBoundary pageName="Content Editor">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Content Editor</h1>
              <p className="text-gray-500">Manage your content drafts</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchDrafts}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={handleCreateDraft}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                New Draft
              </button>
            </div>
          </div>

          {drafts.length > 0 ? (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <FileText size={20} className="text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{draft.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {draft.preview || 'No content yet'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{draft.platform}</span>
                          {draft.mediaCount > 0 && <span>{draft.mediaCount} media</span>}
                          <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="no-data"
              title="No drafts yet"
              description="Create your first draft to start writing content."
              action={{ label: 'Create Draft', onClick: handleCreateDraft }}
              secondaryAction={{ label: 'Go to Content Studio', onClick: () => (window.location.href = '/content/factory'), icon: RefreshCw }}
            />
          )}
        </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
