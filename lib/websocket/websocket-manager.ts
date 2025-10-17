import { EventEmitter } from 'events';
import { RealtimeClient, RealtimeNotificationServer } from './realtime-server';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: Date;
}

/**
 * WebSocketManager - Singleton wrapper around existing WebSocket infrastructure
 * Provides unified interface for analytics and other systems
 */
export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private client?: RealtimeClient;
  private server?: RealtimeNotificationServer;
  private isServerMode: boolean = false;
  
  private constructor() {
    super();
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Initialize as client (for frontend/analytics)
   */
  async initializeClient(url: string, token: string): Promise<void> {
    if (this.client) {
      console.warn('WebSocket client already initialized');
      return;
    }

    this.client = new RealtimeClient(url, token);
    await this.client.connect();

    // Forward all messages to EventEmitter
    this.client.on('*', (message: any) => {
      this.emit('message', message);
    });
  }

  /**
   * Initialize as server (for backend)
   */
  initializeServer(port: number = 8080): RealtimeNotificationServer {
    if (this.server) {
      console.warn('WebSocket server already initialized');
      return this.server;
    }

    this.isServerMode = true;
    this.server = new RealtimeNotificationServer(port);
    return this.server;
  }

  /**
   * Send message to specific connection (server mode only)
   */
  async sendToConnection(connectionId: string, message: WebSocketMessage): Promise<void> {
    if (!this.isServerMode || !this.server) {
      throw new Error('WebSocketManager not in server mode');
    }

    // Map connectionId to userId for compatibility
    this.server.sendToUser(connectionId, {
      type: message.type as any,
      data: message.data,
      timestamp: message.timestamp || new Date(),
      priority: 'medium'
    });
  }

  /**
   * Broadcast message to all connected clients (server mode only)
   */
  async broadcast(message: WebSocketMessage): Promise<void> {
    if (!this.isServerMode || !this.server) {
      // If in client mode, just emit locally
      this.emit('broadcast', message);
      return;
    }

    this.server.broadcast({
      type: message.type as any,
      data: message.data,
      timestamp: message.timestamp || new Date(),
      priority: 'medium'
    });
  }

  /**
   * Send message (client mode only)
   */
  send(message: WebSocketMessage): void {
    if (!this.client) {
      throw new Error('WebSocket client not initialized');
    }

    this.client.send(message);
  }

  /**
   * Subscribe to specific event type
   */
  subscribe(eventType: string, callback: (data: any) => void): void {
    if (this.client) {
      this.client.on(eventType, callback);
    } else {
      this.on(eventType, callback);
    }
  }

  /**
   * Unsubscribe from event type
   */
  unsubscribe(eventType: string, callback: (data: any) => void): void {
    if (this.client) {
      this.client.off(eventType, callback);
    } else {
      this.off(eventType, callback);
    }
  }

  /**
   * Get server instance (for advanced usage)
   */
  getServer(): RealtimeNotificationServer | undefined {
    return this.server;
  }

  /**
   * Get client instance (for advanced usage)
   */
  getClient(): RealtimeClient | undefined {
    return this.client;
  }

  /**
   * Cleanup
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = undefined;
    }
    // Server cleanup would be handled differently
  }
}

// Export singleton instance
export const wsManager = WebSocketManager.getInstance();