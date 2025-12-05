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

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Sparkles, 
  Image,
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

// Category config
const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'all', label: 'All Templates' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'announcement', label: 'Announcements' },
  { value: 'personal', label: 'Personal' },
];

export default function ContentTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        // Mock data
        const mockTemplates: ContentTemplate[] = [
          {
            id: '1',
            name: 'New Content Teaser',
            category: 'promotional',
            mediaType: 'image',
            caption: '🔥 Something special is coming... Stay tuned! 👀\n\n#exclusive #comingsoon #content',
            hashtags: ['exclusive', 'comingsoon', 'content'],
            platforms: ['instagram', 'tiktok'],
            usageCount: 24,
            isFavorite: true,
            createdAt: '2024-11-15',
            aiGenerated: true,
          },
          {
            id: '2',
            name: 'Thank You Post',
            category: 'engagement',
            mediaType: 'text',
            caption: '💕 Thank you so much for all the love and support! You guys are amazing!\n\nWhat would you like to see more of? Let me know in the comments! 👇',
            hashtags: ['thankyou', 'community', 'love'],
            platforms: ['instagram', 'twitter'],
            usageCount: 18,
            isFavorite: true,
            createdAt: '2024-11-20',
          },
          {
            id: '3',
            name: 'PPV Announcement',
            category: 'promotional',
            mediaType: 'image',
            caption: '🎁 Special PPV just dropped! Check your DMs for something exclusive...\n\nDon\'t miss out! 💋',
            hashtags: ['exclusive', 'ppv', 'special'],
            platforms: ['onlyfans'],
            usageCount: 31,
            isFavorite: false,
            createdAt: '2024-11-25',
            aiGenerated: true,
          },
          {
            id: '4',
            name: 'Q&A Session',
            category: 'engagement',
            mediaType: 'text',
            caption: '❓ Q&A Time! Ask me anything in the comments and I\'ll answer the best ones!\n\nBe creative! 😊',
            hashtags: ['qanda', 'askmeanything', 'interactive'],
            platforms: ['instagram', 'tiktok', 'twitter'],
            usageCount: 12,
            isFavorite: false,
            createdAt: '2024-12-01',
          },
          {
            id: '5',
            name: 'Behind The Scenes',
            category: 'personal',
            mediaType: 'video',
            caption: '📸 Behind the scenes of today\'s shoot! What do you think?\n\n#bts #behindthescenes #dayinmylife',
            hashtags: ['bts', 'behindthescenes', 'dayinmylife'],
            platforms: ['instagram', 'tiktok'],
            usageCount: 8,
            isFavorite: false,
            createdAt: '2024-12-02',
          },
        ];
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

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
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
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

  if (loading) {
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
              icon={LayoutTemplate}
              title="No templates found"
              description={categoryFilter === 'all' 
                ? "Create your first template to speed up content creation"
                : "No templates in this category yet"
              }
              actionLabel="Create Template"
              onAction={() => setShowCreateModal(true)}
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
                      {template.mediaType === 'image' && <Image className="h-4 w-4 text-[var(--color-text-sub)]" />}
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
