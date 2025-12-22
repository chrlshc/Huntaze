export type ContentStatus = 'draft' | 'scheduled' | 'published';
export type ContentType = 'image' | 'video' | 'text';
export type ContentPlatform = 'onlyfans' | 'fansly' | 'instagram' | 'tiktok';

export interface MockContentItem {
  id: string;
  userId: number;
  title: string;
  text?: string;
  type: ContentType;
  platform: ContentPlatform;
  status: ContentStatus;
  tags: string[];
  media_ids: string[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const nowIso = () => new Date().toISOString();

export const mockContentItems: MockContentItem[] = [
  {
    id: 'cnt_1',
    userId: 1,
    title: 'Summer Bikini Photoshoot',
    text: 'Beach day fun in the sun',
    type: 'image',
    status: 'published',
    platform: 'onlyfans',
    tags: ['summer', 'beach', 'bikini'],
    media_ids: [],
    publishedAt: nowIso(),
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:30:00Z',
  },
  {
    id: 'cnt_2',
    userId: 1,
    title: 'Behind the Scenes Video',
    text: 'Exclusive backstage footage',
    type: 'video',
    status: 'scheduled',
    platform: 'fansly',
    tags: ['bts'],
    media_ids: [],
    scheduledAt: '2025-12-20T15:00:00Z',
    createdAt: '2025-12-05T14:00:00Z',
    updatedAt: '2025-12-05T14:30:00Z',
  },
  {
    id: 'cnt_3',
    userId: 1,
    title: 'Workout Routine Teaser',
    text: 'Get fit with me',
    type: 'video',
    status: 'draft',
    platform: 'instagram',
    tags: ['fitness'],
    media_ids: [],
    createdAt: '2025-12-08T09:00:00Z',
    updatedAt: '2025-12-08T09:30:00Z',
  },
  {
    id: 'cnt_4',
    userId: 1,
    title: 'Quick Makeup Tutorial',
    text: 'Everyday glam look',
    type: 'video',
    status: 'published',
    platform: 'tiktok',
    tags: ['makeup'],
    media_ids: [],
    publishedAt: '2025-11-25T11:00:00Z',
    createdAt: '2025-11-25T11:00:00Z',
    updatedAt: '2025-11-25T11:30:00Z',
  },
  {
    id: 'cnt_5',
    userId: 1,
    title: 'New Lingerie Collection',
    text: 'Just arrived',
    type: 'image',
    status: 'scheduled',
    platform: 'onlyfans',
    tags: ['lingerie'],
    media_ids: [],
    scheduledAt: '2025-12-18T18:00:00Z',
    createdAt: '2025-12-06T16:00:00Z',
    updatedAt: '2025-12-06T16:30:00Z',
  },
];

export function queryContentItems(params: {
  status?: ContentStatus;
  platform?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const {
    status,
    platform,
    type,
    limit = 50,
    offset = 0,
  } = params;

  let items = [...mockContentItems];

  if (status) items = items.filter((i) => i.status === status);
  if (platform) items = items.filter((i) => i.platform === platform);
  if (type) items = items.filter((i) => i.type === type);

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = items.length;
  const sliced = items.slice(offset, offset + limit);
  const hasMore = offset + sliced.length < total;

  return {
    items: sliced,
    pagination: {
      total,
      limit,
      offset,
      hasMore,
    },
  };
}

