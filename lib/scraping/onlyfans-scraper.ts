// Modern OnlyFans Scraper - Works with Chrome Extension
// This connects with your Chrome extension to get real-time data

import { EventEmitter } from 'events';

export interface OnlyFansData {
  profile: {
    username: string;
    subscribers: number;
    likes: number;
    posts: number;
    price: number;
  };
  fans: Array<{
    id: string;
    username: string;
    lastSeen: Date;
    totalSpent: number;
    isVIP: boolean;
    hasRenewed: boolean;
    subscriptionExpiry: Date;
  }>;
  messages: Array<{
    id: string;
    fanId: string;
    fanUsername: string;
    content: string;
    timestamp: Date;
    hasMedia: boolean;
    hasTipped: boolean;
    tipAmount?: number;
    isRead: boolean;
  }>;
  earnings: {
    today: number;
    week: number;
    month: number;
    pending: number;
  };
  content: {
    vault: Array<{
      id: string;
      type: 'photo' | 'video' | 'bundle';
      price: number;
      sales: number;
      revenue: number;
    }>;
  };
}

export class OnlyFansScraper extends EventEmitter {
  private ws: WebSocket | null = null;
  private extensionId: string;
  private isConnected: boolean = false;
  
  constructor(extensionId: string = 'your-extension-id-here') {
    super();
    this.extensionId = extensionId;
  }

  // Connect to Chrome Extension via WebSocket
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // Connect to local WebSocket server that bridges to Chrome extension
        this.ws = new WebSocket('ws://localhost:9222/onlyfans-scraper');
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.emit('connected');
          console.log('✅ Connected to OnlyFans scraper');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleData(data);
        };

        this.ws.onerror = (error) => {
          console.error('❌ Scraper connection error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
          console.log('Disconnected from scraper');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Handle incoming data from extension
  private handleData(data: any) {
    switch (data.type) {
      case 'profile':
        this.emit('profile', data.payload);
        break;
      
      case 'fans':
        this.emit('fans', data.payload);
        break;
      
      case 'messages':
        this.emit('messages', data.payload);
        break;
      
      case 'earnings':
        this.emit('earnings', data.payload);
        break;
      
      case 'new_message':
        this.emit('new_message', data.payload);
        break;
      
      case 'fan_online':
        this.emit('fan_online', data.payload);
        break;
      
      case 'tip_received':
        this.emit('tip_received', data.payload);
        break;
    }
  }

  // Request specific data from extension
  async requestData(dataType: string) {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to scraper');
    }

    this.ws.send(JSON.stringify({
      action: 'request',
      type: dataType
    }));
  }

  // Get all current data
  async getAllData(): Promise<OnlyFansData> {
    return new Promise((resolve) => {
      const data: Partial<OnlyFansData> = {};
      
      // Set up one-time listeners
      const handlers = {
        profile: (profile: any) => {
          data.profile = profile;
          checkComplete();
        },
        fans: (fans: any) => {
          data.fans = fans;
          checkComplete();
        },
        messages: (messages: any) => {
          data.messages = messages;
          checkComplete();
        },
        earnings: (earnings: any) => {
          data.earnings = earnings;
          checkComplete();
        },
        content: (content: any) => {
          data.content = content;
          checkComplete();
        }
      };

      // Register handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        this.once(event, handler);
      });

      // Check if all data received
      const checkComplete = () => {
        if (data.profile && data.fans && data.messages && data.earnings) {
          resolve(data as OnlyFansData);
        }
      };

      // Request all data types
      ['profile', 'fans', 'messages', 'earnings', 'content'].forEach(type => {
        this.requestData(type);
      });
    });
  }

  // Send message to specific fan
  async sendMessage(fanId: string, message: string) {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to scraper');
    }

    this.ws.send(JSON.stringify({
      action: 'send_message',
      fanId,
      message
    }));
  }

  // Send mass message
  async sendMassMessage(fanIds: string[], message: string) {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to scraper');
    }

    this.ws.send(JSON.stringify({
      action: 'mass_message',
      fanIds,
      message
    }));
  }

  // Post content
  async postContent(content: {
    text: string;
    media?: string[];
    price?: number;
  }) {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to scraper');
    }

    this.ws.send(JSON.stringify({
      action: 'post_content',
      content
    }));
  }

  // Get specific fan details
  async getFanDetails(fanId: string) {
    return new Promise((resolve) => {
      this.once(`fan_details_${fanId}`, resolve);
      this.requestData(`fan_${fanId}`);
    });
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

// Chrome Extension Bridge Server
// This runs locally and bridges between the Chrome extension and your app
export class ChromeExtensionBridge {
  private server: any;
  private clients: Set<any> = new Set();
  
  async start(port: number = 9222) {
    const { WebSocketServer } = await import('ws');
    
    this.server = new WebSocketServer({ 
      port, 
      path: '/onlyfans-scraper' 
    });

    this.server.on('connection', (ws: any) => {
      console.log('New client connected');
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        const data = JSON.parse(message);
        this.handleClientMessage(ws, data);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('Client disconnected');
      });
    });

    // Connect to Chrome Extension via Native Messaging
    this.connectToExtension();
    
    console.log(`Bridge server running on port ${port}`);
  }

  private async connectToExtension() {
    // This would use Chrome Native Messaging API
    // For now, we'll simulate with periodic data updates
    setInterval(() => {
      this.broadcastToClients({
        type: 'earnings',
        payload: {
          today: Math.floor(Math.random() * 1000),
          week: Math.floor(Math.random() * 5000),
          month: Math.floor(Math.random() * 20000),
          pending: Math.floor(Math.random() * 500)
        }
      });
    }, 30000); // Update every 30 seconds
  }

  private handleClientMessage(client: any, data: any) {
    // Forward requests to Chrome extension
    console.log('Received from client:', data);
    
    // Simulate responses for testing
    if (data.action === 'request') {
      setTimeout(() => {
        client.send(JSON.stringify({
          type: data.type,
          payload: this.getMockData(data.type)
        }));
      }, 100);
    }
  }

  private broadcastToClients(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      client.send(message);
    });
  }

  private getMockData(type: string) {
    // Return realistic mock data for testing
    const mockData: any = {
      profile: {
        username: 'hotcreator',
        subscribers: 1234,
        likes: 45678,
        posts: 567,
        price: 9.99
      },
      fans: [
        {
          id: 'fan123',
          username: 'BigSpender92',
          lastSeen: new Date(),
          totalSpent: 1200,
          isVIP: true,
          hasRenewed: true,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ],
      messages: [
        {
          id: 'msg123',
          fanId: 'fan123',
          fanUsername: 'BigSpender92',
          content: 'Hey beautiful!',
          timestamp: new Date(),
          hasMedia: false,
          hasTipped: true,
          tipAmount: 50,
          isRead: false
        }
      ],
      earnings: {
        today: 450,
        week: 3200,
        month: 12450,
        pending: 280
      }
    };

    return mockData[type] || {};
  }
}