'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

interface PresenceUser {
  userId: string;
  userName: string;
  userEmail: string;
  cursorPosition?: number;
  selectionStart?: number;
  selectionEnd?: number;
  lastSeen: Date;
}

interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface UsePresenceOptions {
  contentId: string;
  enabled?: boolean;
}

interface UsePresenceReturn {
  activeUsers: PresenceUser[];
  typingUsers: TypingUser[];
  isConnected: boolean;
  updateCursor: (position: number) => void;
  updateSelection: (start: number, end: number) => void;
  startTyping: () => void;
  stopTyping: () => void;
  error: string | null;
}

export function usePresence({ 
  contentId, 
  enabled = true 
}: UsePresenceOptions): UsePresenceReturn {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !session?.user || !contentId) {
      return;
    }

    const initializeSocket = async () => {
      try {
        // Get connection info from API
        const response = await fetch('/api/socket/presence', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to initialize presence');
        }

        const connectionInfo = await response.json();

        // Create socket connection
        const newSocket = io({
          path: connectionInfo.socketPath,
          autoConnect: false,
        });

        // Set up event listeners
        newSocket.on('connect', () => {
          console.log('Connected to presence service');
          setIsConnected(true);
          setError(null);

          // Join the content room
          newSocket.emit('join-content', {
            contentId,
            userId: connectionInfo.userId,
            userName: connectionInfo.userName,
            userEmail: connectionInfo.userEmail,
          });
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from presence service');
          setIsConnected(false);
        });

        newSocket.on('error', (errorData: { message: string }) => {
          console.error('Presence error:', errorData.message);
          setError(errorData.message);
        });

        newSocket.on('presence-list', (users: PresenceUser[]) => {
          // Filter out current user
          const otherUsers = users.filter(user => user.userId !== session.user.id);
          setActiveUsers(otherUsers);
        });

        newSocket.on('presence-update', (update: {
          userId: string;
          userName: string;
          cursorPosition?: number;
          selectionStart?: number;
          selectionEnd?: number;
        }) => {
          setActiveUsers(prev => 
            prev.map(user => 
              user.userId === update.userId
                ? {
                    ...user,
                    cursorPosition: update.cursorPosition,
                    selectionStart: update.selectionStart,
                    selectionEnd: update.selectionEnd,
                    lastSeen: new Date()
                  }
                : user
            )
          );
        });

        newSocket.on('user-typing', (data: TypingUser) => {
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user.userId !== data.userId);
            return data.isTyping ? [...filtered, data] : filtered;
          });

          // Auto-remove typing indicator after 3 seconds
          if (data.isTyping) {
            setTimeout(() => {
              setTypingUsers(prev => 
                prev.filter(user => user.userId !== data.userId)
              );
            }, 3000);
          }
        });

        // Connect the socket
        newSocket.connect();
        setSocket(newSocket);

      } catch (err) {
        console.error('Error initializing presence:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
    };
  }, [enabled, session?.user, contentId]);

  // Update cursor position (debounced)
  const updateCursor = useCallback((position: number) => {
    if (!socket || !isConnected) return;

    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    cursorUpdateTimeoutRef.current = setTimeout(() => {
      socket.emit('cursor-update', {
        contentId,
        cursorPosition: position,
      });
    }, 100); // Debounce cursor updates
  }, [socket, isConnected, contentId]);

  // Update selection (debounced)
  const updateSelection = useCallback((start: number, end: number) => {
    if (!socket || !isConnected) return;

    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    cursorUpdateTimeoutRef.current = setTimeout(() => {
      socket.emit('cursor-update', {
        contentId,
        selectionStart: start,
        selectionEnd: end,
      });
    }, 100);
  }, [socket, isConnected, contentId]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('typing-start', { contentId });

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, isConnected, contentId]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('typing-stop', { contentId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, isConnected, contentId]);

  return {
    activeUsers,
    typingUsers,
    isConnected,
    updateCursor,
    updateSelection,
    startTyping,
    stopTyping,
    error,
  };
}