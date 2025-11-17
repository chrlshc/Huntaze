/**
 * Content API Test Fixtures
 * 
 * Reusable test data for content integration tests
 */

export const validContentData = {
  minimal: {
    title: 'Minimal Content',
    type: 'image' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  complete: {
    title: 'Complete Content',
    text: 'This is a complete content item with all fields',
    type: 'video' as const,
    platform: 'tiktok' as const,
    status: 'published' as const,
    category: 'entertainment',
    tags: ['test', 'demo', 'fixture'],
    mediaIds: ['media-1', 'media-2', 'media-3'],
    scheduledAt: new Date('2025-12-01T10:00:00Z'),
  },
  draft: {
    title: 'Draft Content',
    type: 'text' as const,
    platform: 'onlyfans' as const,
    status: 'draft' as const,
    text: 'This is a draft post',
  },
  scheduled: {
    title: 'Scheduled Content',
    type: 'image' as const,
    platform: 'instagram' as const,
    status: 'scheduled' as const,
    scheduledAt: new Date('2025-12-15T14:00:00Z'),
  },
  published: {
    title: 'Published Content',
    type: 'video' as const,
    platform: 'tiktok' as const,
    status: 'published' as const,
    publishedAt: new Date('2025-11-01T10:00:00Z'),
  },
};

export const invalidContentData = {
  missingTitle: {
    type: 'image',
    platform: 'instagram',
    status: 'draft',
  },
  missingType: {
    title: 'No Type',
    platform: 'instagram',
    status: 'draft',
  },
  missingPlatform: {
    title: 'No Platform',
    type: 'image',
    status: 'draft',
  },
  missingStatus: {
    title: 'No Status',
    type: 'image',
    platform: 'instagram',
  },
  invalidType: {
    title: 'Invalid Type',
    type: 'invalid-type',
    platform: 'instagram',
    status: 'draft',
  },
  invalidPlatform: {
    title: 'Invalid Platform',
    type: 'image',
    platform: 'invalid-platform',
    status: 'draft',
  },
  invalidStatus: {
    title: 'Invalid Status',
    type: 'image',
    platform: 'instagram',
    status: 'invalid-status',
  },
  emptyTitle: {
    title: '',
    type: 'image',
    platform: 'instagram',
    status: 'draft',
  },
};

export const xssAttackData = {
  scriptInTitle: {
    title: '<script>alert("xss")</script>',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  scriptInText: {
    title: 'XSS Test',
    text: '<script>document.cookie</script>',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  imgOnerror: {
    title: 'Image XSS',
    text: '<img src=x onerror=alert(1)>',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  iframeEmbed: {
    title: 'Iframe XSS',
    text: '<iframe src="javascript:alert(1)"></iframe>',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
};

export const sqlInjectionData = {
  dropTable: {
    title: "'; DROP TABLE content; --",
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  union: {
    title: "' UNION SELECT * FROM users --",
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  comment: {
    title: "admin'--",
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
};

export const edgeCaseData = {
  veryLongTitle: {
    title: 'A'.repeat(1000),
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  veryLongText: {
    title: 'Long Text Test',
    text: 'Lorem ipsum '.repeat(10000),
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  unicodeCharacters: {
    title: '🎉 Unicode Test 你好 مرحبا',
    text: 'Testing unicode: 🚀 ❤️ 🎨',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  specialCharacters: {
    title: 'Special: !@#$%^&*()_+-=[]{}|;:,.<>?',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
  },
  emptyArrays: {
    title: 'Empty Arrays',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
    tags: [],
    mediaIds: [],
  },
  largeArrays: {
    title: 'Large Arrays',
    type: 'text' as const,
    platform: 'instagram' as const,
    status: 'draft' as const,
    tags: Array.from({ length: 100 }, (_, i) => `tag-${i}`),
    mediaIds: Array.from({ length: 100 }, (_, i) => `media-${i}`),
  },
};

export const updateData = {
  titleOnly: {
    title: 'Updated Title',
  },
  statusOnly: {
    status: 'published' as const,
  },
  multipleFields: {
    title: 'Updated Title',
    text: 'Updated text',
    status: 'published' as const,
    tags: ['updated', 'tags'],
  },
  clearOptionalFields: {
    text: null,
    category: null,
    tags: [],
    mediaIds: [],
  },
};

export const filterParams = {
  byStatus: {
    draft: { status: 'draft' },
    scheduled: { status: 'scheduled' },
    published: { status: 'published' },
  },
  byPlatform: {
    instagram: { platform: 'instagram' },
    tiktok: { platform: 'tiktok' },
    onlyfans: { platform: 'onlyfans' },
    fansly: { platform: 'fansly' },
  },
  byType: {
    image: { type: 'image' },
    video: { type: 'video' },
    text: { type: 'text' },
  },
  combined: {
    draftImages: { status: 'draft', type: 'image' },
    publishedVideos: { status: 'published', type: 'video' },
    instagramDrafts: { platform: 'instagram', status: 'draft' },
  },
};

export const paginationParams = {
  firstPage: { limit: 10, offset: 0 },
  secondPage: { limit: 10, offset: 10 },
  smallPage: { limit: 5, offset: 0 },
  largePage: { limit: 100, offset: 0 },
  middlePage: { limit: 20, offset: 40 },
};

/**
 * Generate bulk content data for testing
 */
export function generateBulkContent(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Bulk Content ${i}`,
    text: `Description for content ${i}`,
    type: (['image', 'video', 'text'] as const)[i % 3],
    platform: (['instagram', 'tiktok', 'onlyfans', 'fansly'] as const)[i % 4],
    status: (['draft', 'scheduled', 'published'] as const)[i % 3],
    tags: [`tag-${i}`, `category-${i % 5}`],
  }));
}

/**
 * Generate content with specific distribution
 */
export function generateDistributedContent(distribution: {
  draft?: number;
  scheduled?: number;
  published?: number;
}) {
  const content = [];
  let index = 0;

  if (distribution.draft) {
    for (let i = 0; i < distribution.draft; i++) {
      content.push({
        title: `Draft Content ${index++}`,
        type: 'image' as const,
        platform: 'instagram' as const,
        status: 'draft' as const,
      });
    }
  }

  if (distribution.scheduled) {
    for (let i = 0; i < distribution.scheduled; i++) {
      content.push({
        title: `Scheduled Content ${index++}`,
        type: 'video' as const,
        platform: 'tiktok' as const,
        status: 'scheduled' as const,
        scheduledAt: new Date(Date.now() + i * 86400000), // Stagger by days
      });
    }
  }

  if (distribution.published) {
    for (let i = 0; i < distribution.published; i++) {
      content.push({
        title: `Published Content ${index++}`,
        type: 'text' as const,
        platform: 'onlyfans' as const,
        status: 'published' as const,
        publishedAt: new Date(Date.now() - i * 86400000), // Past dates
      });
    }
  }

  return content;
}
