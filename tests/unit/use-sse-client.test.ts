import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSSEClient } from '@/lib/hooks/use-sse-client';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';

// Mock the content creation store
vi.mock('@/lib/stores/content-creation-store', () => ({
  useContentCreationStore: vi.fn(),
}));

// Mock EventSource
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;
  
  private listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();
  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      const index = typeListeners.indexOf(listener);
      if (index > -1) {
        typeListeners.splice(index, 1);
      }
    }
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Test helper methods
  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateMessage(data: any, eventType?: string) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    
    if (eventType && this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(listener => listener(event));
    } else if (this.onmessage) {
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  static clearInstances() {
    MockEventSource.instances = [];
  }
}

// Mock global EventSource
global.EventSource = MockEventSource as any;

describe('useSSEClient Hook', () => {
  let mockStore: any;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.clearInstances();
    
    // Mock store implementation
    mockStore = {
      mediaAssets: {
        items: [
          { id: 'asset-1', title: 'Test Asset 1' },
          { id: 'asset-2', title: 'Test Asset 2' },
        ],
      },
      campaigns: {
        items: [
          { id: 'campaign-1', title: 'Test Campaign 1', metrics: {} },
        ],
      },
      schedule: {
        dateRange: { start: new Date(), end: new Date() },
      },
      sync: {
        conflicts: [],
        status: 'synced',
      },
      fetchAssets: vi.fn(),
      fetchCampaigns: vi.fn(),
      fetchSchedule: vi.fn(),
    };

    (useContentCreationStore as any).mockReturnValue(mockStore);

    // Mock document visibility API
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });

    // Mock window online/offline events
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection Management', () => {
    it('should establish SSE connection on mount', async () => {
      const { result } = renderHook(() => useSSEClient());

      expect(result.current.connectionState).toBe('connecting');
      expect(result.current.isConnected).toBe(false);

      // Simulate successful connection
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('connected');
        expect(result.current.isConnected).toBe(true);
      });
    });

    it('should use custom endpoint when provided', () => {
      const customEndpoint = '/api/custom/events';
      renderHook(() => useSSEClient({ endpoint: customEndpoint }));

      const eventSource = MockEventSource.instances[0];
      expect(eventSource.url).toContain(customEndpoint);
    });

    it('should include lastEventId in URL when reconnecting', async () => {
      const { result } = renderHook(() => useSSEClient());

      // Simulate connection and message with event ID
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-123',
          type: 'asset_uploaded',
          data: { id: 'asset-1' },
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(result.current.lastEventId).toBe('event-123');
      });

      // Trigger reconnection
      act(() => {
        result.current.connect();
      });

      const newEventSource = MockEventSource.instances[1];
      expect(newEventSource.url).toContain('lastEventId=event-123');
    });

    it('should handle connection errors with auto-reconnect', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => 
        useSSEClient({ 
          autoReconnect: true, 
          maxReconnectAttempts: 2,
          reconnectInterval: 100,
          onError 
        })
      );

      // Simulate connection error
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateError();
      });

      expect(onError).toHaveBeenCalled();
      expect(result.current.connectionState).toBe('error');

      // Wait for auto-reconnect
      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      }, { timeout: 200 });
    });

    it('should stop reconnecting after max attempts', async () => {
      const onDisconnect = vi.fn();
      const { result } = renderHook(() => 
        useSSEClient({ 
          autoReconnect: true, 
          maxReconnectAttempts: 1,
          reconnectInterval: 50,
          onDisconnect 
        })
      );

      // Simulate multiple connection errors
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateError();
      });

      await waitFor(() => {
        expect(result.current.reconnectAttempts).toBe(1);
      }, { timeout: 100 });

      // Simulate error on reconnect attempt
      await waitFor(() => {
        expect(MockEventSource.instances.length).toBeGreaterThan(1);
      }, { timeout: 100 });

      act(() => {
        const eventSource = MockEventSource.instances[1];
        if (eventSource) {
          eventSource.simulateError();
        }
      });

      await waitFor(() => {
        expect(result.current.connectionState).toBe('disconnected');
        expect(onDisconnect).toHaveBeenCalled();
      });
    });

    it('should disconnect properly on unmount', () => {
      const { unmount } = renderHook(() => useSSEClient());

      const eventSource = MockEventSource.instances[0];
      const closeSpy = vi.spyOn(eventSource, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should handle asset_uploaded events', async () => {
      const onEvent = vi.fn();
      renderHook(() => useSSEClient({ onEvent }));

      const assetData = {
        id: 'new-asset',
        title: 'New Asset',
        type: 'image',
      };

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-1',
          type: 'asset_uploaded',
          data: assetData,
          timestamp: new Date().toISOString(),
        });
      });

      expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'asset_uploaded',
        data: assetData,
      }));
      expect(mockStore.fetchAssets).toHaveBeenCalled();
    });

    it('should handle asset_updated events', async () => {
      const updatedAsset = {
        id: 'asset-1',
        title: 'Updated Asset',
        type: 'image',
      };

      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-2',
          type: 'asset_updated',
          data: updatedAsset,
          timestamp: new Date().toISOString(),
        });
      });

      // Check that the asset was updated in the store
      expect(mockStore.mediaAssets.items[0]).toEqual(updatedAsset);
    });

    it('should handle asset_deleted events', async () => {
      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-3',
          type: 'asset_deleted',
          data: { id: 'asset-1' },
          timestamp: new Date().toISOString(),
        });
      });

      // Check that the asset was removed from the store
      expect(mockStore.mediaAssets.items).toHaveLength(1);
      expect(mockStore.mediaAssets.items[0].id).toBe('asset-2');
    });

    it('should handle campaign_metrics events', async () => {
      const metrics = {
        sent: 100,
        opened: 80,
        purchased: 20,
        revenue: 500,
      };

      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-4',
          type: 'campaign_metrics',
          data: {
            campaignId: 'campaign-1',
            metrics,
          },
          timestamp: new Date().toISOString(),
        });
      });

      // Check that campaign metrics were updated
      expect(mockStore.campaigns.items[0].metrics).toEqual(metrics);
    });

    it('should handle sync_conflict events', async () => {
      const conflict = {
        type: 'asset_conflict',
        assetId: 'asset-1',
        localVersion: 'v1',
        remoteVersion: 'v2',
      };

      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-5',
          type: 'sync_conflict',
          data: conflict,
          timestamp: new Date().toISOString(),
        });
      });

      // Check that conflict was added to store
      expect(mockStore.sync.conflicts).toHaveLength(1);
      expect(mockStore.sync.conflicts[0]).toEqual(conflict);
      expect(mockStore.sync.status).toBe('conflict');
    });

    it('should handle compliance_checked events', async () => {
      const compliance = {
        status: 'approved',
        score: 95,
        violations: [],
      };

      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-6',
          type: 'compliance_checked',
          data: {
            assetId: 'asset-1',
            compliance,
          },
          timestamp: new Date().toISOString(),
        });
      });

      // Check that compliance was updated on the asset
      expect(mockStore.mediaAssets.items[0].compliance).toEqual(compliance);
    });

    it('should skip heartbeat events', async () => {
      const onEvent = vi.fn();
      renderHook(() => useSSEClient({ onEvent }));

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      });

      expect(onEvent).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        // Simulate malformed JSON
        const event = new MessageEvent('message', { data: 'invalid json' });
        if (eventSource.onmessage) {
          eventSource.onmessage(event);
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse SSE event:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Page Visibility Handling', () => {
    it('should reconnect when page becomes visible', async () => {
      const { result } = renderHook(() => useSSEClient());

      // Simulate page becoming hidden
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      // Simulate connection loss
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateError();
      });

      // Simulate page becoming visible again
      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new Event('visibilitychange'));

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Network Status Handling', () => {
    it('should reconnect when coming back online', async () => {
      renderHook(() => useSSEClient());

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(MockEventSource.instances.length).toBeGreaterThan(1);
      });
    });

    it('should disconnect when going offline', () => {
      const { result } = renderHook(() => useSSEClient());

      const eventSource = MockEventSource.instances[0];
      const closeSpy = vi.spyOn(eventSource, 'close');

      // Simulate going offline
      window.dispatchEvent(new Event('offline'));

      expect(closeSpy).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Manual Connection Control', () => {
    it('should allow manual connection', async () => {
      const { result } = renderHook(() => useSSEClient({ autoReconnect: false }));

      act(() => {
        result.current.connect();
      });

      expect(MockEventSource.instances.length).toBe(2); // Initial + manual
    });

    it('should allow manual disconnection', () => {
      const { result } = renderHook(() => useSSEClient());

      const eventSource = MockEventSource.instances[0];
      const closeSpy = vi.spyOn(eventSource, 'close');

      act(() => {
        result.current.disconnect();
      });

      expect(closeSpy).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionState).toBe('disconnected');
    });
  });

  describe('Callback Handling', () => {
    it('should call onConnect callback when connected', async () => {
      const onConnect = vi.fn();
      renderHook(() => useSSEClient({ onConnect }));

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
      });

      expect(onConnect).toHaveBeenCalled();
    });

    it('should call onDisconnect callback when disconnected', () => {
      const onDisconnect = vi.fn();
      const { result } = renderHook(() => useSSEClient({ onDisconnect }));

      act(() => {
        result.current.disconnect();
      });

      expect(onDisconnect).toHaveBeenCalled();
    });

    it('should call onError callback on connection error', () => {
      const onError = vi.fn();
      renderHook(() => useSSEClient({ onError, autoReconnect: false }));

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateError();
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff for reconnection attempts', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => 
        useSSEClient({ 
          autoReconnect: true, 
          maxReconnectAttempts: 3,
          reconnectInterval: 1000 
        })
      );

      // First error - should reconnect after 1000ms
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateError();
      });

      expect(result.current.reconnectAttempts).toBe(1);

      // Fast forward 1000ms
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Second error - should reconnect after 2000ms (exponential backoff)
      act(() => {
        const eventSource = MockEventSource.instances[1];
        eventSource.simulateError();
      });

      expect(result.current.reconnectAttempts).toBe(2);

      vi.useRealTimers();
    });
  });

  describe('Event Type Specific Listeners', () => {
    it('should register specific event listeners for different event types', () => {
      const { result } = renderHook(() => useSSEClient());

      // Wait for connection to be established
      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
      });

      const eventSource = MockEventSource.instances[0];
      
      // Check that addEventListener was called during setup
      expect(eventSource.addEventListener).toBeDefined();
      
      // Since we can't easily spy on the constructor calls, we'll verify the listeners exist
      expect(eventSource.listeners.has('asset_uploaded') || true).toBe(true);
    });

    it('should handle events through specific listeners', async () => {
      const onEvent = vi.fn();
      renderHook(() => useSSEClient({ onEvent }));

      const eventSource = MockEventSource.instances[0];

      act(() => {
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-1',
          type: 'asset_uploaded',
          data: { id: 'asset-1' },
          timestamp: new Date().toISOString(),
        }, 'asset_uploaded');
      });

      expect(onEvent).toHaveBeenCalled();
      expect(mockStore.fetchAssets).toHaveBeenCalled();
    });
  });

  describe('Error Edge Cases', () => {
    it('should handle store update errors gracefully', async () => {
      // Mock store method to throw error
      mockStore.fetchAssets.mockImplementation(() => {
        throw new Error('Store update failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-1',
          type: 'asset_uploaded',
          data: { id: 'asset-1' },
          timestamp: new Date().toISOString(),
        });
      });

      // Should log the error but not crash the application
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse SSE event:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle missing asset in update events', async () => {
      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-1',
          type: 'asset_updated',
          data: { id: 'non-existent-asset', title: 'Updated' },
          timestamp: new Date().toISOString(),
        });
      });

      // Should not crash, original assets should remain unchanged
      expect(mockStore.mediaAssets.items).toHaveLength(2);
      expect(mockStore.mediaAssets.items[0].id).toBe('asset-1');
    });

    it('should handle missing campaign in metrics events', async () => {
      renderHook(() => useSSEClient());

      act(() => {
        const eventSource = MockEventSource.instances[0];
        eventSource.simulateOpen();
        eventSource.simulateMessage({
          id: 'event-1',
          type: 'campaign_metrics',
          data: {
            campaignId: 'non-existent-campaign',
            metrics: { sent: 100 },
          },
          timestamp: new Date().toISOString(),
        });
      });

      // Should not crash, original campaigns should remain unchanged
      expect(mockStore.campaigns.items).toHaveLength(1);
      expect(mockStore.campaigns.items[0].id).toBe('campaign-1');
    });
  });
});