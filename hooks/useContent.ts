'use client';

import useSWR, { mutate } from 'swr';

export interface ContentItem {
  id: string;
  title: string;
  text?: string;
  type: 'image' | 'video' | 'text';
  platform: 'onlyfans' | 'fansly' | 'instagram' | 'tiktok';
  status: 'draft' | 'scheduled' | 'published';
  category?: string;
  tags?: string[];
  mediaIds?: string[];
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface ContentFilters {
  status?: 'draft' | 'scheduled' | 'published' | 'all';
  platform?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface ContentResponse {
  success: boolean;
  data: {
    items: ContentItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch content items with filters
 */
export function useContent(filters: ContentFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.platform) {
    params.append('platform', filters.platform);
  }
  if (filters.type) {
    params.append('type', filters.type);
  }
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters.offset) {
    params.append('offset', filters.offset.toString());
  }

  const url = `/api/content?${params.toString()}`;
  
  return useSWR<ContentResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

/**
 * Hook to fetch drafts
 */
export function useDrafts(limit = 20, offset = 0) {
  const url = `/api/content/drafts?limit=${limit}&offset=${offset}`;
  
  return useSWR<ContentResponse>(url, fetcher, {
    revalidateOnFocus: false,
  });
}

/**
 * Create content
 */
export async function createContent(data: Partial<ContentItem>) {
  const response = await fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create content');
  }

  // Revalidate content cache
  mutate((key) => typeof key === 'string' && key.startsWith('/api/content'));
  
  return response.json();
}

/**
 * Update content
 */
export async function updateContent(id: string, data: Partial<ContentItem>) {
  const response = await fetch(`/api/content/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update content');
  }

  // Revalidate content cache
  mutate((key) => typeof key === 'string' && key.startsWith('/api/content'));
  
  return response.json();
}

/**
 * Delete content
 */
export async function deleteContent(id: string) {
  const response = await fetch(`/api/content/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete content');
  }

  // Revalidate content cache
  mutate((key) => typeof key === 'string' && key.startsWith('/api/content'));
  
  return response.json();
}

/**
 * Upload media
 */
export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/content/media/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload media');
  }

  return response.json();
}

/**
 * Schedule content
 */
export async function scheduleContent(data: {
  contentId: string;
  scheduledAt: string;
  platforms?: string[];
}) {
  const response = await fetch('/api/content/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to schedule content');
  }

  // Revalidate content cache
  mutate((key) => typeof key === 'string' && key.startsWith('/api/content'));
  
  return response.json();
}

/**
 * Hook to fetch content metrics
 */
export function useContentMetrics(contentId: string) {
  const url = contentId ? `/api/content/metrics?contentId=${contentId}` : null;
  
  return useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });
}
