import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { MediaAsset, PPVCampaign, ScheduleEntry, SyncState, ConflictDetails } from '@/src/lib/api/schemas';
import { apiClient } from '@/lib/api';
import { offlineQueue } from '@/lib/offline-queue';

interface FilterOptions {
  type?: 'photo' | 'video' | 'story' | 'ppv';
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'revenue';
  sortOrder?: 'asc' | 'desc';
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ContentCreationState {
  // Media Assets
  mediaAssets: {
    items: MediaAsset[];
    loading: boolean;
    error: string | null;
    pagination: PaginationState;
    filters: FilterOptions;
    selectedAssets: string[];
    uploadProgress: Record<string, number>;
  };

  // Schedule
  schedule: {
    entries: ScheduleEntry[];
    loading: boolean;
    error: string | null;
    dateRange: {
      start: Date;
      end: Date;
    };
    aiSuggestions: Array<{
      date: Date;
      time: string;
      engagementPrediction: number;
      confidence: number;
      reason: string;
    }>;
  };

  // PPV Campaigns
  campaigns: {
    items: PPVCampaign[];
    loading: boolean;
    error: string | null;
    pagination: PaginationState;
    selectedCampaign: PPVCampaign | null;
    filters: {
      status?: 'active' | 'paused' | 'completed' | 'draft';
    };
  };

  // Sync State
  sync: {
    status: 'synced' | 'pending' | 'conflict' | 'offline';
    conflicts: ConflictDetails[];
    lastSync: Date | null;
    pendingOperations: number;
  };

  // UI State
  ui: {
    activeView: 'library' | 'calendar' | 'campaigns';
    sidebarOpen: boolean;
    modals: {
      uploadModal: boolean;
      campaignModal: boolean;
      scheduleModal: boolean;
    };
  };
}

interface ContentCreationActions {
  // Media Assets Actions
  fetchAssets: (filters?: FilterOptions, page?: number) => Promise<void>;
  createAsset: (data: Partial<MediaAsset>) => Promise<MediaAsset>;
  updateAsset: (id: string, data: Partial<MediaAsset>) => Promise<MediaAsset>;
  deleteAsset: (id: string) => Promise<void>;
  uploadAsset: (file: File, metadata: any, onProgress?: (progress: number) => void) => Promise<MediaAsset>;
  setAssetFilters: (filters: FilterOptions) => void;
  selectAssets: (assetIds: string[]) => void;
  clearSelection: () => void;

  // Schedule Actions
  fetchSchedule: (startDate: Date, endDate: Date) => Promise<void>;
  scheduleContent: (entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ScheduleEntry>;
  updateScheduleEntry: (id: string, data: Partial<ScheduleEntry>) => Promise<ScheduleEntry>;
  deleteScheduleEntry: (id: string) => Promise<void>;

  // Campaign Actions
  fetchCampaigns: (filters?: any, page?: number) => Promise<void>;
  createCampaign: (data: Partial<PPVCampaign>) => Promise<PPVCampaign>;
  updateCampaign: (id: string, data: Partial<PPVCampaign>) => Promise<PPVCampaign>;
  deleteCampaign: (id: string) => Promise<void>;
  launchCampaign: (id: string) => Promise<void>;
  pauseCampaign: (id: string) => Promise<void>;

  // Sync Actions
  syncData: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => Promise<void>;
  retryFailedOperations: () => Promise<void>;

  // UI Actions
  setActiveView: (view: 'library' | 'calendar' | 'campaigns') => void;
  toggleSidebar: () => void;
  openModal: (modal: keyof ContentCreationState['ui']['modals']) => void;
  closeModal: (modal: keyof ContentCreationState['ui']['modals']) => void;
  closeAllModals: () => void;

  // Optimistic Updates
  optimisticUpdateAsset: (id: string, data: Partial<MediaAsset>) => void;
  revertOptimisticUpdate: (id: string) => void;
}

type ContentCreationStore = ContentCreationState & ContentCreationActions;

export const useContentCreationStore = create<ContentCreationStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        mediaAssets: {
          items: [],
          loading: false,
          error: null,
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasNext: false,
            hasPrev: false,
          },
          filters: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          selectedAssets: [],
          uploadProgress: {},
        },

        schedule: {
          entries: [],
          loading: false,
          error: null,
          dateRange: {
            start: new Date(),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
          aiSuggestions: [],
        },

        campaigns: {
          items: [],
          loading: false,
          error: null,
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasNext: false,
            hasPrev: false,
          },
          selectedCampaign: null,
          filters: {},
        },

        sync: {
          status: 'synced',
          conflicts: [],
          lastSync: null,
          pendingOperations: 0,
        },

        ui: {
          activeView: 'library',
          sidebarOpen: true,
          modals: {
            uploadModal: false,
            campaignModal: false,
            scheduleModal: false,
          },
        },

        // Media Assets Actions
        fetchAssets: async (filters = {}, page = 1) => {
          set((state) => {
            state.mediaAssets.loading = true;
            state.mediaAssets.error = null;
            state.mediaAssets.filters = { ...state.mediaAssets.filters, ...filters };
          });

          try {
            const response = await apiClient.get('/api/content-creation/assets', {
              params: {
                page,
                limit: get().mediaAssets.pagination.limit,
                ...filters,
              },
            });

            set((state) => {
              state.mediaAssets.items = response.data.items;
              state.mediaAssets.pagination = response.data.pagination;
              state.mediaAssets.loading = false;
              state.sync.lastSync = new Date();
            });
          } catch (error: any) {
            set((state) => {
              state.mediaAssets.loading = false;
              state.mediaAssets.error = error.message || 'Failed to fetch assets';
              
              // If offline, queue the operation
              if (error.code === 'NETWORK_ERROR') {
                state.sync.status = 'offline';
                offlineQueue.enqueue({
                  type: 'GET',
                  url: '/api/content-creation/assets',
                  params: { page, ...filters },
                });
              }
            });
          }
        },

        createAsset: async (data) => {
          // Optimistic update
          const tempId = `temp-${Date.now()}`;
          const optimisticAsset: MediaAsset = {
            id: tempId,
            creatorId: 'current-user',
            title: data.title || 'New Asset',
            type: data.type || 'photo',
            status: 'draft',
            thumbnailUrl: '/placeholder-thumb.jpg',
            originalUrl: '/placeholder.jpg',
            fileSize: 0,
            dimensions: { width: 0, height: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
            metrics: { views: 0, engagement: 0, revenue: 0, roi: 0 },
            tags: data.tags || [],
            compliance: {
              status: 'pending',
              checkedAt: new Date(),
              violations: [],
              score: 0,
            },
            ...data,
          } as MediaAsset;

          set((state) => {
            state.mediaAssets.items.unshift(optimisticAsset);
            state.sync.status = 'pending';
            state.sync.pendingOperations += 1;
          });

          try {
            const response = await apiClient.post('/api/content-creation/assets', data);
            
            set((state) => {
              const index = state.mediaAssets.items.findIndex(item => item.id === tempId);
              if (index !== -1) {
                state.mediaAssets.items[index] = response.data;
              }
              state.sync.status = 'synced';
              state.sync.pendingOperations -= 1;
              state.sync.lastSync = new Date();
            });

            return response.data;
          } catch (error: any) {
            // Revert optimistic update
            set((state) => {
              state.mediaAssets.items = state.mediaAssets.items.filter(item => item.id !== tempId);
              state.sync.pendingOperations -= 1;
              
              if (error.code === 'NETWORK_ERROR') {
                state.sync.status = 'offline';
                offlineQueue.enqueue({
                  type: 'POST',
                  url: '/api/content-creation/assets',
                  data,
                });
              }
            });
            throw error;
          }
        },

        updateAsset: async (id, data) => {
          // Store original for rollback
          const originalAsset = get().mediaAssets.items.find(item => item.id === id);
          if (!originalAsset) throw new Error('Asset not found');

          // Optimistic update
          set((state) => {
            const index = state.mediaAssets.items.findIndex(item => item.id === id);
            if (index !== -1) {
              state.mediaAssets.items[index] = {
                ...state.mediaAssets.items[index],
                ...data,
                updatedAt: new Date(),
              };
            }
            state.sync.status = 'pending';
            state.sync.pendingOperations += 1;
          });

          try {
            const response = await apiClient.patch(`/api/content-creation/assets/${id}`, data);
            
            set((state) => {
              const index = state.mediaAssets.items.findIndex(item => item.id === id);
              if (index !== -1) {
                state.mediaAssets.items[index] = response.data;
              }
              state.sync.status = 'synced';
              state.sync.pendingOperations -= 1;
              state.sync.lastSync = new Date();
            });

            return response.data;
          } catch (error: any) {
            // Revert optimistic update
            set((state) => {
              const index = state.mediaAssets.items.findIndex(item => item.id === id);
              if (index !== -1) {
                state.mediaAssets.items[index] = originalAsset;
              }
              state.sync.pendingOperations -= 1;
              
              if (error.code === 'NETWORK_ERROR') {
                state.sync.status = 'offline';
                offlineQueue.enqueue({
                  type: 'PATCH',
                  url: `/api/content-creation/assets/${id}`,
                  data,
                });
              }
            });
            throw error;
          }
        },

        deleteAsset: async (id) => {
          const originalAsset = get().mediaAssets.items.find(item => item.id === id);
          if (!originalAsset) throw new Error('Asset not found');

          // Optimistic removal
          set((state) => {
            state.mediaAssets.items = state.mediaAssets.items.filter(item => item.id !== id);
            state.sync.status = 'pending';
            state.sync.pendingOperations += 1;
          });

          try {
            await apiClient.delete(`/api/content-creation/assets/${id}`);
            
            set((state) => {
              state.sync.status = 'synced';
              state.sync.pendingOperations -= 1;
              state.sync.lastSync = new Date();
            });
          } catch (error: any) {
            // Revert optimistic removal
            set((state) => {
              state.mediaAssets.items.push(originalAsset);
              state.sync.pendingOperations -= 1;
              
              if (error.code === 'NETWORK_ERROR') {
                state.sync.status = 'offline';
                offlineQueue.enqueue({
                  type: 'DELETE',
                  url: `/api/content-creation/assets/${id}`,
                });
              }
            });
            throw error;
          }
        },

        uploadAsset: async (file, metadata, onProgress) => {
          const uploadId = `upload-${Date.now()}`;
          
          set((state) => {
            state.mediaAssets.uploadProgress[uploadId] = 0;
          });

          try {
            const response = await apiClient.uploadFile(file, metadata, (progress) => {
              set((state) => {
                state.mediaAssets.uploadProgress[uploadId] = progress;
              });
              onProgress?.(progress);
            });

            set((state) => {
              delete state.mediaAssets.uploadProgress[uploadId];
              state.mediaAssets.items.unshift(response.data);
              state.sync.lastSync = new Date();
            });

            return response.data;
          } catch (error: any) {
            set((state) => {
              delete state.mediaAssets.uploadProgress[uploadId];
            });
            throw error;
          }
        },

        // Schedule Actions
        fetchSchedule: async (startDate, endDate) => {
          set((state) => {
            state.schedule.loading = true;
            state.schedule.error = null;
            state.schedule.dateRange = { start: startDate, end: endDate };
          });

          try {
            const response = await apiClient.get('/api/content-creation/schedule', {
              params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              },
            });

            set((state) => {
              state.schedule.entries = response.data.entries;
              state.schedule.aiSuggestions = response.data.aiSuggestions;
              state.schedule.loading = false;
              state.sync.lastSync = new Date();
            });
          } catch (error: any) {
            set((state) => {
              state.schedule.loading = false;
              state.schedule.error = error.message || 'Failed to fetch schedule';
            });
          }
        },

        scheduleContent: async (entry) => {
          try {
            const response = await apiClient.post('/api/content-creation/schedule', entry);
            
            set((state) => {
              state.schedule.entries.push(response.data);
              state.sync.lastSync = new Date();
            });

            return response.data;
          } catch (error: any) {
            throw error;
          }
        },

        // Campaign Actions
        fetchCampaigns: async (filters = {}, page = 1) => {
          set((state) => {
            state.campaigns.loading = true;
            state.campaigns.error = null;
            state.campaigns.filters = { ...state.campaigns.filters, ...filters };
          });

          try {
            const response = await apiClient.get('/api/content-creation/campaigns', {
              params: {
                page,
                limit: get().campaigns.pagination.limit,
                ...filters,
              },
            });

            set((state) => {
              state.campaigns.items = response.data.items;
              state.campaigns.pagination = response.data.pagination;
              state.campaigns.loading = false;
              state.sync.lastSync = new Date();
            });
          } catch (error: any) {
            set((state) => {
              state.campaigns.loading = false;
              state.campaigns.error = error.message || 'Failed to fetch campaigns';
            });
          }
        },

        createCampaign: async (data) => {
          try {
            const response = await apiClient.post('/api/content-creation/campaigns', data);
            
            set((state) => {
              state.campaigns.items.unshift(response.data);
              state.sync.lastSync = new Date();
            });

            return response.data;
          } catch (error: any) {
            throw error;
          }
        },

        // Utility Actions
        setAssetFilters: (filters) => {
          set((state) => {
            state.mediaAssets.filters = { ...state.mediaAssets.filters, ...filters };
          });
        },

        selectAssets: (assetIds) => {
          set((state) => {
            state.mediaAssets.selectedAssets = assetIds;
          });
        },

        clearSelection: () => {
          set((state) => {
            state.mediaAssets.selectedAssets = [];
          });
        },

        setActiveView: (view) => {
          set((state) => {
            state.ui.activeView = view;
          });
        },

        toggleSidebar: () => {
          set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          });
        },

        openModal: (modal) => {
          set((state) => {
            state.ui.modals[modal] = true;
          });
        },

        closeModal: (modal) => {
          set((state) => {
            state.ui.modals[modal] = false;
          });
        },

        closeAllModals: () => {
          set((state) => {
            Object.keys(state.ui.modals).forEach((key) => {
              state.ui.modals[key as keyof typeof state.ui.modals] = false;
            });
          });
        },

        // Optimistic Updates
        optimisticUpdateAsset: (id, data) => {
          set((state) => {
            const index = state.mediaAssets.items.findIndex(item => item.id === id);
            if (index !== -1) {
              state.mediaAssets.items[index] = {
                ...state.mediaAssets.items[index],
                ...data,
                updatedAt: new Date(),
              };
            }
          });
        },

        revertOptimisticUpdate: (id) => {
          // This would need to store original values to revert properly
          // For now, we'll refetch the asset
          get().fetchAssets();
        },

        // Sync Actions (placeholder implementations)
        syncData: async () => {
          // Implementation would sync all pending operations
          console.log('Syncing data...');
        },

        resolveConflict: async (conflictId, resolution) => {
          // Implementation would resolve conflicts based on resolution strategy
          console.log('Resolving conflict:', conflictId, resolution);
        },

        retryFailedOperations: async () => {
          // Implementation would retry failed operations from offline queue
          await offlineQueue.flush();
        },

        // Placeholder implementations for missing actions
        updateScheduleEntry: async (id, data) => {
          throw new Error('Not implemented');
        },
        deleteScheduleEntry: async (id) => {
          throw new Error('Not implemented');
        },
        updateCampaign: async (id, data) => {
          throw new Error('Not implemented');
        },
        deleteCampaign: async (id) => {
          throw new Error('Not implemented');
        },
        launchCampaign: async (id) => {
          throw new Error('Not implemented');
        },
        pauseCampaign: async (id) => {
          throw new Error('Not implemented');
        },
      }))
    ),
    {
      name: 'content-creation-store',
    }
  )
);

// Selectors for better performance
export const useMediaAssets = () => useContentCreationStore((state) => state.mediaAssets);
export const useSchedule = () => useContentCreationStore((state) => state.schedule);
export const useCampaigns = () => useContentCreationStore((state) => state.campaigns);
export const useSyncStatus = () => useContentCreationStore((state) => state.sync);
export const useContentCreationUI = () => useContentCreationStore((state) => state.ui);