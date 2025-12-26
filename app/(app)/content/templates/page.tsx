'use client';

/**
 * Content Templates Page
 * 
 * Displays reusable templates and template creation functionality.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 6.4
 */
export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { 
  Plus, 
  Sparkles, 
  Image as ImageIcon,
  Video,
  FileText,
  Copy,
  Edit,
  Trash2,
  Star,
  Clock,
  LayoutTemplate,
  Filter
} from 'lucide-react';

// Template category type
type TemplateCategory = 'all' | 'promotional' | 'engagement' | 'announcement' | 'personal';

// Template interface
interface ContentTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  mediaType: 'image' | 'video' | 'text';
  caption: string;
  hashtags: string[];
  platforms: string[];
  usageCount: number;
  isFavorite: boolean;
  createdAt: string;
  aiGenerated?: boolean;
}

type TemplateStructure = {
  text?: string;
  placeholders?: Array<{ id: string; label: string; type: 'text' | 'image' | 'video' }>;
  mediaSlots?: Array<{ id: string; type: 'image' | 'video'; required: boolean }>;
  suggestedPlatforms?: string[];
};

type TemplateDto = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  structure?: TemplateStructure;
  isPublic?: boolean;
  usageCount?: number;
  createdAt?: string;
};

type TemplatesApiResponse = {
  success: boolean;
  data?: {
    templates: TemplateDto[];
    mostUsed: TemplateDto[];
  };
};

// Category config
const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'all', label: 'All Templates' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'personal', label: 'Personal' },
];

function inferMediaType(structure?: TemplateStructure): ContentTemplate['mediaType'] {
  const slots = structure?.mediaSlots;
  if (Array.isArray(slots)) {
    if (slots.some((s) => s?.type === 'video')) return 'video';
    if (slots.some((s) => s?.type === 'image')) return 'image';
  }

  const placeholders = structure?.placeholders;
  if (Array.isArray(placeholders)) {
    if (placeholders.some((p) => p?.type === 'video')) return 'video';
    if (placeholders.some((p) => p?.type === 'image')) return 'image';
  }

  return 'text';
}

function extractHashtags(text: string): string[] {
  const found = new Set<string>();
  const re = /#([\p{L}\p{N}_]+)/gu;
  let match = re.exec(text);
  while (match) {
    found.add(match[1]);
    match = re.exec(text);
  }
  return Array.from(found);
}

function mapTemplate(dto: TemplateDto, isFavorite: boolean): ContentTemplate {
  const structureText = dto.structure?.text || '';
  const caption = structureText || dto.description || '';

  return {
    id: String(dto.id),
    name: dto.name || 'Untitled template',
    category: (dto.category as TemplateCategory) || 'promotional',
    mediaType: inferMediaType(dto.structure),
    caption,
    hashtags: extractHashtags(caption),
    platforms: dto.structure?.suggestedPlatforms || [],
    usageCount: Number(dto.usageCount || 0),
    isFavorite,
    createdAt: dto.createdAt || new Date().toISOString(),
    aiGenerated: false,
  };
}

export default function ContentTemplatesPage() {
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [favoriteById, setFavoriteById] = useState<Record<string, boolean>>({});

  const { data, error, isLoading, mutate } = useSWR<TemplatesApiResponse>(
    '/api/content/templates?limit=100&offset=0',
    (url) => internalApiFetch<TemplatesApiResponse>(url),
    { revalidateOnFocus: true }
  );

  const templates: ContentTemplate[] = useMemo(() => {
    const items = data?.data?.templates ?? [];
    return items.map((t) => mapTemplate(t, Boolean(favoriteById[t.id])));
  }, [data, favoriteById]);

  // Filter templates
  const filteredTemplates = templates.filter(template => 
    categoryFilter === 'all' || template.category === categoryFilter
  );

  // Sort by favorites first, then by usage
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
    return b.usageCount - a.usageCount;
  });

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavoriteById((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Page actions
  const PageActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Create Template
      </Button>
      <Button variant="primary" size="sm" data-testid="ai-template-generator">
        <Sparkles className="h-4 w-4 mr-1" />
        AI Generate
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <PageLayout
          title="Content Templates"
          subtitle="Loading..."
          breadcrumbs={[
            { label: 'Content', href: '/content' },
            { label: 'Templates' }
          ]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </Card>
            ))}
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  if (error && templates.length === 0) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <ContentPageErrorBoundary pageName="Content Templates">
          <PageLayout
            title="Content Templates"
            subtitle="Reusable templates for faster content creation"
            breadcrumbs={[
              { label: 'Content', href: '/content' },
              { label: 'Templates' },
            ]}
            actions={PageActions}
          >
            <EmptyState
              variant="error"
              title="Failed to load templates"
              description={error instanceof Error ? error.message : 'Please try again.'}
              action={{ label: 'Retry', onClick: () => void mutate() }}
            />
          </PageLayout>
        </ContentPageErrorBoundary>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Content Templates">
        <PageLayout
          title="Content Templates"
          subtitle="Reusable templates for faster content creation"
          breadcrumbs={[
            { label: 'Content', href: '/content' },
            { label: 'Templates' }
          ]}
          actions={PageActions}
        >
          {/* Category Filter */}
          <div className="flex items-center gap-2 mb-6" data-testid="category-filter">
            <Filter className="h-4 w-4 text-[var(--color-text-sub)]" />
            {CATEGORIES.map(category => (
              <Button
                key={category.value}
                variant={categoryFilter === category.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCategoryFilter(category.value)}
                data-testid={`filter-${category.value}`}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          {sortedTemplates.length === 0 ? (
            <EmptyState
              icon={<LayoutTemplate className="h-10 w-10" />}
              title="No templates found"
              description={categoryFilter === 'all' 
                ? "Create your first template to speed up content creation"
                : "No templates in this category yet"
              }
              action={{ label: 'Create Template', onClick: () => setShowCreateModal(true), icon: Plus }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="templates-grid">
              {sortedTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="p-4 hover:shadow-md transition-shadow"
                  data-testid={`template-${template.id}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {template.mediaType === 'image' && <ImageIcon className="h-4 w-4 text-[var(--color-text-sub)]" />}
                      {template.mediaType === 'video' && <Video className="h-4 w-4 text-[var(--color-text-sub)]" />}
                      {template.mediaType === 'text' && <FileText className="h-4 w-4 text-[var(--color-text-sub)]" />}
                      {template.aiGenerated && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(template.id)}
                      className={`p-1 rounded transition-colors ${
                        template.isFavorite 
                          ? 'text-yellow-500' 
                          : 'text-[var(--color-text-muted)] hover:text-yellow-500'
                      }`}
                      data-testid={`favorite-${template.id}`}
                    >
                      <Star className={`h-4 w-4 ${template.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-[var(--color-text-main)] mb-2">{template.name}</h3>

                  {/* Caption Preview */}
                  <p className="text-sm text-[var(--color-text-sub)] line-clamp-3 mb-3">
                    {template.caption}
                  </p>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.hashtags.slice(0, 3).map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[var(--color-text-sub)] rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {template.hashtags.length > 3 && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        +{template.hashtags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-sub)]">
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        {template.usageCount} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Create Template Modal Placeholder */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
              <Card className="w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()} data-testid="create-template-modal">
                <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Create Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                      Template Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[var(--color-text-main)]"
                      placeholder="E.g., Weekly Update"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                      Category
                    </label>
                    <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[var(--color-text-main)]">
                      <option value="promotional">Promotional</option>
                      <option value="engagement">Engagement</option>
                      <option value="announcement">Announcement</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                      Caption Template
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[var(--color-text-main)]"
                      rows={4}
                      placeholder="Write your caption template..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary">
                      Create Template
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </PageLayout>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
