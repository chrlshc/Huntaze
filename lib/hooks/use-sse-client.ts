import { useEffect, useRef, useCallback, useState } from 'react';
import { useContentCreationStore } from '@/lib/stores/content-creation-store';
import { ContentCreationEvent } from '@/app/api/content-creation/events/route';

interface SSEClientOptions {
    endpoint?: string;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
    onEvent?: (event: ContentCreationEvent) => void;
}

export function useSSEClient(options: SSEClientOptions = {}) {
    const {
        endpoint = '/api/content-creation/events',
        autoReconnect = true,
        maxReconnectAttempts = 5,
        reconnectInterval = 5000,
        onConnect,
        onDisconnect,
        onError,
        onEvent,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [lastEventId, setLastEventId] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const store = useContentCreationStore();

    // Handle incoming events
    const handleEvent = useCallback((event: ContentCreationEvent) => {
        setLastEventId(event.id);
        onEvent?.(event);

        // Update store based on event type
        switch (event.type) {
            case 'asset_uploaded':
            case 'asset_processed':
                // Refresh assets list
                store.fetchAssets();
                break;

            case 'asset_updated':
                // Update specific asset in store
                const updatedAsset = event.data;
                const assetIndex = store.mediaAssets.items.findIndex((item: any) => item.id === updatedAsset.id);
                if (assetIndex !== -1) {
                    store.mediaAssets.items[assetIndex] = updatedAsset;
                }
                break;

            case 'asset_deleted':
                // Remove asset from store
                const deletedAssetId = event.data.id;
                store.mediaAssets.items = store.mediaAssets.items.filter((item: any) => item.id !== deletedAssetId);
                break;

            case 'schedule_updated':
                // Refresh schedule
                const { start, end } = store.schedule.dateRange;
                store.fetchSchedule(start, end);
                break;

            case 'campaign_created':
            case 'campaign_updated':
                // Refresh campaigns
                store.fetchCampaigns();
                break;

            case 'campaign_metrics':
                // Update campaign metrics
                const { campaignId, metrics } = event.data;
                const campaignIndex = store.campaigns.items.findIndex((item: any) => item.id === campaignId);
                if (campaignIndex !== -1) {
                    store.campaigns.items[campaignIndex].metrics = metrics;
                }
                break;

            case 'compliance_checked':
                // Update asset compliance status
                const { assetId, compliance } = event.data;
                const complianceAssetIndex = store.mediaAssets.items.findIndex((item: any) => item.id === assetId);
                if (complianceAssetIndex !== -1) {
                    store.mediaAssets.items[complianceAssetIndex].compliance = compliance;
                }
                break;

            case 'ai_insight':
            case 'ai_recommendation':
                // These would be handled by AI assistant store when implemented
                console.log('AI event received:', event);
                break;

            case 'sync_conflict':
                // Add conflict to sync state
                store.sync.conflicts.push(event.data);
                store.sync.status = 'conflict';
                break;
        }
    }, [store, onEvent]);

    // Connect to SSE
    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setConnectionState('connecting');

        const url = new URL(endpoint, window.location.origin);
        if (lastEventId) {
            url.searchParams.set('lastEventId', lastEventId);
        }

        const eventSource = new EventSource(url.toString());
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setConnectionState('connected');
            reconnectAttemptsRef.current = 0;
            onConnect?.();
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Skip heartbeat events
                if (data.type === 'heartbeat') {
                    return;
                }

                handleEvent(data);
            } catch (error) {
                console.error('Failed to parse SSE event:', error);
            }
        };

        eventSource.onerror = (error) => {
            setIsConnected(false);
            setConnectionState('error');
            onError?.(error);

            // Auto-reconnect logic
            if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectAttemptsRef.current++;

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1)); // Exponential backoff
            } else {
                setConnectionState('disconnected');
                onDisconnect?.();
            }
        };

        // Handle specific event types
        eventSource.addEventListener('asset_uploaded', (event) => {
            const data = JSON.parse((event as MessageEvent).data);
            handleEvent(data);
        });

        eventSource.addEventListener('asset_processed', (event) => {
            const data = JSON.parse((event as MessageEvent).data);
            handleEvent(data);
        });

        eventSource.addEventListener('campaign_metrics', (event) => {
            const data = JSON.parse((event as MessageEvent).data);
            handleEvent(data);
        });

        eventSource.addEventListener('sync_conflict', (event) => {
            const data = JSON.parse((event as MessageEvent).data);
            handleEvent(data);
        });

    }, [endpoint, lastEventId, autoReconnect, maxReconnectAttempts, reconnectInterval, onConnect, onError, onDisconnect, handleEvent]);

    // Disconnect from SSE
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setIsConnected(false);
        setConnectionState('disconnected');
        onDisconnect?.();
    }, [onDisconnect]);

    // Auto-connect on mount
    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    // Handle page visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page is hidden, keep connection but reduce activity
            } else {
                // Page is visible, ensure connection is active
                if (!isConnected && autoReconnect) {
                    connect();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isConnected, autoReconnect, connect]);

    // Handle online/offline events
    useEffect(() => {
        const handleOnline = () => {
            if (!isConnected && autoReconnect) {
                reconnectAttemptsRef.current = 0; // Reset attempts on network recovery
                connect();
            }
        };

        const handleOffline = () => {
            disconnect();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isConnected, autoReconnect, connect, disconnect]);

    return {
        isConnected,
        connectionState,
        lastEventId,
        connect,
        disconnect,
        reconnectAttempts: reconnectAttemptsRef.current,
    };
}