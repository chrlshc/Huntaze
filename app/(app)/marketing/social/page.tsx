'use client';

/**
 * Marketing Social Planner Page
 * 
 * Displays connected platforms, posting schedule, and AI caption generation.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 5.3, 5.5
 */
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Sparkles, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  Video,
  FileText,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';

// Platform types
type PlatformType = 'instagram' | 'tiktok' | 'twitter' | 'reddit' | 'onlyfans';

// Platform interface
interface Platform {
  id: PlatformType;
  name: string;
  connected: boolean;
  username?: string;
  followers?: number;
  lastPost?: string;
  color: string;
  icon: string;
}

// Scheduled post interface
interface ScheduledPost {
  id: string;
  platforms: PlatformType[];
  content: {
    caption: string;
    mediaType: 'image' | 'video' | 'text';
    mediaUrl?: string;
  };
  scheduledAt: string;
  status: 'scheduled' | 'published' | 'failed';
  aiGenerated?: boolean;
}

// Platform icons (SVG paths)
const PLATFORM_ICONS: Record<PlatformType, JSX.Element> = {
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
    </svg>
  ),
  tiktok: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  reddit: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
    </svg>
  ),
  onlyfans: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
  ),
};

const PLATFORM_COLORS: Record<PlatformType, string> = {
  instagram: 'from-purple-600 via-pink-600 to-orange-500',
  tiktok: 'bg-black dark:bg-white',
  twitter: 'bg-black dark:bg-white',
  reddit: 'bg-orange-500',
  onlyfans: 'bg-blue-500',
};

export default function MarketingSocialPage() {
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showCaptionGenerator, setShowCaptionGenerator] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock data
        const mockPlatforms: Platform[] = [
          { id: 'instagram', name: 'Instagram', connected: true, username: '@creator', followers: 15420, lastPost: '2024-12-03', color: 'purple', icon: 'instagram' },
          { id: 'tiktok', name: 'TikTok', connected: true, username: '@creator', followers: 8930, lastPost: '2024-12-02', color: 'black', icon: 'tiktok' },
          { id: 'twitter', name: 'X (Twitter)', connected: false, color: 'black', icon: 'twitter' },
          { id: 'reddit', name: 'Reddit', connected: true, username: 'u/creator', followers: 2340, lastPost: '2024-12-01', color: 'orange', icon: 'reddit' },
        ];

        const mockPosts: ScheduledPost[] = [
          {
            id: '1',
            platforms: ['instagram', 'tiktok'],
            content: { caption: 'New content dropping tomorrow! 🔥 Stay tuned...', mediaType: 'image', mediaUrl: '/placeholder.jpg' },
            scheduledAt: '2024-12-05T14:00:00Z',
            status: 'scheduled',
            aiGenerated: true,
          },
          {
            id: '2',
            platforms: ['reddit'],
            content: { caption: 'Behind the scenes of my latest shoot! What do you think?', mediaType: 'image' },
            scheduledAt: '2024-12-06T18:00:00Z',
            status: 'scheduled',
          },
          {
            id: '3',
            platforms: ['instagram'],
            content: { caption: 'Thank you for 15k followers! 💕', mediaType: 'text' },
            scheduledAt: '2024-12-04T12:00:00Z',
            status: 'published',
          },
        ];

        setPlatforms(mockPlatforms);
        setScheduledPosts(mockPosts);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const connectedPlatforms = platforms.filter(p => p.connected);
  const disconnectedPlatforms = platforms.filter(p => !p.connected);

  // Page actions
  const PageActions = (
    <div className="flex items-center gap-2">
      <Link href="/marketing/calendar">
        <Button variant="ghost" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Calendar
        </Button>
      </Link>
      <Button 
        variant="primary" 
        size="sm"
        onClick={() => setShowCaptionGenerator(true)}
        data-testid="ai-caption-generator"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        AI Caption
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <PageLayout
          title="Social Planner"
          subtitle="Loading..."
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Social Planner' }
          ]}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </Card>
            ))}
          </div>
        </PageLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Social Planner">
        <PageLayout
          title="Social Planner"
          subtitle="Manage your social media presence across platforms"
          breadcrumbs={[
            { label: 'Marketing', href: '/marketing' },
            { label: 'Social Planner' }
          ]}
          actions={PageActions}
        >
          {/* AI Caption Generator Banner */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20" data-testid="ai-caption-banner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">AI Caption Generator</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">
                    Generate engaging captions for your posts with AI assistance
                  </p>
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowCaptionGenerator(true)}
              >
                Generate Caption
              </Button>
            </div>
          </Card>

          {/* Connected Platforms */}
          <section className="mb-8" data-testid="connected-platforms">
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Connected Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {connectedPlatforms.map((platform) => (
                <Card key={platform.id} className="p-4" data-testid={`platform-${platform.id}`} data-connected="true">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${platform.id === 'instagram' ? 'bg-gradient-to-br ' + PLATFORM_COLORS[platform.id] : PLATFORM_COLORS[platform.id]} text-white`}>
                      {PLATFORM_ICONS[platform.id]}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-main)]">{platform.name}</h3>
                  <p className="text-sm text-[var(--color-text-sub)]">{platform.username}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-sub)]">Followers</span>
                      <span className="font-medium text-[var(--color-text-main)]">{platform.followers?.toLocaleString()}</span>
                    </div>
                    {platform.lastPost && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[var(--color-text-sub)]">Last Post</span>
                        <span className="text-[var(--color-text-main)]">{new Date(platform.lastPost).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Connect More Card */}
              {disconnectedPlatforms.length > 0 && (
                <Link href="/integrations">
                  <Card className="p-4 border-dashed hover:border-blue-500 transition-colors cursor-pointer h-full flex flex-col items-center justify-center text-center">
                    <Plus className="h-8 w-8 text-[var(--color-text-muted)] mb-2" />
                    <p className="font-medium text-[var(--color-text-main)]">Connect More</p>
                    <p className="text-sm text-[var(--color-text-sub)]">{disconnectedPlatforms.length} available</p>
                  </Card>
                </Link>
              )}
            </div>
          </section>

          {/* Scheduled Posts */}
          <section data-testid="scheduled-posts">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Scheduled Posts</h2>
              <Link href="/marketing/calendar">
                <Button variant="ghost" size="sm">
                  View Calendar
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            {scheduledPosts.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No scheduled posts"
                description="Schedule your first post to start building your social presence"
                actionLabel="Schedule Post"
                actionHref="/marketing/calendar"
              />
            ) : (
              <div className="space-y-4">
                {scheduledPosts.map((post) => (
                  <Card key={post.id} className="p-4" data-testid={`post-${post.id}`} data-status={post.status}>
                    <div className="flex items-start gap-4">
                      {/* Media Preview */}
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        {post.content.mediaType === 'image' && <Image className="h-6 w-6 text-[var(--color-text-muted)]" />}
                        {post.content.mediaType === 'video' && <Video className="h-6 w-6 text-[var(--color-text-muted)]" />}
                        {post.content.mediaType === 'text' && <FileText className="h-6 w-6 text-[var(--color-text-muted)]" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {post.platforms.map((platformId) => (
                            <span key={platformId} className="text-[var(--color-text-sub)]">
                              {PLATFORM_ICONS[platformId]}
                            </span>
                          ))}
                          {post.aiGenerated && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            post.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            post.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-[var(--color-text-main)] line-clamp-2">{post.content.caption}</p>
                        <p className="text-sm text-[var(--color-text-sub)] mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(post.scheduledAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* AI Caption Generator Modal would go here */}
          {showCaptionGenerator && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCaptionGenerator(false)}>
              <Card className="w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()} data-testid="caption-generator-modal">
                <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">AI Caption Generator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                      Describe your content
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[var(--color-text-main)]"
                      rows={3}
                      placeholder="E.g., Beach photoshoot, summer vibes, new bikini..."
                      data-testid="caption-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
                      Tone
                    </label>
                    <select 
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[var(--color-text-main)]"
                      data-testid="tone-select"
                    >
                      <option value="playful">Playful & Fun</option>
                      <option value="professional">Professional</option>
                      <option value="flirty">Flirty</option>
                      <option value="mysterious">Mysterious</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowCaptionGenerator(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" data-testid="generate-caption-btn">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generate
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
