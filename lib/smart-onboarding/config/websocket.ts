// Smart Onboarding System - WebSocket Configuration and Real-time Communication
// TODO: Install socket.io package to enable real-time features

// import { Server as SocketIOServer } from 'socket.io';
// import { Server as HTTPServer } from 'http';
// import { WEBSOCKET_EVENTS, WEBSOCKET_CHANNELS } from './redis';
// import { smartOnboardingCache } from './redis';
// import type { 
//   OnboardingEvent, 
//   SystemEvent, 
//   BehaviorEvent, 
//   InteractionEvent 
// } from '../types';

// Stub constants and types
const WEBSOCKET_EVENTS = {} as any;
const WEBSOCKET_CHANNELS = {} as any;
const smartOnboardingCache = {} as any;
type OnboardingEvent = any;
type SystemEvent = any;
type BehaviorEvent = any;
type InteractionEvent = any;

// WebSocket server configuration
export const WEBSOCKET_CONFIG = {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
} as const;

// Event rate limiting configuration
export const EVENT_RATE_LIMITS = {
  BEHAVIOR_TRACKING: { limit: 100, window: 60 }, // 100 events per minute
  INTERACTION_TRACKING: { limit: 200, window: 60 }, // 200 events per minute
  ENGAGEMENT_UPDATES: { limit: 20, window: 60 }, // 20 updates per minute
  GENERAL_EVENTS: { limit: 50, window: 60 } // 50 events per minute
} as const;

// Smart Onboarding WebSocket Manager
export class SmartOnboardingWebSocket {
  private io: any; // Stub for SocketIOServer
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  
  constructor(server: any) {
    // TODO: Uncomment when socket.io is installed
    // this.io = new SocketIOServer(server, WEBSOCKET_CONFIG);
    // Create a stub for this.io
    this.io = {
      on: () => {},
      emit: () => {},
      to: () => ({ emit: () => {} }),
      sockets: { sockets: { size: 0 } },
      close: () => {}
    };
    // this.setupEventHandlers();
    // this.setupRedisSubscriptions();
    console.warn('WebSocket support disabled - socket.io not installed');
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log(`Smart Onboarding WebSocket client connected: ${socket.id}`);
      
      // Handle user authentication and session setup
      socket.on('authenticate', async (data: { userId: string; sessionId: string; token?: string }) => {
        try {
          // Validate user token if provided
          if (data.token) {
            // Add token validation logic here
          }
          
          // Associate socket with user
          this.associateSocketWithUser(socket.id, data.userId);
          
          // Start user session in cache
          await smartOnboardingCache.startUserSession(data.userId, data.sessionId);
          
          // Join user-specific room
          socket.join(`user:${data.userId}`);
          
          // Send authentication success
          socket.emit('authenticated', { 
            success: true, 
            userId: data.userId,
            sessionId: data.sessionId
          });
          
          console.log(`User ${data.userId} authenticated on socket ${socket.id}`);
          
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { 
            error: 'Authentication failed' 
          });
        }
      });
      
      // Handle behavior event tracking
      socket.on('track_behavior', async (event: BehaviorEvent) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        // Rate limiting
        const rateLimitKey = `behavior_tracking:${userId}`;
        const rateLimit = await smartOnboardingCache.checkRateLimit(
          rateLimitKey, 
          EVENT_RATE_LIMITS.BEHAVIOR_TRACKING.limit,
          EVENT_RATE_LIMITS.BEHAVIOR_TRACKING.window
        );
        
        if (!rateLimit.allowed) {
          socket.emit('rate_limit_exceeded', { 
            type: 'behavior_tracking',
            resetTime: rateLimit.resetTime
          });
          return;
        }
        
        try {
          // Process behavior event
          await this.processBehaviorEvent(userId, event);
          
          // Update session activity
          await smartOnboardingCache.updateSessionActivity(event.id);
          
          // Acknowledge event received
          socket.emit('behavior_tracked', { eventId: event.id });
          
        } catch (error) {
          console.error('Error processing behavior event:', error);
          socket.emit('error', { message: 'Failed to process behavior event' });
        }
      });
      
      // Handle interaction event tracking
      socket.on('track_interaction', async (event: InteractionEvent) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        // Rate limiting
        const rateLimitKey = `interaction_tracking:${userId}`;
        const rateLimit = await smartOnboardingCache.checkRateLimit(
          rateLimitKey,
          EVENT_RATE_LIMITS.INTERACTION_TRACKING.limit,
          EVENT_RATE_LIMITS.INTERACTION_TRACKING.window
        );
        
        if (!rateLimit.allowed) {
          socket.emit('rate_limit_exceeded', { 
            type: 'interaction_tracking',
            resetTime: rateLimit.resetTime
          });
          return;
        }
        
        try {
          // Process interaction event
          await this.processInteractionEvent(userId, event);
          
          // Acknowledge event received
          socket.emit('interaction_tracked', { eventId: event.id });
          
        } catch (error) {
          console.error('Error processing interaction event:', error);
          socket.emit('error', { message: 'Failed to process interaction event' });
        }
      });
      
      // Handle engagement score requests
      socket.on('get_engagement_score', async () => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        try {
          const score = await smartOnboardingCache.getEngagementScore(userId);
          socket.emit('engagement_score', { score: score || 0.5 });
        } catch (error) {
          console.error('Error getting engagement score:', error);
          socket.emit('error', { message: 'Failed to get engagement score' });
        }
      });
      
      // Handle journey status requests
      socket.on('get_journey_status', async () => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        try {
          const journey = await smartOnboardingCache.getUserJourney(userId);
          socket.emit('journey_status', journey);
        } catch (error) {
          console.error('Error getting journey status:', error);
          socket.emit('error', { message: 'Failed to get journey status' });
        }
      });
      
      // Handle intervention responses
      socket.on('intervention_response', async (data: { 
        interventionId: string; 
        response: 'accepted' | 'dismissed' | 'ignored';
        feedback?: string;
      }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        try {
          // Process intervention response
          await this.processInterventionResponse(userId, data);
          
          // Acknowledge response received
          socket.emit('intervention_response_received', { 
            interventionId: data.interventionId 
          });
          
        } catch (error) {
          console.error('Error processing intervention response:', error);
          socket.emit('error', { message: 'Failed to process intervention response' });
        }
      });
      
      // Handle help requests
      socket.on('request_help', async (data: { stepId?: string; context?: any }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        try {
          // Generate contextual help
          const helpContent = await this.generateContextualHelp(userId, data);
          
          socket.emit('help_content', helpContent);
          
        } catch (error) {
          console.error('Error generating help content:', error);
          socket.emit('error', { message: 'Failed to generate help content' });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', async (reason: any) => {
        console.log(`Smart Onboarding WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
        
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          // Remove socket from user sessions
          this.disassociateSocketFromUser(socket.id, userId);
          
          // If no more sockets for this user, end session
          const userSockets = this.userSessions.get(userId);
          if (!userSockets || userSockets.size === 0) {
            // End user session in cache
            const sessionId = `session_${Date.now()}`; // In real implementation, track actual session ID
            await smartOnboardingCache.endUserSession(userId, sessionId);
          }
        }
      });
      
      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }
  
  private setupRedisSubscriptions() {
    // Subscribe to system events
    smartOnboardingCache.subscribeToEvents([
      WEBSOCKET_CHANNELS.SYSTEM_EVENTS,
      WEBSOCKET_CHANNELS.ENGAGEMENT_ALERTS,
      WEBSOCKET_CHANNELS.INTERVENTION_EVENTS,
      WEBSOCKET_CHANNELS.CONTENT_UPDATES,
      WEBSOCKET_CHANNELS.ML_MODEL_UPDATES,
      WEBSOCKET_CHANNELS.EXPERIMENT_EVENTS
    ], (channel: any, message: any) => {
      this.handleRedisEvent(channel, message);
    });
  }
  
  private handleRedisEvent(channel: string, message: any) {
    switch (channel) {
      case WEBSOCKET_CHANNELS.SYSTEM_EVENTS:
        this.broadcastSystemEvent(message);
        break;
        
      case WEBSOCKET_CHANNELS.ENGAGEMENT_ALERTS:
        this.handleEngagementAlert(message);
        break;
        
      case WEBSOCKET_CHANNELS.INTERVENTION_EVENTS:
        this.handleInterventionEvent(message);
        break;
        
      case WEBSOCKET_CHANNELS.CONTENT_UPDATES:
        this.handleContentUpdate(message);
        break;
        
      case WEBSOCKET_CHANNELS.ML_MODEL_UPDATES:
        this.handleModelUpdate(message);
        break;
        
      case WEBSOCKET_CHANNELS.EXPERIMENT_EVENTS:
        this.handleExperimentEvent(message);
        break;
        
      default:
        console.log(`Unhandled Redis event on channel: ${channel}`);
    }
  }
  
  private associateSocketWithUser(socketId: string, userId: string) {
    // Add socket to user's session set
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(socketId);
    
    // Map socket to user
    this.socketUsers.set(socketId, userId);
  }
  
  private disassociateSocketFromUser(socketId: string, userId: string) {
    // Remove socket from user's session set
    const userSockets = this.userSessions.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSessions.delete(userId);
      }
    }
    
    // Remove socket to user mapping
    this.socketUsers.delete(socketId);
  }
  
  private async processBehaviorEvent(userId: string, event: BehaviorEvent) {
    // Publish event to Redis for processing by analytics service
    await smartOnboardingCache.publishEvent(
      WEBSOCKET_CHANNELS.USER_EVENTS(userId),
      {
        type: 'behavior_event',
        userId,
        event,
        timestamp: new Date()
      }
    );
  }
  
  private async processInteractionEvent(userId: string, event: InteractionEvent) {
    // Publish event to Redis for processing by analytics service
    await smartOnboardingCache.publishEvent(
      WEBSOCKET_CHANNELS.USER_EVENTS(userId),
      {
        type: 'interaction_event',
        userId,
        event,
        timestamp: new Date()
      }
    );
  }
  
  private async processInterventionResponse(userId: string, data: any) {
    // Publish intervention response for processing
    await smartOnboardingCache.publishEvent(
      WEBSOCKET_CHANNELS.INTERVENTION_EVENTS,
      {
        type: 'intervention_response',
        userId,
        ...data,
        timestamp: new Date()
      }
    );
  }
  
  private async generateContextualHelp(userId: string, data: any) {
    // This would integrate with the Contextual Help System
    // For now, return mock help content
    return {
      type: 'contextual_help',
      title: 'Need Help?',
      content: 'Our AI assistant is here to guide you through this step.',
      actions: [
        { id: 'get_hint', text: 'Get a Hint', type: 'primary' },
        { id: 'show_tutorial', text: 'Show Tutorial', type: 'secondary' },
        { id: 'contact_support', text: 'Contact Support', type: 'tertiary' }
      ]
    };
  }
  
  private broadcastSystemEvent(event: SystemEvent) {
    // Broadcast to all connected clients
    this.io.emit('system_event', event);
  }
  
  private handleEngagementAlert(alert: any) {
    const { userId, ...alertData } = alert;
    
    // Send to specific user
    this.io.to(`user:${userId}`).emit('engagement_alert', alertData);
  }
  
  private handleInterventionEvent(event: any) {
    const { userId, ...eventData } = event;
    
    // Send to specific user
    this.io.to(`user:${userId}`).emit('intervention_event', eventData);
  }
  
  private handleContentUpdate(update: any) {
    const { userId, ...updateData } = update;
    
    if (userId) {
      // Send to specific user
      this.io.to(`user:${userId}`).emit('content_update', updateData);
    } else {
      // Broadcast to all users
      this.io.emit('content_update', updateData);
    }
  }
  
  private handleModelUpdate(update: any) {
    // Broadcast model updates to admin clients only
    this.io.to('admin').emit('model_update', update);
  }
  
  private handleExperimentEvent(event: any) {
    // Broadcast experiment events to admin clients only
    this.io.to('admin').emit('experiment_event', event);
  }
  
  // Public methods for external services
  public async sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
  
  public async sendToAllUsers(event: string, data: any) {
    this.io.emit(event, data);
  }
  
  public async sendEngagementUpdate(userId: string, score: number) {
    this.io.to(`user:${userId}`).emit('engagement_update', { score });
  }
  
  public async sendInterventionTrigger(userId: string, intervention: any) {
    this.io.to(`user:${userId}`).emit('intervention_triggered', intervention);
  }
  
  public async sendJourneyUpdate(userId: string, journey: any) {
    this.io.to(`user:${userId}`).emit('journey_update', journey);
  }
  
  public async sendContentAdaptation(userId: string, adaptation: any) {
    this.io.to(`user:${userId}`).emit('content_adapted', adaptation);
  }
  
  // Health and monitoring
  public getConnectionStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      authenticatedUsers: this.userSessions.size,
      averageSocketsPerUser: this.userSessions.size > 0 
        ? Array.from(this.userSessions.values()).reduce((sum, sockets) => sum + sockets.size, 0) / this.userSessions.size
        : 0
    };
  }
  
  public async healthCheck() {
    const stats = this.getConnectionStats();
    const redisHealth = await smartOnboardingCache.healthCheck();
    
    return {
      websocket: {
        status: 'healthy',
        connections: stats.totalConnections,
        authenticatedUsers: stats.authenticatedUsers
      },
      redis: redisHealth
    };
  }
  
  // Cleanup
  public async shutdown() {
    console.log('Shutting down Smart Onboarding WebSocket server...');
    
    // Notify all clients of shutdown
    this.io.emit('server_shutdown', { 
      message: 'Server is shutting down. Please reconnect in a moment.' 
    });
    
    // Close all connections
    this.io.close();
    
    // Clear session data
    this.userSessions.clear();
    this.socketUsers.clear();
  }
}

// Export WebSocket event types for type safety
export interface WebSocketEvents {
  // Client to server events
  authenticate: (data: { userId: string; sessionId: string; token?: string }) => void;
  track_behavior: (event: BehaviorEvent) => void;
  track_interaction: (event: InteractionEvent) => void;
  get_engagement_score: () => void;
  get_journey_status: () => void;
  intervention_response: (data: { interventionId: string; response: string; feedback?: string }) => void;
  request_help: (data: { stepId?: string; context?: any }) => void;
  ping: () => void;
  
  // Server to client events
  authenticated: (data: { success: boolean; userId: string; sessionId: string }) => void;
  authentication_error: (data: { error: string }) => void;
  behavior_tracked: (data: { eventId: string }) => void;
  interaction_tracked: (data: { eventId: string }) => void;
  engagement_score: (data: { score: number }) => void;
  engagement_update: (data: { score: number }) => void;
  engagement_alert: (data: any) => void;
  journey_status: (data: any) => void;
  journey_update: (data: any) => void;
  intervention_triggered: (data: any) => void;
  intervention_event: (data: any) => void;
  intervention_response_received: (data: { interventionId: string }) => void;
  help_content: (data: any) => void;
  content_update: (data: any) => void;
  content_adapted: (data: any) => void;
  system_event: (data: SystemEvent) => void;
  model_update: (data: any) => void;
  experiment_event: (data: any) => void;
  rate_limit_exceeded: (data: { type: string; resetTime: number }) => void;
  error: (data: { message: string }) => void;
  server_shutdown: (data: { message: string }) => void;
  pong: (data: { timestamp: number }) => void;
}

// Export singleton instance creator
export const createSmartOnboardingWebSocket = (server: any): SmartOnboardingWebSocket => {
  return new SmartOnboardingWebSocket(server);
};