import { vi } from 'vitest';

// Mock state for SSE client
let mockSSEState = {
  isConnected: false,
  connectionState: 'disconnected' as 'connecting' | 'connected' | 'disconnected' | 'error',
  lastEventId: null as string | null,
  reconnectAttempts: 0
};

export const resetMockSSEState = () => {
  mockSSEState = {
    isConnected: false,
    connectionState: 'disconnected',
    lastEventId: null,
    reconnectAttempts: 0
  };
};

export const setMockSSEState = (state: Partial<typeof mockSSEState>) => {
  Object.assign(mockSSEState, state);
};

export const useSSEClient = vi.fn((options: any = {}) => ({
  // State properties
  isConnected: mockSSEState.isConnected,
  connectionState: mockSSEState.connectionState,
  lastEventId: mockSSEState.lastEventId,
  reconnectAttempts: mockSSEState.reconnectAttempts,

  // Functions
  connect: vi.fn(() => {
    mockSSEState.connectionState = 'connecting';
    setTimeout(() => {
      mockSSEState.isConnected = true;
      mockSSEState.connectionState = 'connected';
      mockSSEState.reconnectAttempts = 0;
      options.onConnect?.();
    }, 10);
  }),

  disconnect: vi.fn(() => {
    mockSSEState.isConnected = false;
    mockSSEState.connectionState = 'disconnected';
    options.onDisconnect?.();
  })
}));