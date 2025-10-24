/**
 * Hook React pour l'intégration API optimisée
 * Gère l'état, le cache, les erreurs et les retry automatiquement
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, APIRequestOptions, APIResponse } from '@/lib/services/api-integration-service';
import { APIError } from '@/lib/types/api-errors';

interface UseAPIOptions<T> extends APIRequestOptions {
  // Options spécifiques au hook
  immediate?: boolean;
  dependencies?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: APIError) => void;
  transformData?: (data: any) => T;
  enabled?: boolean;
}

interface UseAPIState<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
  success: boolean;
}

interface UseAPIReturn<T> extends UseAPIState<T> {
  execute: (overrideOptions?: Partial<APIRequestOptions>) => Promise<APIResponse<T>>;
  reset: () => void;
  retry: () => Promise<APIResponse<T>>;
  cancel: () => void;
}

/**
 * Hook principal pour les requêtes API
 */
export function useAPI<T = any>(
  url: string | (() => string),
  options: UseAPIOptions<T> = {}
): UseAPIReturn<T> {
  const {
    immediate = false,
    dependencies = [],
    onSuccess,
    onError,
    transformData,
    enabled = true,
    ...requestOptions
  } = options;

  const [state, setState] = useState<UseAPIState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  // Fonction pour exécuter la requête
  const execute = useCallback(async (
    overrideOptions: Partial<APIRequestOptions> = {}
  ): Promise<APIResponse<T>> => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const currentUrl = typeof url === 'function' ? url() : url;
    const requestId = `${currentUrl}_${Date.now()}`;
    lastRequestRef.current = requestId;

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await apiRequest<T>(currentUrl, {
        ...requestOptions,
        ...overrideOptions,
      });

      // Vérifier si cette requête est toujours la plus récente
      if (lastRequestRef.current !== requestId) {
        return response; // Ignorer si une nouvelle requête a été lancée
      }

      let finalData = response.data;

      // Transformer les données si nécessaire
      if (transformData && finalData) {
        finalData = transformData(finalData);
      }

      setState({
        data: finalData || null,
        loading: false,
        error: null,
        success: response.success,
      });

      if (response.success && onSuccess && finalData) {
        onSuccess(finalData);
      }

      return response;

    } catch (error) {
      const apiError = error as APIError;

      // Vérifier si cette requête est toujours la plus récente
      if (lastRequestRef.current !== requestId) {
        throw error; // Re-throw si une nouvelle requête a été lancée
      }

      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false,
      });

      if (onError) {
        onError(apiError);
      }

      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [url, requestOptions, transformData, onSuccess, onError]);

  // Fonction pour réinitialiser l'état
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  // Fonction pour retry
  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  // Fonction pour annuler
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, []);

  // Exécution automatique
  useEffect(() => {
    if (immediate && enabled) {
      execute().catch(() => {
        // Erreur déjà gérée dans execute
      });
    }
  }, [immediate, enabled, ...dependencies]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    retry,
    cancel,
  };
}

/**
 * Hook spécialisé pour les requêtes GET
 */
export function useAPIGet<T = any>(
  url: string | (() => string),
  options: Omit<UseAPIOptions<T>, 'method'> = {}
): UseAPIReturn<T> {
  return useAPI<T>(url, { ...options, method: 'GET', immediate: true });
}

/**
 * Hook spécialisé pour les mutations (POST, PUT, DELETE)
 */
export function useAPIMutation<T = any, D = any>(
  url: string | (() => string),
  options: Omit<UseAPIOptions<T>, 'method' | 'immediate'> = {}
): {
  mutate: (data?: D, overrideOptions?: Partial<APIRequestOptions>) => Promise<APIResponse<T>>;
  mutateAsync: (data?: D, overrideOptions?: Partial<APIRequestOptions>) => Promise<T>;
  reset: () => void;
} & UseAPIState<T> {
  const { execute, reset, ...state } = useAPI<T>(url, { ...options, immediate: false });

  const mutate = useCallback(async (
    data?: D,
    overrideOptions: Partial<APIRequestOptions> = {}
  ): Promise<APIResponse<T>> => {
    return execute({
      body: data,
      ...overrideOptions,
    });
  }, [execute]);

  const mutateAsync = useCallback(async (
    data?: D,
    overrideOptions: Partial<APIRequestOptions> = {}
  ): Promise<T> => {
    const response = await mutate(data, overrideOptions);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Mutation failed');
    }
    return response.data;
  }, [mutate]);

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}

/**
 * Hook pour les requêtes paginées
 */
interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface UsePaginatedAPIOptions<T> extends Omit<UseAPIOptions<PaginatedData<T>>, 'immediate'> {
  initialPage?: number;
  pageSize?: number;
  autoLoad?: boolean;
}

export function usePaginatedAPI<T = any>(
  baseUrl: string,
  options: UsePaginatedAPIOptions<T> = {}
): {
  data: T[];
  total: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: APIError | null;
  loadMore: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
} {
  const {
    initialPage = 1,
    pageSize = 20,
    autoLoad = true,
    ...apiOptions
  } = options;

  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const url = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  }, [baseUrl, page, pageSize]);

  const { data, loading, error, execute, reset: resetAPI } = useAPI<PaginatedData<T>>(url, {
    ...apiOptions,
    immediate: autoLoad,
    dependencies: [page],
    onSuccess: (paginatedData) => {
      if (page === 1) {
        // Première page ou refresh
        setAllData(paginatedData.items);
      } else {
        // Pages suivantes
        setAllData(prev => [...prev, ...paginatedData.items]);
      }
      
      setTotal(paginatedData.total);
      setHasMore(paginatedData.hasMore);
    },
  });

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const loadPage = useCallback(async (newPage: number) => {
    setPage(newPage);
  }, []);

  const refresh = useCallback(async () => {
    setPage(1);
    setAllData([]);
    await execute();
  }, [execute]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setAllData([]);
    setTotal(0);
    setHasMore(true);
    resetAPI();
  }, [initialPage, resetAPI]);

  return {
    data: allData,
    total,
    page,
    hasMore,
    loading,
    error,
    loadMore,
    loadPage,
    refresh,
    reset,
  };
}

/**
 * Hook pour les requêtes en temps réel avec polling
 */
interface UsePollingAPIOptions<T> extends UseAPIOptions<T> {
  interval?: number;
  enabled?: boolean;
  stopOnError?: boolean;
}

export function usePollingAPI<T = any>(
  url: string | (() => string),
  options: UsePollingAPIOptions<T> = {}
): UseAPIReturn<T> & {
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
} {
  const {
    interval = 5000,
    enabled = true,
    stopOnError = false,
    ...apiOptions
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const apiHook = useAPI<T>(url, {
    ...apiOptions,
    immediate: true,
  });

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      apiHook.execute().catch((error) => {
        if (stopOnError) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      });
    }, interval);
  }, [apiHook.execute, interval, stopOnError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto-start polling
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...apiHook,
    startPolling,
    stopPolling,
    isPolling,
  };
}

/**
 * Hook pour la gestion des uploads de fichiers
 */
interface UseFileUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: APIError) => void;
  maxSize?: number;
  allowedTypes?: string[];
}

export function useFileUpload(
  uploadUrl: string,
  options: UseFileUploadOptions = {}
) {
  const {
    onProgress,
    onSuccess,
    onError,
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = [],
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    // Validation
    if (maxSize && file.size > maxSize) {
      const error = `File size exceeds ${maxSize / 1024 / 1024}MB limit`;
      setError(error);
      onError?.(new Error(error) as APIError);
      return;
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      const error = `File type ${file.type} not allowed`;
      setError(error);
      onError?.(new Error(error) as APIError);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();

      // Gestion du progrès
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressPercent = (event.loaded / event.total) * 100;
          setProgress(progressPercent);
          onProgress?.(progressPercent);
        }
      });

      // Promesse pour gérer la réponse
      const response = await new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

      setUploading(false);
      setProgress(100);
      onSuccess?.(response);
      
      return response;

    } catch (error) {
      setUploading(false);
      setProgress(0);
      const apiError = error as APIError;
      setError(apiError.message);
      onError?.(apiError);
      throw error;
    }
  }, [uploadUrl, maxSize, allowedTypes, onProgress, onSuccess, onError]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  };
}