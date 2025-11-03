'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePresence } from '@/hooks/usePresence';
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Edit3, 
  Eye,
  Circle
} from 'lucide-react';

interface PresenceIndicatorsProps {
  contentId: string;
  className?: string;
}

export function PresenceIndicators({ contentId, className = '' }: PresenceIndicatorsProps) {
  const { 
    activeUsers, 
    typingUsers, 
    isConnected, 
    error 
  } = usePresence({ contentId });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserColor = (userId: string) => {
    // Generate consistent color based on user ID
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500'
    ];
    
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Connection error</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <Circle className="h-2 w-2 fill-current animate-pulse" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connected - Real-time collaboration active</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-gray-400">
                  <WifiOff className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connecting to collaboration service...</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Active Users Count */}
        {activeUsers.length > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{activeUsers.length}</span>
          </div>
        )}

        {/* User Avatars */}
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map((user) => {
            const isTyping = typingUsers.some(tu => tu.userId === user.userId);
            const userColor = getUserColor(user.userId);
            
            return (
              <Tooltip key={user.userId}>
                <TooltipTrigger>
                  <div className="relative">
                    <Avatar className={`h-8 w-8 border-2 border-white ring-2 ${isTyping ? 'ring-blue-400 ring-offset-1' : 'ring-gray-200'}`}>
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.userEmail}`} 
                        alt={user.userName}
                      />
                      <AvatarFallback className={`text-white text-xs ${userColor}`}>
                        {getInitials(user.userName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                        <Edit3 className="h-2 w-2 text-white" />
                      </div>
                    )}
                    
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-xs text-gray-500">{user.userEmail}</p>
                    {isTyping && (
                      <div className="flex items-center gap-1 mt-1 text-blue-600">
                        <Edit3 className="h-3 w-3" />
                        <span className="text-xs">Typing...</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Active {Math.round((Date.now() - new Date(user.lastSeen).getTime()) / 1000)}s ago
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {/* Show overflow count */}
          {activeUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="h-8 w-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{activeUsers.length - 5}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{activeUsers.length - 5} more collaborators</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-blue-600">
              <Edit3 className="h-4 w-4" />
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {typingUsers.length === 1 
                ? `${typingUsers[0].userName} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </span>
          </div>
        )}

        {/* No active users message */}
        {activeUsers.length === 0 && isConnected && (
          <div className="flex items-center gap-2 text-gray-500">
            <Eye className="h-4 w-4" />
            <span className="text-sm">You're the only one here</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Cursor overlay component for showing other users' cursors in the editor
export function CursorOverlay({ 
  contentId, 
  editorRef 
}: { 
  contentId: string;
  editorRef: React.RefObject<HTMLElement>;
}) {
  const { activeUsers } = usePresence({ contentId });

  if (!editorRef.current) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {activeUsers.map((user) => {
        if (user.cursorPosition === undefined) return null;

        const userColor = user.userId.split('').reduce((acc, char) => {
          return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        const colors = ['blue', 'green', 'purple', 'pink', 'yellow', 'indigo', 'red', 'teal'];
        const color = colors[Math.abs(userColor) % colors.length];

        // Calculate cursor position (this would need to be implemented based on your editor)
        const cursorStyle = {
          position: 'absolute' as const,
          left: `${user.cursorPosition}px`, // This needs proper calculation
          top: '0px',
          width: '2px',
          height: '20px',
          backgroundColor: `var(--${color}-500)`,
          zIndex: 10,
        };

        return (
          <div key={user.userId}>
            {/* Cursor line */}
            <div style={cursorStyle} className="animate-pulse" />
            
            {/* User label */}
            <div 
              style={{
                position: 'absolute',
                left: `${user.cursorPosition}px`,
                top: '-25px',
                zIndex: 11,
              }}
              className={`px-2 py-1 text-xs text-white bg-${color}-500 rounded whitespace-nowrap`}
            >
              {user.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
}