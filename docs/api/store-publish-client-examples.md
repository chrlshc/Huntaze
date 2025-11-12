# Store Publish API - Client Integration Examples

## Overview

This document provides practical examples for integrating the `/api/store/publish` endpoint in various client contexts.

## Table of Contents

1. [JavaScript/TypeScript](#javascripttypescript)
2. [React Hooks](#react-hooks)
3. [React Components](#react-components)
4. [Error Handling](#error-handling)
5. [Loading States](#loading-states)
6. [Retry Logic](#retry-logic)
7. [Testing](#testing)

## JavaScript/TypeScript

### Basic Usage

```typescript
// types.ts
export interface PublishStoreRequest {
  confirmPublish?: boolean;
  notifyCustomers?: boolean;
}

export interface PublishStoreResponse {
  success: true;
  message: string;
  storeUrl: string;
  publishedAt: string;
  correlationId: string;
}

export interface PublishStoreError {
  error: string;
  details?: string;
  correlationId: string;
}

export interface GatingError {
  error: 'PRECONDITION_REQUIRED';
  message: string;
  missingStep: string;
  action: {
    type: 'open_modal' | 'redirect';
    modal?: string;
    url?: string;
    prefill?: Record<string, any>;
  };
  correlationId: string;
}

// api.ts
export async function publishStore(
  token: string,
  options?: PublishStoreRequest
): Promise<PublishStoreResponse> {
  const response = await fetch('/api/store/publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new PublishError(error);
  }

  return response.json();
}

// Custom error class
export class PublishError extends Error {
  constructor(
    public data: PublishStoreError | GatingError,
    public status: number
  ) {
    super(data.error);
    this.name = 'PublishError';
  }

  isGatingError(): this is { data: GatingError } {
    return this.data.error === 'PRECONDITION_REQUIRED';
  }
}

// Usage
try {
  const result = await publishStore(userToken, {
    confirmPublish: true,
    notifyCustomers: false,
  });
  
  console.log('Store published:', result.storeUrl);
  console.log('Published at:', result.publishedAt);
} catch (error) {
  if (error instanceof PublishError) {
    if (error.isGatingError()) {
      // Handle gating error
      console.log('Missing step:', error.data.missingStep);
      console.log('Action:', error.data.action);
    } else {
      // Handle other errors
      console.error('Failed to publish:', error.data.details);
    }
  }
}
```

### With Retry Logic

```typescript
// api-with-retry.ts
async function publishStoreWithRetry(
  token: string,
  options?: PublishStoreRequest,
  retryOptions?: {
    maxAttempts?: number;
    initialDelay?: number;
    backoffFactor?: number;
  }
): Promise<PublishStoreResponse> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffFactor = 2,
  } = retryOptions || {};

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await publishStore(token, options);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof PublishError && error.status < 500) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}

// Usage
try {
  const result = await publishStoreWithRetry(
    userToken,
    { confirmPublish: true },
    { maxAttempts: 3, initialDelay: 1000 }
  );
  
  console.log('Store published:', result.storeUrl);
} catch (error) {
  console.error('Failed after retries:', error);
}
```

## React Hooks

### Basic Hook

```typescript
// usePublishStore.ts
import { useState } from 'react';
import { publishStore, PublishError } from './api';

interface UsePublishStoreOptions {
  onSuccess?: (data: PublishStoreResponse) => void;
  onError?: (error: PublishError) => void;
  onGatingError?: (error: GatingError) => void;
}

export function usePublishStore(options?: UsePublishStoreOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PublishError | null>(null);
  const [data, setData] = useState<PublishStoreResponse | null>(null);

  const publish = async (publishOptions?: PublishStoreRequest) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken(); // Your auth token getter
      const result = await publishStore(token, publishOptions);
      
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as PublishError;
      setError(error);
      
      if (error.isGatingError()) {
        options?.onGatingError?.(error.data);
      } else {
        options?.onError?.(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return { publish, loading, error, data, reset };
}
```

### Advanced Hook with Retry

```typescript
// usePublishStoreWithRetry.ts
import { useState, useCallback } from 'react';
import { publishStoreWithRetry, PublishError } from './api';

export function usePublishStoreWithRetry(options?: UsePublishStoreOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PublishError | null>(null);
  const [data, setData] = useState<PublishStoreResponse | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const publish = useCallback(async (
    publishOptions?: PublishStoreRequest,
    retryOptions?: { maxAttempts?: number }
  ) => {
    setLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const token = getAuthToken();
      const result = await publishStoreWithRetry(
        token,
        publishOptions,
        {
          ...retryOptions,
          onRetry: (attempt) => setRetryCount(attempt),
        }
      );
      
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as PublishError;
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return { publish, loading, error, data, retryCount };
}
```

## React Components

### Simple Button Component

```typescript
// PublishButton.tsx
import { usePublishStore } from './usePublishStore';
import { toast } from 'react-hot-toast';

export function PublishButton() {
  const { publish, loading, error } = usePublishStore({
    onSuccess: (data) => {
      toast.success(`Store published: ${data.storeUrl}`);
    },
    onError: (error) => {
      toast.error(`Failed to publish: ${error.message}`);
    },
    onGatingError: (error) => {
      // Open modal or redirect
      if (error.action.type === 'open_modal') {
        openModal(error.action.modal!, error.action.prefill);
      } else {
        window.location.href = error.action.url!;
      }
    },
  });

  return (
    <button
      onClick={() => publish({ confirmPublish: true })}
      disabled={loading}
      className="btn btn-primary"
    >
      {loading ? 'Publishing...' : 'Publish Store'}
    </button>
  );
}
```

### Advanced Component with Confirmation

```typescript
// PublishStoreModal.tsx
import { useState } from 'react';
import { usePublishStore } from './usePublishStore';
import { Modal } from './Modal';
import { toast } from 'react-hot-toast';

interface PublishStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublishStoreModal({ isOpen, onClose }: PublishStoreModalProps) {
  const [notifyCustomers, setNotifyCustomers] = useState(false);
  const { publish, loading, error } = usePublishStore({
    onSuccess: (data) => {
      toast.success('Store published successfully!');
      onClose();
    },
    onGatingError: (error) => {
      toast.error(error.message);
      // Handle gating error
      if (error.action.type === 'open_modal') {
        openModal(error.action.modal!, error.action.prefill);
      }
    },
  });

  const handlePublish = async () => {
    try {
      await publish({
        confirmPublish: true,
        notifyCustomers,
      });
    } catch (err) {
      // Error already handled by hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Publish Your Store</h2>
        
        <p className="text-gray-600 mb-4">
          Your store will be made publicly accessible. Are you sure you want to continue?
        </p>

        <label className="flex items-center mb-6">
          <input
            type="checkbox"
            checked={notifyCustomers}
            onChange={(e) => setNotifyCustomers(e.target.checked)}
            className="mr-2"
          />
          <span>Notify customers via email</span>
        </label>

        {error && !error.isGatingError() && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-700 text-sm">
              {error.data.details || error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Publishing...' : 'Publish Store'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### Component with Gating Flow

```typescript
// PublishWithGating.tsx
import { useState } from 'react';
import { usePublishStore } from './usePublishStore';
import { PaymentsSetupModal } from './PaymentsSetupModal';

export function PublishWithGating() {
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [gatingPrefill, setGatingPrefill] = useState<Record<string, any>>({});

  const { publish, loading } = usePublishStore({
    onSuccess: (data) => {
      toast.success(`Store published: ${data.storeUrl}`);
    },
    onGatingError: (error) => {
      if (error.missingStep === 'payments') {
        setGatingPrefill(error.action.prefill || {});
        setShowPaymentsModal(true);
      }
    },
  });

  const handlePaymentsComplete = () => {
    setShowPaymentsModal(false);
    // Retry publish after completing payments
    publish({ confirmPublish: true });
  };

  return (
    <>
      <button
        onClick={() => publish({ confirmPublish: true })}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Publishing...' : 'Publish Store'}
      </button>

      <PaymentsSetupModal
        isOpen={showPaymentsModal}
        onClose={() => setShowPaymentsModal(false)}
        onComplete={handlePaymentsComplete}
        prefill={gatingPrefill}
      />
    </>
  );
}
```

## Error Handling

### Comprehensive Error Handler

```typescript
// errorHandler.ts
export function handlePublishError(error: PublishError) {
  if (error.isGatingError()) {
    // Handle gating error
    const { missingStep, action, message } = error.data;
    
    toast.error(message);
    
    if (action.type === 'open_modal') {
      openModal(action.modal!, action.prefill);
    } else if (action.type === 'redirect') {
      window.location.href = action.url!;
    }
    
    // Track analytics
    trackEvent('publish_gating_blocked', {
      missingStep,
      correlationId: error.data.correlationId,
    });
  } else {
    // Handle other errors
    const { error: errorType, details, correlationId } = error.data;
    
    switch (errorType) {
      case 'Unauthorized':
        toast.error('Please log in to continue');
        redirectToLogin();
        break;
        
      case 'Store not found':
        toast.error('Store not found. Please contact support.');
        break;
        
      case 'Store already published':
        toast.info('Your store is already published');
        break;
        
      default:
        toast.error(details || 'Failed to publish store. Please try again.');
        
        // Log error for debugging
        console.error('Publish error:', {
          errorType,
          details,
          correlationId,
        });
    }
  }
}
```

## Loading States

### Loading Component

```typescript
// PublishLoadingState.tsx
interface PublishLoadingStateProps {
  loading: boolean;
  retryCount?: number;
}

export function PublishLoadingState({ loading, retryCount }: PublishLoadingStateProps) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <h3 className="text-lg font-semibold">Publishing Store...</h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-2">
          Please wait while we publish your store.
        </p>
        
        {retryCount && retryCount > 0 && (
          <p className="text-gray-500 text-xs">
            Retry attempt {retryCount}...
          </p>
        )}
      </div>
    </div>
  );
}
```

## Retry Logic

### Client-Side Retry

```typescript
// retryPublish.ts
export async function retryPublish(
  token: string,
  options?: PublishStoreRequest,
  onRetry?: (attempt: number) => void
): Promise<PublishStoreResponse> {
  const maxAttempts = 3;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await publishStore(token, options);
    } catch (error) {
      if (error instanceof PublishError) {
        // Don't retry on client errors
        if (error.status < 500) {
          throw error;
        }
      }
      
      if (attempt === maxAttempts) {
        throw error;
      }

      onRetry?.(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error('Max retries exceeded');
}
```

## Testing

### Unit Tests

```typescript
// publishStore.test.ts
import { describe, it, expect, vi } from 'vitest';
import { publishStore, PublishError } from './api';

describe('publishStore', () => {
  it('should publish store successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Store published',
        storeUrl: 'https://test.huntaze.com',
        publishedAt: '2024-11-11T10:00:00Z',
        correlationId: 'test-id',
      }),
    });

    const result = await publishStore('token', { confirmPublish: true });

    expect(result.success).toBe(true);
    expect(result.storeUrl).toBe('https://test.huntaze.com');
  });

  it('should throw PublishError on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Internal server error',
        correlationId: 'test-id',
      }),
    });

    await expect(
      publishStore('token', { confirmPublish: true })
    ).rejects.toThrow(PublishError);
  });

  it('should handle gating error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'PRECONDITION_REQUIRED',
        message: 'Payment required',
        missingStep: 'payments',
        action: { type: 'open_modal', modal: 'payments_setup' },
        correlationId: 'test-id',
      }),
    });

    try {
      await publishStore('token', { confirmPublish: true });
    } catch (error) {
      expect(error).toBeInstanceOf(PublishError);
      expect((error as PublishError).isGatingError()).toBe(true);
    }
  });
});
```

### React Hook Tests

```typescript
// usePublishStore.test.tsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePublishStore } from './usePublishStore';

describe('usePublishStore', () => {
  it('should publish store successfully', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => usePublishStore({ onSuccess }));

    await act(async () => {
      await result.current.publish({ confirmPublish: true });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeDefined();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => usePublishStore({ onError }));

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await act(async () => {
      try {
        await result.current.publish({ confirmPublish: true });
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(onError).toHaveBeenCalled();
  });
});
```

## Related Documentation

- [API Endpoint Documentation](./store-publish-endpoint.md)
- [Retry Strategies](./retry-strategies.md)
- [Integration Tests](../../tests/integration/api/README.md)

---

**Last Updated**: 2024-11-11

**Version**: 1.0.0
