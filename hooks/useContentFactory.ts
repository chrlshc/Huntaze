/**
 * Content Factory Hook
 * 
 * React hook for managing Content Factory operations.
 * Handles production jobs, script generation, and job status polling.
 */

import { useState, useCallback } from 'react';
// Types for Content Factory
export type SourceType = 'upload' | 'link';
export type Platform = 'tiktok' | 'instagram' | 'reddit';
export type ProductionJobStatus = 'idle' | 'queued' | 'processing' | 'needs_review' | 'ready' | 'failed';

export interface ScriptOutput {
  hook: string;
  body: string;
  cta: string;
  variations?: { hook: string; body: string; cta: string }[];
}

export interface ProductionSettings {
  captions: boolean;
  smartCuts: boolean;
  safeZoneCrop: boolean;
  watermarkFree: boolean;
}

export interface ProductionOutput {
  variant: string;
  url: string;
  duration: string;
}

export interface ProductionJob {
  id: string;
  status: ProductionJobStatus;
  sourceType: SourceType;
  sourceUrl?: string;
  filePath?: string;
  idea: string;
  script?: ScriptOutput;
  targets: Platform[];
  settings: ProductionSettings;
  outputs?: ProductionOutput[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseContentFactoryOptions {
  onJobComplete?: (job: ProductionJob) => void;
  onJobError?: (error: string) => void;
}

interface CreateJobInput {
  sourceType: SourceType;
  sourceUrl?: string;
  filePath?: string;
  idea: string;
  script?: ScriptOutput;
  targets: Platform[];
  settings: ProductionSettings;
}

interface GenerateScriptInput {
  idea: string;
  audience: 'existing_fans' | 'new_fans' | 'all';
  goal: 'views' | 'link_taps' | 'new_subs';
  mode: 'simple' | 'pro';
}

export function useContentFactory(options: UseContentFactoryOptions = {}) {
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [currentJob, setCurrentJob] = useState<ProductionJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createJob = useCallback(async (input: CreateJobInput): Promise<ProductionJob | null> => {
    setIsCreatingJob(true);
    setError(null);

    try {
      const response = await fetch('/api/content/factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create job');
      }

      const data = await response.json();
      const job: ProductionJob = {
        id: data.job.id,
        status: data.job.status,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        filePath: input.filePath,
        idea: input.idea,
        script: input.script,
        targets: input.targets,
        settings: input.settings,
        createdAt: data.job.createdAt,
        updatedAt: data.job.createdAt,
      };

      setCurrentJob(job);
      return job;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      options.onJobError?.(message);
      return null;
    } finally {
      setIsCreatingJob(false);
    }
  }, [options]);

  const getJobStatus = useCallback(async (jobId: string): Promise<ProductionJob | null> => {
    try {
      const response = await fetch(`/api/content/factory/${jobId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch job');
      }

      const data = await response.json();
      const job = data.job as ProductionJob;
      
      setCurrentJob(job);

      if (job.status === 'ready') {
        options.onJobComplete?.(job);
      }

      return job;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    }
  }, [options]);

  const approveJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/content/factory/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve job');
      }

      const data = await response.json();
      setCurrentJob(data.job);
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return false;
    }
  }, []);

  const generateScript = useCallback(async (input: GenerateScriptInput): Promise<ScriptOutput | null> => {
    setIsGeneratingScript(true);
    setError(null);

    try {
      // In production, this would call an AI API
      // For now, simulate with a delay and mock response
      await new Promise(resolve => setTimeout(resolve, 2000));

      const script: ScriptOutput = {
        hook: `"Wait, you're still doing it wrong..." (pattern interrupt)`,
        body: `Here's the thing about ${input.idea.toLowerCase()} that nobody talks about. Most people think it's about X, but it's actually about Y. Let me show you...`,
        cta: `Link in bio for the full guide. Drop a 🔥 if you want part 2!`,
      };

      if (input.mode === 'pro') {
        script.variations = [
          {
            hook: `POV: You just discovered the ${input.idea.toLowerCase()} hack`,
            body: `This changed everything for me. Here's what I learned...`,
            cta: `Save this for later and follow for more tips!`,
          },
          {
            hook: `Stop scrolling if you care about ${input.idea.toLowerCase()}`,
            body: `I tested this for 30 days and the results were insane...`,
            cta: `Comment "GUIDE" and I'll send you the full breakdown!`,
          },
        ];
      }

      return script;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsGeneratingScript(false);
    }
  }, []);

  const pollJobStatus = useCallback(async (
    jobId: string,
    intervalMs: number = 2000,
    maxAttempts: number = 30
  ): Promise<ProductionJob | null> => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const job = await getJobStatus(jobId);
      
      if (!job) {
        return null;
      }

      if (job.status === 'ready' || job.status === 'failed') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }

    setError('Job polling timed out');
    return null;
  }, [getJobStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearJob = useCallback(() => {
    setCurrentJob(null);
  }, []);

  return {
    // State
    isCreatingJob,
    isGeneratingScript,
    currentJob,
    error,
    
    // Actions
    createJob,
    getJobStatus,
    approveJob,
    generateScript,
    pollJobStatus,
    clearError,
    clearJob,
  };
}

export default useContentFactory;
