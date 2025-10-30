import { useState, useEffect, useCallback } from 'react';

// Types
interface Media {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  metadata?: string;
  createdAt: string;
  _count: {
    messages: number;
  };
}

interface AIGeneration {
  id: string;
  content: string;
  type: string;
  generationsLeft: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook: useContentLibrary
export function useContentLibrary(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  search?: string;
  tags?: string[];
}) {
  const [data, setData] = useState<Media[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
      if (params?.type) queryParams.set('type', params.type);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.tags?.length) queryParams.set('tags', params.tags.join(','));

      const response = await fetch(`/api/content/library?${queryParams}`);
      const result: PaginatedResponse<Media> = await response.json();

      if (result.success) {
        setData(result.data);
        setMetadata(result.metadata);
      } else {
        setError(result.error?.message || 'Failed to fetch content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.pageSize, params?.type, params?.search, params?.tags]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const uploadContent = async (content: {
    title: string;
    description?: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
    tags?: string[];
    metadata?: any;
  }) => {
    try {
      const response = await fetch('/api/content/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      const result: ApiResponse<Media> = await response.json();

      if (result.success) {
        await fetchContent(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to upload content');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    content: data,
    metadata,
    loading,
    error,
    refetch: fetchContent,
    uploadContent,
  };
}

// Hook: useAIGeneration
export function useAIGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (params: {
    type: string;
    prompt: string;
    style?: string;
    length?: string;
    tone?: string;
  }): Promise<AIGeneration> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/content/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result: ApiResponse<AIGeneration> = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to generate content');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateContent,
    loading,
    error,
  };
}
