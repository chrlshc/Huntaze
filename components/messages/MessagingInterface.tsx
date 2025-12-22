'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { TailAdminCard } from '@/components/ui/tailadmin/TailAdminCard';
import { FanList } from './FanList';
import { FanCardProps } from './FanCard';
import { ChatContainer, ChatMessage } from './ChatContainer';
import { ContextPanel } from './ContextPanel';
import './messaging-interface.css';

// Mock data for demonstration
const mockConversations: FanCardProps[] = [
  {
    id: '1',
    name: 'Sophie Martin',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    lastMessage: 'Thanks for the exclusive content! 😍',
    timestamp: '2m',
    unreadCount: 3,
    isOnline: true,
    tags: ['VIP', 'Loyal'],
  },
  {
    id: '2',
    name: 'Lucas Dubois',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    lastMessage: 'When are you posting new content?',
    timestamp: '15m',
    unreadCount: 1,
    isOnline: false,
    tags: ['New'],
  },
  {
    id: '3',
    name: 'Emma Bernard',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Love your style! 💕',
    timestamp: '1h',
    unreadCount: 0,
    isOnline: true,
    tags: ['VIP', 'Top Fan'],
  },
  {
    id: '4',
    name: 'Thomas Petit',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    lastMessage: 'Can you send more photos?',
    timestamp: '2h',
    unreadCount: 0,
    isOnline: false,
    tags: [],
  },
  {
    id: '5',
    name: 'Chloé Moreau',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Great content as always!',
    timestamp: '3h',
    unreadCount: 2,
    isOnline: true,
    tags: ['Loyal'],
  },
  {
    id: '6',
    name: 'Nina Lefèvre',
    avatarUrl: 'https://i.pravatar.cc/150?img=6',
    lastMessage: 'Je viens de m’abonner ✨',
    timestamp: '4h',
    unreadCount: 1,
    isOnline: true,
    tags: ['New'],
  },
  {
    id: '7',
    name: 'Camille Laurent',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    lastMessage: 'Your stories are really great 🙌',
    timestamp: '6h',
    unreadCount: 0,
    isOnline: false,
    tags: ['Loyal'],
  },
  {
    id: '8',
    name: 'Adrien Morel',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    lastMessage: 'Can\'t wait to see your next set 🔥',
    timestamp: '8h',
    unreadCount: 4,
    isOnline: true,
    tags: ['Top Fan'],
  },
  {
    id: '9',
    name: 'Julie Caron',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    lastMessage: 'Thanks for your quick response 😊',
    timestamp: '10h',
    unreadCount: 0,
    isOnline: false,
    tags: ['VIP'],
  },
  {
    id: '10',
    name: 'Sarah Robin',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
    lastMessage: 'Can you post more on weekends?',
    timestamp: '12h',
    unreadCount: 1,
    isOnline: false,
    tags: [],
  },
  {
    id: '11',
    name: 'Léna Garnier',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    lastMessage: 'J’adore tes vidéos backstage 🎬',
    timestamp: '1j',
    unreadCount: 0,
    isOnline: true,
    tags: ['Loyal', 'Top Fan'],
  },
  {
    id: '12',
    name: 'Mélanie Renault',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    lastMessage: 'Thanks for the personal content 💌',
    timestamp: '1d',
    unreadCount: 3,
    isOnline: false,
    tags: ['VIP'],
  },
  {
    id: '13',
    name: 'Clara Marchand',
    avatarUrl: 'https://i.pravatar.cc/150?img=13',
    lastMessage: 'Can we schedule a live soon?',
    timestamp: '2d',
    unreadCount: 0,
    isOnline: false,
    tags: ['New'],
  },
  {
    id: '14',
    name: 'Paul Chevalier',
    avatarUrl: 'https://i.pravatar.cc/150?img=14',
    lastMessage: 'I recommend your account to my friends 😄',
    timestamp: '2d',
    unreadCount: 0,
    isOnline: true,
    tags: ['Ambassador'],
  },
  {
    id: '15',
    name: 'Anna Blanchard',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    lastMessage: 'Your responses are always super fast 🙏',
    timestamp: '3d',
    unreadCount: 0,
    isOnline: false,
    tags: ['Loyal'],
  },
];

// Mock fan context data
const mockFanContext = {
  '1': {
    fanId: '1',
    name: 'Sophie Martin',
    avatar: 'https://i.pravatar.cc/150?img=1',
    status: 'vip' as const,
    joinDate: new Date('2023-06-15'),
    lastActive: new Date(),
    totalSpent: 450.00,
    subscriptionTier: 'Premium',
    notes: [
      {
        id: 'n1',
        content: 'Very engaged fan, loves exclusive content',
        createdAt: new Date('2024-01-10'),
        author: 'Me',
        category: 'engagement' as const,
      },
      {
        id: 'n2',
        content: 'Requested personalized content',
        createdAt: new Date('2024-01-15'),
        author: 'Me',
        category: 'demandes' as const,
      },
    ],
    tags: [
      { id: 't1', label: 'VIP', color: 'warning' as const },
      { id: 't2', label: 'Loyal', color: 'primary' as const },
      { id: 't3', label: 'Top Fan', color: 'success' as const },
    ],
  },
  '2': {
    fanId: '2',
    name: 'Lucas Dubois',
    avatar: 'https://i.pravatar.cc/150?img=2',
    status: 'active' as const,
    joinDate: new Date('2024-01-20'),
    lastActive: new Date(Date.now() - 900000),
    totalSpent: 89.99,
    subscriptionTier: 'Standard',
    notes: [
      {
        id: 'n3',
        content: 'New fan, very interested',
        createdAt: new Date('2024-01-20'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't3', label: 'New', color: 'success' as const },
      { id: 't4', label: 'Active', color: 'info' as const },
    ],
  },
  '3': {
    fanId: '3',
    name: 'Emma Bernard',
    avatar: 'https://i.pravatar.cc/150?img=3',
    status: 'vip' as const,
    joinDate: new Date('2023-08-10'),
    lastActive: new Date(),
    totalSpent: 780.50,
    subscriptionTier: 'Premium Plus',
    notes: [
      {
        id: 'n4',
        content: 'Top fan, always positive',
        createdAt: new Date('2023-12-01'),
        author: 'Me',
        category: 'engagement' as const,
      },
      {
        id: 'n5',
        content: 'Loves lifestyle photos',
        createdAt: new Date('2024-01-05'),
        author: 'Me',
        category: 'demandes' as const,
      },
      {
        id: 'n6',
        content: 'Recommended my content to others',
        createdAt: new Date('2024-01-18'),
        author: 'Me',
        category: 'risques' as const,
      },
    ],
    tags: [
      { id: 't5', label: 'VIP', color: 'warning' as const },
      { id: 't6', label: 'Top Fan', color: 'danger' as const },
      { id: 't7', label: 'Ambassador', color: 'success' as const },
    ],
  },
  '4': {
    fanId: '4',
    name: 'Thomas Petit',
    avatar: 'https://i.pravatar.cc/150?img=4',
    status: 'active' as const,
    joinDate: new Date('2023-09-01'),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    totalSpent: 120.0,
    subscriptionTier: 'Standard',
    notes: [
      {
        id: 'n7',
        content: 'Interested in more photo content',
        createdAt: new Date('2024-02-01'),
        author: 'Me',
        category: 'demandes' as const,
      },
    ],
    tags: [
      { id: 't8', label: 'Active', color: 'info' as const },
    ],
  },
  '5': {
    fanId: '5',
    name: 'Chloé Moreau',
    avatar: 'https://i.pravatar.cc/150?img=5',
    status: 'vip' as const,
    joinDate: new Date('2023-11-20'),
    lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000),
    totalSpent: 320.5,
    subscriptionTier: 'Premium',
    notes: [
      {
        id: 'n8',
        content: 'Always present on new posts',
        createdAt: new Date('2024-01-25'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't9', label: 'Loyal', color: 'primary' as const },
    ],
  },
  '6': {
    fanId: '6',
    name: 'Nina Lefèvre',
    avatar: 'https://i.pravatar.cc/150?img=6',
    status: 'active' as const,
    joinDate: new Date('2024-02-10'),
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
    totalSpent: 45.0,
    subscriptionTier: 'Standard',
    notes: [],
    tags: [
      { id: 't10', label: 'New', color: 'success' as const },
    ],
  },
  '7': {
    fanId: '7',
    name: 'Camille Laurent',
    avatar: 'https://i.pravatar.cc/150?img=7',
    status: 'active' as const,
    joinDate: new Date('2023-10-05'),
    lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000),
    totalSpent: 210.0,
    subscriptionTier: 'Standard',
    notes: [
      {
        id: 'n9',
        content: 'Reacts a lot to stories',
        createdAt: new Date('2024-01-30'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't11', label: 'Loyal', color: 'primary' as const },
    ],
  },
  '8': {
    fanId: '8',
    name: 'Adrien Morel',
    avatar: 'https://i.pravatar.cc/150?img=8',
    status: 'vip' as const,
    joinDate: new Date('2023-05-18'),
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000),
    totalSpent: 980.9,
    subscriptionTier: 'Premium Plus',
    notes: [
      {
        id: 'n10',
        content: 'Often buys bundles',
        createdAt: new Date('2023-11-10'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't12', label: 'Top Fan', color: 'danger' as const },
    ],
  },
  '9': {
    fanId: '9',
    name: 'Julie Caron',
    avatar: 'https://i.pravatar.cc/150?img=9',
    status: 'active' as const,
    joinDate: new Date('2024-03-01'),
    lastActive: new Date(Date.now() - 10 * 60 * 60 * 1000),
    totalSpent: 60.0,
    subscriptionTier: 'Standard',
    notes: [],
    tags: [
      { id: 't13', label: 'VIP', color: 'warning' as const },
    ],
  },
  '10': {
    fanId: '10',
    name: 'Sarah Robin',
    avatar: 'https://i.pravatar.cc/150?img=10',
    status: 'inactive' as const,
    joinDate: new Date('2023-04-12'),
    lastActive: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    totalSpent: 150.0,
    subscriptionTier: 'Standard',
    notes: [
      {
        id: 'n11',
        content: 'Less active lately',
        createdAt: new Date('2024-01-15'),
        author: 'Me',
        category: 'risques' as const,
      },
    ],
    tags: [],
  },
  '11': {
    fanId: '11',
    name: 'Léna Garnier',
    avatar: 'https://i.pravatar.cc/150?img=11',
    status: 'vip' as const,
    joinDate: new Date('2023-07-22'),
    lastActive: new Date(),
    totalSpent: 650.0,
    subscriptionTier: 'Premium',
    notes: [
      {
        id: 'n12',
        content: 'Very engaged with backstage videos',
        createdAt: new Date('2024-02-05'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't14', label: 'Top Fan', color: 'success' as const },
    ],
  },
  '12': {
    fanId: '12',
    name: 'Mélanie Renault',
    avatar: 'https://i.pravatar.cc/150?img=12',
    status: 'vip' as const,
    joinDate: new Date('2023-09-14'),
    lastActive: new Date(Date.now() - 12 * 60 * 60 * 1000),
    totalSpent: 540.0,
    subscriptionTier: 'Premium',
    notes: [
      {
        id: 'n13',
        content: 'Particularly appreciates personalized content',
        createdAt: new Date('2024-02-08'),
        author: 'Me',
        category: 'demandes' as const,
      },
    ],
    tags: [
      { id: 't15', label: 'VIP', color: 'warning' as const },
    ],
  },
  '13': {
    fanId: '13',
    name: 'Clara Marchand',
    avatar: 'https://i.pravatar.cc/150?img=13',
    status: 'active' as const,
    joinDate: new Date('2024-01-05'),
    lastActive: new Date(Date.now() - 18 * 60 * 60 * 1000),
    totalSpent: 70.0,
    subscriptionTier: 'Standard',
    notes: [],
    tags: [
      { id: 't16', label: 'New', color: 'success' as const },
    ],
  },
  '14': {
    fanId: '14',
    name: 'Paul Chevalier',
    avatar: 'https://i.pravatar.cc/150?img=14',
    status: 'active' as const,
    joinDate: new Date('2023-06-02'),
    lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000),
    totalSpent: 300.0,
    subscriptionTier: 'Standard',
    notes: [
      {
        id: 'n14',
        content: 'Often recommends the account',
        createdAt: new Date('2024-02-02'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't17', label: 'Ambassador', color: 'success' as const },
    ],
  },
  '15': {
    fanId: '15',
    name: 'Anna Blanchard',
    avatar: 'https://i.pravatar.cc/150?img=15',
    status: 'active' as const,
    joinDate: new Date('2023-12-10'),
    lastActive: new Date(Date.now() - 22 * 60 * 60 * 1000),
    totalSpent: 95.0,
    subscriptionTier: 'Standard',
    notes: [
      {
        id: 'n15',
        content: 'Appreciates quick responses',
        createdAt: new Date('2024-02-10'),
        author: 'Me',
        category: 'engagement' as const,
      },
    ],
    tags: [
      { id: 't18', label: 'Loyal', color: 'primary' as const },
    ],
  },
};

// Helpers to generate long mock conversations with multiple days & groupings
const fanMessageTemplates = [
  "Hi! I just discovered your content 🌟",
  "I love your style, it's exactly what I was looking for 😍",
  "Are you posting new content soon?",
  "Can you send more photos?",
  "Thanks for your response, it makes me so happy 😊",
  "Could you do a live this weekend?",
  "Your last post is incredible 🔥",
  "I want a bit more personalized content 🙏",
  "I just subscribed to your OnlyFans ✨",
  "Your stories are really great 🙌",
];

const creatorMessageTemplates = [
  "Thank you so much for your support, it means a lot 💕",
  "I'm actually preparing new content coming soon 🎉",
  "Tell me what you'd like to see as a priority 🙂",
  "We can plan a live this weekend, good idea 😉",
  "Thanks for your message, it motivates me even more 🙏",
  "I'm noting your request, thanks for the inspiration!",
  "Stay tuned, there's a big surprise coming 😏",
  "I can prepare something more personalized for you 💌",
];

function generateMockMessagesForConversation(
  fanId: string,
  fanName: string,
  fanAvatar: string,
  count: number,
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  // Start a few days ago to force multiple date separators
  let currentTime = Date.now() - 5 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    // Pattern to create sequences: 3 fan messages, 2 creator, 1 fan, etc.
    const pattern = i % 6;
    const fromFan = pattern === 0 || pattern === 1 || pattern === 2 || pattern === 5;

    const sender = fromFan
      ? {
          id: fanId,
          name: fanName,
          avatar: fanAvatar,
          type: 'fan' as const,
        }
      : {
          id: 'creator',
          name: 'Creator',
          avatar: 'https://i.pravatar.cc/150?img=10',
          type: 'creator' as const,
        };

    const content = fromFan
      ? fanMessageTemplates[i % fanMessageTemplates.length]
      : creatorMessageTemplates[i % creatorMessageTemplates.length];

    const statusPool: ChatMessage['status'][] = ['sent', 'delivered', 'read'];
    const status = statusPool[i % statusPool.length];

    messages.push({
      id: `${fanId}_m_${i}`,
      content,
      timestamp: new Date(currentTime),
      sender,
      status,
    });

    // Advance time for next message
    const minutesStep = 3 + (i % 5); // entre 3 et 7 minutes
    currentTime += minutesStep * 60 * 1000;

    // Every ~25 messages, skip a day to force multiple days
    if (i > 0 && i % 25 === 0) {
      currentTime += 12 * 60 * 60 * 1000;
    }
  }

  return messages;
}

function generateOlderMockMessagesForConversation(
  fanId: string,
  fanName: string,
  fanAvatar: string,
  count: number,
  beforeTimestampMs: number,
  page: number,
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  let currentTime = beforeTimestampMs - 3 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const pattern = (page * 1000 + i) % 6;
    const fromFan = pattern === 0 || pattern === 1 || pattern === 2 || pattern === 5;

    const sender = fromFan
      ? {
          id: fanId,
          name: fanName,
          avatar: fanAvatar,
          type: 'fan' as const,
        }
      : {
          id: 'creator',
          name: 'Creator',
          avatar: 'https://i.pravatar.cc/150?img=10',
          type: 'creator' as const,
        };

    const content = fromFan
      ? fanMessageTemplates[(page + i) % fanMessageTemplates.length]
      : creatorMessageTemplates[(page + i) % creatorMessageTemplates.length];

    const statusPool: ChatMessage['status'][] = ['sent', 'delivered', 'read'];
    const status = statusPool[(page + i) % statusPool.length];

    messages.push({
      id: `${fanId}_m_old_${page}_${i}`,
      content,
      timestamp: new Date(currentTime),
      sender,
      status,
    });

    const minutesStep = 3 + ((page + i) % 5);
    currentTime -= minutesStep * 60 * 1000;

    if (i > 0 && i % 25 === 0) {
      currentTime -= 12 * 60 * 60 * 1000;
    }
  }

  return messages.reverse();
}

// Mock messages for demonstration - enough to force internal scroll (not page scroll)
const MOCK_INITIAL_MESSAGES_PER_CONVERSATION = 48;
const MOCK_LOAD_MORE_BATCH_SIZE = 32;
const MOCK_LOAD_MORE_MAX_PAGES = 6;

const mockMessages: Record<string, ChatMessage[]> = mockConversations.reduce(
  (acc, conversation) => {
    acc[conversation.id] = generateMockMessagesForConversation(
      conversation.id,
      conversation.name,
      conversation.avatarUrl || '',
      MOCK_INITIAL_MESSAGES_PER_CONVERSATION,
    );
    return acc;
  },
  {} as Record<string, ChatMessage[]>,
);

interface MessagingInterfaceProps {
  className?: string;
}

/**
 * MessagingInterface - Three-column layout for messages
 * 
 * Layout structure:
 * - Left column (25%): Fan/conversation list
 * - Center column (45-50%): Active chat/messages
 * - Right column (25-30%): Fan context panel
 * 
 * Responsive behavior:
 * - Desktop (>1024px): Three columns
 * - Tablet (768-1024px): Two columns (list + chat OR chat + context)
 * - Mobile (<768px): Single column with navigation
 * 
 * Keyboard Navigation:
 * - Tab: Navigate through interactive elements in logical order
 * - Ctrl/Cmd+K: Focus search input
 * - Escape: Clear selection on mobile
 * - Enter: Select conversation or send message
 * - Shift+Enter: New line in message input
 */
// Mobile view states
type MobileView = 'list' | 'chat' | 'notes';

export function MessagingInterface({ 
  className = '',
}: MessagingInterfaceProps) {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');

  const [selectedConversation, setSelectedConversation] = useState<string | null>(() => {
    if (
      requestedConversationId &&
      mockConversations.some((conversation) => conversation.id === requestedConversationId)
    ) {
      return requestedConversationId;
    }

    return '1';
  });
  const [showContext, setShowContext] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const loadPageByConversationRef = useRef<Record<string, number>>({});
  const [isLoadingMoreByConversation, setIsLoadingMoreByConversation] = useState<Record<string, boolean>>({});
  const [hasMoreByConversation, setHasMoreByConversation] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const conversation of mockConversations) {
      initial[conversation.id] = true;
    }
    return initial;
  });

  // Refs for focus management
  const fanListRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const contextPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestedConversationId) return;
    if (!mockConversations.some((conversation) => conversation.id === requestedConversationId)) return;

    setSelectedConversation(requestedConversationId);
  }, [requestedConversationId]);

  // Get current fan context
  const currentFanContext = selectedConversation 
    ? mockFanContext[selectedConversation as keyof typeof mockFanContext] || null
    : null;

  // Build grid class names based on state
  const gridClasses = [
    'messaging-grid',
    selectedConversation && 'conversation-selected',
    showContext && 'show-context',
    `mobile-view-${mobileView}`,
  ].filter(Boolean).join(' ');

  // Handle mobile conversation selection - go to chat view
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversation(conversationId);
    setMobileView('chat');
  }, []);

  // Handle mobile back to list
  const handleBackToList = useCallback(() => {
    setMobileView('list');
  }, []);

  // Handle show notes - mobile: change view, desktop: toggle context panel
  const handleShowNotes = useCallback(() => {
    // Check if we're on mobile (< 768px)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    if (isMobile) {
      setMobileView('notes');
    } else {
      // On desktop, toggle the context panel (column 3)
      setShowContext(prev => !prev);
    }
  }, []);

  // Handle mobile back to chat from notes
  const handleBackToChat = useCallback(() => {
    setMobileView('chat');
  }, []);

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = fanListRef.current?.querySelector<HTMLInputElement>('[type="search"]');
        searchInput?.focus();
      }
      
      // Escape: Clear selection on mobile
      if (e.key === 'Escape') {
        if (window.innerWidth < 768) {
          setSelectedConversation(null);
          setShowContext(false);
        }
      }

      // Tab navigation: Move focus through logical order
      // This is handled by browser's default tab behavior with proper tabIndex
      // but we can enhance it if needed
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!selectedConversation) return;

    const conversationId = selectedConversation;
    if (isLoadingMoreByConversation[conversationId]) return;
    if (hasMoreByConversation[conversationId] === false) return;

    setIsLoadingMoreByConversation(prev => ({ ...prev, [conversationId]: true }));

    const fan = mockConversations.find(c => c.id === conversationId);
    const fanName = fan?.name ?? 'Fan';
    const fanAvatar = fan?.avatarUrl ?? '';
    const nextPage = (loadPageByConversationRef.current[conversationId] ?? 0) + 1;
    loadPageByConversationRef.current[conversationId] = nextPage;

    try {
      await new Promise(resolve => setTimeout(resolve, 350));

      setMessages(prev => {
        const existing = prev[conversationId] || [];
        const earliestTime = existing.reduce((min, msg) => {
          const ts = typeof msg.timestamp === 'string'
            ? new Date(msg.timestamp).getTime()
            : msg.timestamp.getTime();
          return Math.min(min, ts);
        }, Date.now());

        const olderMessages = generateOlderMockMessagesForConversation(
          conversationId,
          fanName,
          fanAvatar,
          MOCK_LOAD_MORE_BATCH_SIZE,
          earliestTime,
          nextPage,
        );

        return {
          ...prev,
          [conversationId]: [...olderMessages, ...existing],
        };
      });

      if (nextPage >= MOCK_LOAD_MORE_MAX_PAGES) {
        setHasMoreByConversation(prev => ({ ...prev, [conversationId]: false }));
      }
    } finally {
      setIsLoadingMoreByConversation(prev => ({ ...prev, [conversationId]: false }));
    }
  }, [hasMoreByConversation, isLoadingMoreByConversation, selectedConversation]);

  const handleSendMessage = useCallback((content: string) => {
    if (!selectedConversation) return;

    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      content,
      timestamp: new Date(),
      sender: {
        id: 'creator',
        name: 'Creator',
        avatar: 'https://i.pravatar.cc/150?img=10',
        type: 'creator',
      },
      status: 'sending',
    };

    // Add message optimistically
    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [
        ...(prev[selectedConversation] || []),
        newMessage,
      ],
    }));

    // Simulate sending delay
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedConversation]: prev[selectedConversation].map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
        ),
      }));
    }, 500);

    // Simulate fan typing response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Add mock fan response
        const fanResponse: ChatMessage = {
          id: `m${Date.now()}-response`,
          content: 'Thanks for your response! 😊',
          timestamp: new Date(),
          sender: {
            id: selectedConversation,
            name: mockConversations.find(c => c.id === selectedConversation)?.name || 'Fan',
            avatar: mockConversations.find(c => c.id === selectedConversation)?.avatarUrl || '',
            type: 'fan',
          },
          status: 'delivered',
        };
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: [
            ...(prev[selectedConversation] || []),
            fanResponse,
          ],
        }));
      }, 2000);
    }, 1000);
  }, [selectedConversation, mockConversations]);

  const handleAttachFile = useCallback(() => {
    // TODO: Implement file attachment
  }, []);

  const selectedFan = mockConversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const isLoadingMore = selectedConversation
    ? Boolean(isLoadingMoreByConversation[selectedConversation])
    : false;
  const hasMore = selectedConversation
    ? hasMoreByConversation[selectedConversation] !== false
    : true;

  const handleAddNote = useCallback(() => {
    // TODO: Implement add note modal
  }, []);

  const handleRemoveTag = useCallback((tagId: string) => {
    // TODO: Implement tag removal API call
    // For now, just show a confirmation
    if (confirm('Are you sure you want to remove this tag?')) {
      void tagId;
      // In production, call API: await fetch(`/api/fans/${fanId}/tags/${tagId}`, { method: 'DELETE' })
    }
  }, []);

  return (
    <div 
      className={`messaging-interface ${className}`}
      role="main"
      aria-label="Messaging interface"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* Three-column grid layout - Header removed for full height */}
      <div 
        className={gridClasses}
        role="region"
        aria-label="Messaging workspace"
        style={{ display: 'grid', flex: '1 1 auto', minHeight: 0 }}
      >
        {/* Left Column: Fan List */}
        <aside 
          ref={fanListRef}
          className="messaging-column messaging-column--left"
          data-column="fan-list"
          role="complementary"
          aria-label="Conversations list"
          tabIndex={-1}
        >
          <TailAdminCard
            padding="none"
            className="flex-1 min-h-0 overflow-hidden messaging-interface__fan-list-card"
          >
            <FanList
              conversations={mockConversations}
              activeConversationId={selectedConversation || undefined}
              onConversationSelect={handleConversationSelect}
            />
          </TailAdminCard>
        </aside>

        {/* Center Column: Chat Container */}
        <main 
          className="messaging-column messaging-column--center"
          data-column="chat"
          role="main"
          aria-label="Active conversation"
          tabIndex={-1}
        >
          {/* Mobile navigation header - iMessage style */}
          <div className="mobile-chat-header">
            <div className="mobile-chat-header-inner">
              <button 
                className="mobile-nav-btn mobile-nav-btn--back"
                onClick={handleBackToList}
                aria-label="Back to conversations"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {selectedFan && (
                <>
                  <img 
                    src={selectedFan.avatarUrl || ''} 
                    alt={selectedFan.name}
                    className="mobile-header-avatar"
                  />
                  <div className="mobile-header-info">
                    <div className="mobile-header-name">{selectedFan.name}</div>
                    <div className="mobile-header-status">
                      {selectedFan.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </>
              )}
              
              <button 
                className="mobile-nav-btn mobile-nav-btn--notes"
                onClick={handleShowNotes}
                aria-label="View fan notes"
              >
                Notes
              </button>
            </div>
          </div>
          <TailAdminCard padding="none" className="flex-1 min-h-0 overflow-hidden">
            {selectedConversation && selectedFan ? (
              <ChatContainer
                conversationId={selectedConversation}
                fanName={selectedFan.name}
                fanAvatar={selectedFan.avatarUrl || ''}
                fanStatus={selectedFan.isOnline ? 'Online' : 'Offline'}
                messages={currentMessages}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                onAttachFile={handleAttachFile}
                onLoadMore={handleLoadMore}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onToggleNotes={handleShowNotes}
                showNotes={showContext}
              />
            ) : (
              <div 
                className="flex flex-col items-center justify-center h-full text-gray-500 p-8"
                role="status"
                aria-live="polite"
              >
                <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </TailAdminCard>
        </main>

        {/* Right Column: Context Panel */}
        <aside 
          ref={contextPanelRef}
          className="messaging-column messaging-column--right"
          data-column="context"
          role="complementary"
          aria-label="Fan context and information"
          tabIndex={-1}
        >
          {/* Mobile navigation header for notes */}
          <div className="mobile-notes-header">
            <button 
              className="mobile-nav-btn mobile-nav-btn--back"
              onClick={handleBackToChat}
              aria-label="Back to chat"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back</span>
            </button>
            <span className="mobile-notes-title">
              {selectedFan ? `${selectedFan.name}` : 'Fan Notes'}
            </span>
          </div>
          <ContextPanel
            fanContext={currentFanContext}
            onAddNote={handleAddNote}
            onRemoveTag={handleRemoveTag}
          />
        </aside>
      </div>

      {/* Mobile navigation controls - hidden, using inline buttons now */}
      <div 
        className="messaging-mobile-nav messaging-mobile-nav--hidden"
        role="navigation"
        aria-label="Mobile view controls"
        aria-hidden="true"
      >
        {/* Legacy toggle - kept for backwards compatibility */}
      </div>
    </div>
  );
}
