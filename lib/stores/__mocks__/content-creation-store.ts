import { vi } from 'vitest';

export const useContentCreationStore = vi.fn(() => ({
  // Initial state
  mediaAssets: {
    items: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0 }
  },
  
  campaigns: {
    items: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0 }
  },
  
  schedule: {
    items: [],
    loading: false,
    error: null,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-07')
    }
  },
  
  sync: {
    status: 'synced' as const,
    conflicts: [],
    lastSyncAt: new Date()
  },

  // Actions
  fetchAssets: vi.fn(),
  fetchCampaigns: vi.fn(),
  fetchSchedule: vi.fn(),
  
  // Asset operations
  addAsset: vi.fn((asset: any) => {
    // Simuler l'ajout à la liste en modifiant l'état
    const store = useContentCreationStore();
    store.mediaAssets.items.push(asset);
  }),
  updateAsset: vi.fn(),
  deleteAsset: vi.fn(),
  
  // Campaign operations
  addCampaign: vi.fn((campaign: any) => {
    // Simuler l'ajout à la liste
  }),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  
  // Conflict resolution
  addConflict: vi.fn(),
  resolveConflict: vi.fn(),
  clearConflicts: vi.fn(),
  
  // Optimistic updates
  revertOptimisticUpdate: vi.fn()
}));