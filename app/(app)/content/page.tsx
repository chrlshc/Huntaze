'use client';

/**
 * Content Page - Real-time data
 * Requires dynamic rendering for content management
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';

import { useState, lazy, Suspense, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { useContent, deleteContent, createContent, updateContent, type ContentItem } from '@/hooks/useContent';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LazyLoadErrorBoundary } from '@/components/dashboard/LazyLoadErrorBoundary';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

// Lazy load heavy modal component to reduce initial bundle size
const ContentModal = lazy(() => import('@/components/content/ContentModal').then(mod => ({ default: mod.ContentModal })));

// Memoized content item component for optimized rendering
const ContentItemRow = memo(({ 
  item, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  item: ContentItem; 
  onEdit: (item: ContentItem) => void; 
  onDelete: (id: string) => void; 
  isDeleting: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'onlyfans': return 'bg-blue-100 text-blue-700';
      case 'fansly': return 'bg-purple-100 text-purple-700';
      case 'instagram': return 'bg-pink-100 text-pink-700';
      case 'tiktok': return 'bg-black text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'text':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="p-6 bg-[var(--bg-surface)] hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-gray-100 rounded-lg">
            {getTypeIcon(item.type)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
              {item.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(item.platform)}`}>
                {item.platform}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              <span className="text-sm text-[var(--color-text-sub)]">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Button>
          <Button 
            variant="primary" 
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button 
            variant="danger" 
            onClick={() => onDelete(item.id)} 
            disabled={isDeleting}
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
});

ContentItemRow.displayName = 'ContentItemRow';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(20); // Virtual scrolling: show 20 items initially
  
  // Performance monitoring
  const { trackAPIRequest, trackFormSubmit } = usePerformanceMonitoring({
    pageName: 'Content',
    trackScrollPerformance: true,
    trackInteractions: true,
  });
  
  // Debounce search input (300ms delay)
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch content from API
  const { data, isLoading, error, mutate } = useContent({
    status: activeTab,
    limit: 100, // Fetch more items for better UX
  });

  // Extract content items
  const contentItems = data?.data?.items || [];
  
  // Memoized stats calculation
  const stats = useMemo(() => ({
    total: contentItems.length,
    published: contentItems.filter((item: ContentItem) => item.status === 'published').length,
    scheduled: contentItems.filter((item: ContentItem) => item.status === 'scheduled').length,
    draft: contentItems.filter((item: ContentItem) => item.status === 'draft').length,
  }), [contentItems]);

  // Memoized filtered and searched content
  const filteredContent = useMemo(() => {
    let filtered = activeTab === 'all' 
      ? contentItems 
      : contentItems.filter((item: ContentItem) => item.status === activeTab);
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((item: ContentItem) => 
        item.title.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [contentItems, activeTab, debouncedSearch]);

  // Virtual scrolling: only render visible items
  const visibleContent = useMemo(() => 
    filteredContent.slice(0, displayCount),
    [filteredContent, displayCount]
  );
  
  // Memoized handlers for better performance
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      setIsDeleting(true);
      try {
        await deleteContent(id);
        mutate(); // Refresh data
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete content');
      } finally {
        setIsDeleting(false);
      }
    }
  }, [mutate]);

  const handleCreate = useCallback(() => {
    setEditingContent(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((content: ContentItem) => {
    setEditingContent(content);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: Partial<ContentItem>) => {
    setIsSubmitting(true);
    try {
      if (editingContent?.id) {
        await updateContent(editingContent.id, data);
      } else {
        await createContent(data);
      }
      setIsModalOpen(false);
      setEditingContent(null);
      mutate(); // Refresh data
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to save content');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingContent, mutate]);

  const handleCloseModal = useCallback(() => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setEditingContent(null);
    }
  }, [isSubmitting]);

  // Load more items for virtual scrolling
  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 20, filteredContent.length));
  }, [filteredContent.length]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setDisplayCount(20); // Reset display count on search
  }, []);

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Content">
        <div>
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-main)]">
            Content Creation
          </h1>
          <p className="mt-2 text-[var(--color-text-sub)]">
            Rédige, programme et publie ton contenu OnlyFans, socials et promos depuis un workspace unique.
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Content
</Button>
      </div>

      {/* Content Modal */}
      {isModalOpen && (
        <LazyLoadErrorBoundary>
          <Suspense fallback={null}>
            <ContentModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSubmit={handleSubmit}
              initialData={editingContent || undefined}
              isLoading={isSubmitting}
            />
          </Suspense>
        </LazyLoadErrorBoundary>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-8">
          <LoadingState variant="card" count={4} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-[var(--radius-card)] p-4">
          <p className="text-red-800">
            Failed to load content. Please try again.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-sub)]">Total Content</p>
                <p className="text-2xl font-bold text-[var(--color-text-main)] mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-sub)]">Published</p>
                <p className="text-2xl font-bold text-[var(--color-text-main)] mt-1">
                  {stats.published}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-sub)]">Scheduled</p>
                <p className="text-2xl font-bold text-[var(--color-text-main)] mt-1">
                  {stats.scheduled}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-sub)]">Drafts</p>
                <p className="text-2xl font-bold text-[var(--color-text-main)] mt-1">
                  {stats.draft}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      {!isLoading && !error && (
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search content by title, platform, or status..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[var(--color-indigo)] focus:border-[var(--color-indigo)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 shadow-[var(--shadow-soft)]">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6" aria-label="Tabs">
            {(['all', 'draft', 'scheduled', 'published'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setDisplayCount(20); // Reset display count on tab change
                }}
                className={[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab
                    ? 'border-[var(--color-indigo)] text-[var(--color-indigo)]'
                    : 'border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] hover:border-gray-300',
                ].join(' ')}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content List */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12">
              <LoadingState variant="card" count={3} />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-main)]">
                {searchQuery ? 'No results found' : 'No content yet'}
              </h3>
              <p className="mt-2 text-[var(--color-text-sub)]">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start creating content to see it here.'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Button variant="primary" onClick={handleCreate}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create First Content
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Virtual scrolling: render only visible items */}
              {visibleContent.map((item: ContentItem) => (
                <ContentItemRow
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                />
              ))}
              
              {/* Load More Button */}
              {displayCount < filteredContent.length && (
                <div className="p-6 text-center bg-[var(--bg-surface)]">
                  <Button variant="secondary" onClick={handleLoadMore}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More ({filteredContent.length - displayCount} remaining)
                  </Button>
                </div>
              )}
              
              {/* Results Summary */}
              {searchQuery && (
                <div className="p-4 text-center bg-gray-50 text-sm text-[var(--color-text-sub)]">
                  Showing {visibleContent.length} of {filteredContent.length} results
                </div>
              )}
            </>
          )}
        </div>
      </Card>
      </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
