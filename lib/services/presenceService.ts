import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { contentItemsRepository } from '@/lib/db/repositories/contentItemsRepository';

interface PresenceData {
  userId: string;
  userName: string;
  userEmail: string;
  cursorPosition?: number;
  selectionStart?: number;
  selectionEnd?: number;
  lastSeen: Date;
}

interface ContentPresence {
  [contentId: string]: {
    [userId: string]: PresenceData;
  };
}

export class PresenceService {
  private io: SocketIOServer;
  private presence: ContentPresence = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      path: '/api/socket/presence'
    });

    this.setupEventHandlers();
    this.startCleanupTimer();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected to presence service:', socket.id);

      // Join content room
      socket.on('join-content', async (data: {
        contentId: string;
        userId: string;
        userName: string;
        userEmail: string;
      }) => {
        try {
          const { contentId, userId, userName, userEmail } = data;

          // Verify user has access to this content
          const hasAccess = await contentItemsRepository.checkUserAccess(contentId, userId);
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this content' });
            return;
          }

          // Join the content room
          socket.join(`content:${contentId}`);
          socket.data.contentId = contentId;
          socket.data.userId = userId;

          // Initialize presence data
          if (!this.presence[contentId]) {
            this.presence[contentId] = {};
          }

          this.presence[contentId][userId] = {
            userId,
            userName,
            userEmail,
            lastSeen: new Date()
          };

          // Update database
          await this.updatePresenceInDB(contentId, userId, {
            cursor_position: null,
            selection_start: null,
            selection_end: null
          });

          // Broadcast updated presence to all users in the room
          this.broadcastPresence(contentId);

          console.log(`User ${userName} joined content ${contentId}`);
        } catch (error) {
          console.error('Error joining content:', error);
          socket.emit('error', { message: 'Failed to join content' });
        }
      });

      // Update cursor position
      socket.on('cursor-update', async (data: {
        contentId: string;
        cursorPosition?: number;
        selectionStart?: number;
        selectionEnd?: number;
      }) => {
        try {
          const { contentId, cursorPosition, selectionStart, selectionEnd } = data;
          const userId = socket.data.userId;

          if (!userId || !this.presence[contentId]?.[userId]) {
            return;
          }

          // Update presence data
          this.presence[contentId][userId] = {
            ...this.presence[contentId][userId],
            cursorPosition,
            selectionStart,
            selectionEnd,
            lastSeen: new Date()
          };

          // Update database
          await this.updatePresenceInDB(contentId, userId, {
            cursor_position: cursorPosition || null,
            selection_start: selectionStart || null,
            selection_end: selectionEnd || null
          });

          // Broadcast to other users (exclude sender)
          socket.to(`content:${contentId}`).emit('presence-update', {
            userId,
            cursorPosition,
            selectionStart,
            selectionEnd,
            userName: this.presence[contentId][userId].userName
          });
        } catch (error) {
          console.error('Error updating cursor:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { contentId: string }) => {
        const userId = socket.data.userId;
        if (!userId) return;

        socket.to(`content:${data.contentId}`).emit('user-typing', {
          userId,
          userName: this.presence[data.contentId]?.[userId]?.userName,
          isTyping: true
        });
      });

      socket.on('typing-stop', (data: { contentId: string }) => {
        const userId = socket.data.userId;
        if (!userId) return;

        socket.to(`content:${data.contentId}`).emit('user-typing', {
          userId,
          userName: this.presence[data.contentId]?.[userId]?.userName,
          isTyping: false
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          const contentId = socket.data.contentId;
          const userId = socket.data.userId;

          if (contentId && userId && this.presence[contentId]?.[userId]) {
            // Remove user from presence
            delete this.presence[contentId][userId];

            // Remove from database
            await this.removePresenceFromDB(contentId, userId);

            // Broadcast updated presence
            this.broadcastPresence(contentId);

            console.log(`User ${userId} left content ${contentId}`);
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });
  }

  private broadcastPresence(contentId: string) {
    const presenceData = this.presence[contentId] || {};
    const activeUsers = Object.values(presenceData).map(user => ({
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      cursorPosition: user.cursorPosition,
      selectionStart: user.selectionStart,
      selectionEnd: user.selectionEnd,
      lastSeen: user.lastSeen
    }));

    this.io.to(`content:${contentId}`).emit('presence-list', activeUsers);
  }

  private async updatePresenceInDB(
    contentId: string, 
    userId: string, 
    data: {
      cursor_position: number | null;
      selection_start: number | null;
      selection_end: number | null;
    }
  ) {
    try {
      await contentItemsRepository.updatePresence(contentId, userId, data);
    } catch (error) {
      console.error('Error updating presence in DB:', error);
    }
  }

  private async removePresenceFromDB(contentId: string, userId: string) {
    try {
      await contentItemsRepository.removePresence(contentId, userId);
    } catch (error) {
      console.error('Error removing presence from DB:', error);
    }
  }

  private startCleanupTimer() {
    // Clean up inactive users every 30 seconds
    this.cleanupInterval = setInterval(() => {
      const now = new Date();
      const timeout = 5 * 60 * 1000; // 5 minutes

      Object.keys(this.presence).forEach(contentId => {
        Object.keys(this.presence[contentId]).forEach(userId => {
          const user = this.presence[contentId][userId];
          if (now.getTime() - user.lastSeen.getTime() > timeout) {
            delete this.presence[contentId][userId];
            this.removePresenceFromDB(contentId, userId);
            this.broadcastPresence(contentId);
          }
        });

        // Remove empty content rooms
        if (Object.keys(this.presence[contentId]).length === 0) {
          delete this.presence[contentId];
        }
      });
    }, 30000);
  }

  public getActiveUsers(contentId: string): PresenceData[] {
    return Object.values(this.presence[contentId] || {});
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.io.close();
  }
}

// Singleton instance
let presenceService: PresenceService | null = null;

export function initializePresenceService(server: HTTPServer): PresenceService {
  if (!presenceService) {
    presenceService = new PresenceService(server);
  }
  return presenceService;
}

export function getPresenceService(): PresenceService | null {
  return presenceService;
}