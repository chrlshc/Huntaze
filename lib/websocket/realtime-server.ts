// Real-time WebSocket server for live notifications
// Handles fan online status, new messages, tips, etc.

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';

export interface RealtimeMessage {
  type: 'fan_online' | 'new_message' | 'new_tip' | 'subscription_expiring' | 'revenue_update' | 'content_performance';
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class RealtimeNotificationServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map(); // userId -> connections
  private server: any;

  constructor(port: number = 8080) {
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
    
    this.setupWebSocketServer();
    this.server.listen(port, () => {
      console.log(`🚀 Realtime server running on port ${port}`);
    });
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: WebSocket, request) => {
      const { query } = parse(request.url || '', true);
      const token = query.token as string;

      // Authenticate connection
      const userId = await this.authenticateConnection(token);
      if (!userId) {
        ws.send(JSON.stringify({ error: 'Unauthorized' }));
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Add to clients
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      console.log(`✅ User ${userId} connected`);

      // Send initial status
      ws.send(JSON.stringify({
        type: 'connected',
        data: { userId, timestamp: new Date() }
      }));

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(userId, data);
        } catch (error) {
          console.error('Invalid message:', error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        const userConnections = this.clients.get(userId);
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            this.clients.delete(userId);
          }
        }
        console.log(`👋 User ${userId} disconnected`);
      });

      // Keep alive
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(interval);
        }
      }, 30000);
    });
  }

  private async authenticateConnection(token: string): Promise<string | null> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded.userId;
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  }

  private handleClientMessage(userId: string, message: any) {
    // Handle client requests
    switch (message.type) {
      case 'subscribe':
        // Subscribe to specific events
        console.log(`User ${userId} subscribed to:`, message.events);
        break;
      
      case 'ping':
        // Respond to ping
        this.sendToUser(userId, { type: 'pong', timestamp: new Date() });
        break;
    }
  }

  // Send notification to specific user
  public sendToUser(userId: string, message: RealtimeMessage) {
    const connections = this.clients.get(userId);
    if (!connections) return;

    const data = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  // Broadcast to all connected users
  public broadcast(message: RealtimeMessage) {
    const data = JSON.stringify(message);
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  // High-priority notifications
  public notifyFanOnline(userId: string, fan: {
    id: string;
    username: string;
    totalSpent: number;
    lastActive: Date;
  }) {
    this.sendToUser(userId, {
      type: 'fan_online',
      data: {
        fanId: fan.id,
        username: fan.username,
        totalSpent: fan.totalSpent,
        lastActive: fan.lastActive,
        message: `${fan.username} is online NOW! They spent $${fan.totalSpent} lifetime.`
      },
      timestamp: new Date(),
      priority: 'urgent'
    });
  }

  public notifyNewMessage(userId: string, message: {
    fanId: string;
    fanUsername: string;
    content: string;
    hasTipped: boolean;
    tipAmount?: number;
  }) {
    this.sendToUser(userId, {
      type: 'new_message',
      data: {
        ...message,
        message: message.hasTipped 
          ? `💰 ${message.fanUsername} sent a message with $${message.tipAmount} tip!`
          : `New message from ${message.fanUsername}`
      },
      timestamp: new Date(),
      priority: message.hasTipped ? 'high' : 'medium'
    });
  }

  public notifyNewTip(userId: string, tip: {
    fanId: string;
    fanUsername: string;
    amount: number;
    message?: string;
  }) {
    this.sendToUser(userId, {
      type: 'new_tip',
      data: {
        ...tip,
        message: `💸 ${tip.fanUsername} just tipped $${tip.amount}!`
      },
      timestamp: new Date(),
      priority: 'urgent'
    });
  }

  public notifySubscriptionExpiring(userId: string, fans: Array<{
    id: string;
    username: string;
    expiresIn: number; // days
    monthlyValue: number;
  }>) {
    this.sendToUser(userId, {
      type: 'subscription_expiring',
      data: {
        fans,
        totalAtRisk: fans.reduce((sum, f) => sum + f.monthlyValue, 0),
        message: `${fans.length} VIPs expire soon - $${fans.reduce((sum, f) => sum + f.monthlyValue, 0)}/month at risk!`
      },
      timestamp: new Date(),
      priority: 'high'
    });
  }

  // Connect to platform-specific events
  public connectToPlatforms() {
    // Connect to OnlyFans scraper
    if (process.env.ENABLE_ONLYFANS_SCRAPER === 'true') {
      this.connectToOnlyFansScraper();
    }

    // Connect to Instagram webhooks
    if (process.env.INSTAGRAM_WEBHOOK_SECRET) {
      this.setupInstagramWebhooks();
    }

    // Connect to other platforms...
  }

  private connectToOnlyFansScraper() {
    const scraperWs = new WebSocket('ws://localhost:9222/onlyfans-scraper');
    
    scraperWs.on('message', (data: string) => {
      const event = JSON.parse(data);
      
      // Forward relevant events to users
      switch (event.type) {
        case 'fan_online':
          // Find which creator this fan belongs to
          const creatorId = this.findCreatorForFan(event.payload.fanId);
          if (creatorId) {
            this.notifyFanOnline(creatorId, event.payload);
          }
          break;
          
        case 'new_message':
          const messageCreatorId = this.findCreatorForFan(event.payload.fanId);
          if (messageCreatorId) {
            this.notifyNewMessage(messageCreatorId, event.payload);
          }
          break;
      }
    });
  }

  private setupInstagramWebhooks() {
    // Instagram webhook handler would go here
    // This would receive real-time updates from Instagram
  }

  private findCreatorForFan(fanId: string): string | null {
    // In production, query DynamoDB to find which creator owns this fan
    // For now, return mock
    return 'creator123';
  }
}

// Client-side WebSocket connection
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectInterval: any;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(private url: string, private token: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.url}?token=${this.token}`);

      this.ws.on('open', () => {
        console.log('✅ Connected to realtime server');
        this.clearReconnect();
        resolve();
      });

      this.ws.on('message', (data: string) => {
        const message = JSON.parse(data);
        this.handleMessage(message);
      });

      this.ws.on('close', () => {
        console.log('❌ Disconnected from realtime server');
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  private handleMessage(message: RealtimeMessage) {
    // Notify listeners
    const listeners = this.listeners.get(message.type) || new Set();
    listeners.forEach(callback => callback(message));

    // Global listeners
    const globalListeners = this.listeners.get('*') || new Set();
    globalListeners.forEach(callback => callback(message));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private scheduleReconnect() {
    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect...');
      this.connect().catch(console.error);
    }, 5000);
  }

  private clearReconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  disconnect() {
    this.clearReconnect();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}