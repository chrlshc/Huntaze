'use client';

/**
 * Mock Content Hook
 * 
 * Provides mock data for content management when the real API is not available
 */

import { useState, useEffect } from 'react';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: 'image' | 'video' | 'text';
  status: 'draft' | 'scheduled' | 'published';
  platform: 'onlyfans' | 'fansly' | 'instagram' | 'tiktok';
  tags?: string[];
  mediaUrl?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentResponse {
  data: {
    items: ContentItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

interface ContentOptions {
  status?: 'all' | 'draft' | 'scheduled' | 'published';
  platform?: string;
  limit?: number;
  offset?: number;
}

// Mock data
const mockContent: ContentItem[] = [
  {
    id: '1',
    title: 'Summer Bikini Photoshoot',
    description: 'Beach day fun in the sun',
    type: 'image',
    status: 'published',
    platform: 'onlyfans',
    mediaUrl: 'https://example.com/image1.jpg',
    tags: ['summer', 'beach', 'bikini'],
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:30:00Z',
  },
  {
    id: '2',
    title: 'Behind the Scenes Video',
    description: 'Exclusive backstage footage',
    type: 'video',
    status: 'scheduled',
    platform: 'fansly',
    mediaUrl: 'https://example.com/video1.mp4',
    scheduledFor: '2025-12-20T15:00:00Z',
    createdAt: '2025-12-05T14:00:00Z',
    updatedAt: '2025-12-05T14:30:00Z',
  },
  {
    id: '3',
    title: 'Workout Routine Teaser',
    description: 'Get fit with me',
    type: 'video',
    status: 'draft',
    platform: 'instagram',
    mediaUrl: 'https://example.com/video2.mp4',
    createdAt: '2025-12-08T09:00:00Z',
    updatedAt: '2025-12-08T09:30:00Z',
  },
  {
    id: '4',
    title: 'Quick Makeup Tutorial',
    description: 'Everyday glam look',
    type: 'video',
    status: 'published',
    platform: 'tiktok',
    mediaUrl: 'https://example.com/video3.mp4',
    createdAt: '2025-11-25T11:00:00Z',
    updatedAt: '2025-11-25T11:30:00Z',
  },
  {
    id: '5',
    title: 'New Lingerie Collection',
    description: 'Just arrived',
    type: 'image',
    status: 'scheduled',
    platform: 'onlyfans',
    mediaUrl: 'https://example.com/image2.jpg',
    scheduledFor: '2025-12-18T18:00:00Z',
    createdAt: '2025-12-06T16:00:00Z',
    updatedAt: '2025-12-06T16:30:00Z',
  },
];

// Generate more mock data
for (let i = 6; i <= 25; i++) {
  const randomStatus = ['draft', 'scheduled', 'published'][Math.floor(Math.random() * 3)] as 'draft' | 'scheduled' | 'published';
  const randomType = ['image', 'video', 'text'][Math.floor(Math.random() * 3)] as 'image' | 'video' | 'text';
  const randomPlatform = ['onlyfans', 'fansly', 'instagram', 'tiktok'][Math.floor(Math.random() * 4)] as 'onlyfans' | 'fansly' | 'instagram' | 'tiktok';
  const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString();
  
  mockContent.push({
    id: String(i),
    title: `Content Item ${i}`,
    description: `Description for content item ${i}`,
    type: randomType,
    status: randomStatus,
    platform: randomPlatform,
    mediaUrl: randomType === 'image' ? `https://example.com/image${i}.jpg` : 
             randomType === 'video' ? `https://example.com/video${i}.mp4` : undefined,
    scheduledFor: randomStatus === 'scheduled' ? new Date(Date.now() + Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    createdAt: randomDate,
    updatedAt: randomDate,
  });
}

let storedContent = [...mockContent];

export function useContent(options?: ContentOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ContentResponse | null>(null);

  const { status = 'all', platform, limit = 50, offset = 0 } = options || {};

  // Simulate API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        let filtered = [...storedContent];
        
        if (status !== 'all') {
          filtered = filtered.filter(item => item.status === status);
        }
        
        if (platform) {
          filtered = filtered.filter(item => item.platform === platform);
        }
        
        // Sort by created date, newest first
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const paginatedItems = filtered.slice(offset, offset + limit);
        
        setData({
          data: {
            items: paginatedItems,
            pagination: {
              total: filtered.length,
              limit,
              offset,
            },
          },
        });
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    }, 800); // Simulate network delay
    
    return () => clearTimeout(timer);
  }, [status, platform, limit, offset]);

  // Mock mutation functions
  const mutate = async () => {
    setIsLoading(true);
    
    // Wait a bit to simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...storedContent];
    
    if (status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }
    
    if (platform) {
      filtered = filtered.filter(item => item.platform === platform);
    }
    
    // Sort by created date, newest first
    filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const paginatedItems = filtered.slice(offset, offset + limit);
    
    setData({
      data: {
        items: paginatedItems,
        pagination: {
          total: filtered.length,
          limit,
          offset,
        },
      },
    });
    
    setIsLoading(false);
  };

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}

export async function createContent(data: Partial<ContentItem>): Promise<ContentItem> {
  // Wait a bit to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newContent: ContentItem = {
    id: `${Date.now()}`,
    title: data.title || 'Untitled',
    description: data.description,
    type: data.type || 'text',
    status: data.status || 'draft',
    platform: data.platform || 'onlyfans',
    tags: data.tags,
    mediaUrl: data.mediaUrl,
    scheduledFor: data.scheduledFor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  storedContent = [newContent, ...storedContent];
  
  return newContent;
}

export async function updateContent(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
  // Wait a bit to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = storedContent.findIndex(item => item.id === id);
  
  if (index === -1) {
    throw new Error('Content not found');
  }
  
  const updatedContent = {
    ...storedContent[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  storedContent[index] = updatedContent;
  
  return updatedContent;
}

export async function deleteContent(id: string): Promise<void> {
  // Wait a bit to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = storedContent.findIndex(item => item.id === id);
  
  if (index === -1) {
    throw new Error('Content not found');
  }
  
  storedContent.splice(index, 1);
}
