/**
 * React Hook for Content Task Management
 *
 * Provides state management and API integration for content posting tasks.
 *
 * Requirements: 10.3
 */

import { useState, useCallback, useEffect } from "react";

export type ContentPlatform = "TIKTOK" | "INSTAGRAM";
export type ContentTaskStatus = "PENDING" | "PROCESSING" | "POSTED" | "FAILED" | "CANCELLED";

export interface ContentTask {
  id: string;
  platform: ContentPlatform;
  status: ContentTaskStatus;
  createdAt: string;
  scheduledAt: string | null;
  postedAt: string | null;
  attemptCount: number;
  errorMessage: string | null;
}

export interface TaskStatusSummary {
  total: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  recentTasks: ContentTask[];
}

export interface CreateContentInput {
  platforms: ContentPlatform[];
  asset: {
    sourceType: "UPLOAD" | "URL";
    assetKey?: string;
    sourceUrl?: string;
  };
  script: {
    hook?: string;
    body?: string;
    cta?: string;
    caption: string;
  };
  trendLabel?: string;
  scheduledAt?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  assetKey: string;
  expiresIn: number;
}

interface UseContentTasksOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseContentTasksReturn {
  tasks: ContentTask[];
  summary: TaskStatusSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (input: CreateContentInput) => Promise<{ taskIds: string[] } | null>;
  cancelTask: (taskId: string) => Promise<boolean>;
  getPresignedUrl: (contentType: string, fileSize: number, fileName?: string) => Promise<PresignedUrlResponse | null>;
  uploadFile: (file: File) => Promise<string | null>;
}

export function useContentTasks(options: UseContentTasksOptions = {}): UseContentTasksReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [summary, setSummary] = useState<TaskStatusSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/content/tasks/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch tasks");
      }

      setSummary(data.data);
      setTasks(data.data.recentTasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTask = useCallback(async (input: CreateContentInput): Promise<{ taskIds: string[] } | null> => {
    setError(null);

    try {
      const response = await fetch("/api/content/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create task");
      }

      // Refresh task list after creation
      await refresh();

      return {
        taskIds: data.data.tasks.map((t: any) => t.id),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    }
  }, [refresh]);

  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/content/tasks/${taskId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to cancel task");
      }

      // Refresh task list after cancellation
      await refresh();

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return false;
    }
  }, [refresh]);

  const getPresignedUrl = useCallback(async (
    contentType: string,
    fileSize: number,
    fileName?: string
  ): Promise<PresignedUrlResponse | null> => {
    setError(null);

    try {
      const response = await fetch("/api/content/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, fileSize, fileName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to get presigned URL");
      }

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    setError(null);

    try {
      // Get presigned URL
      const presigned = await getPresignedUrl(file.type, file.size, file.name);
      if (!presigned) {
        return null;
      }

      // Upload file to S3
      const uploadResponse = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      return presigned.assetKey;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    }
  }, [getPresignedUrl]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      refresh();
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    tasks,
    summary,
    isLoading,
    error,
    refresh,
    createTask,
    cancelTask,
    getPresignedUrl,
    uploadFile,
  };
}
