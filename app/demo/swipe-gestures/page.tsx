'use client';

import { useState } from 'react';
import { SwipeableItem, SwipeableList } from '@/components/ui/SwipeableItem';

interface Message {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
}

export default function SwipeGesturesDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'Sarah Johnson',
      subject: 'Meeting Tomorrow',
      preview: 'Hi! Just confirming our meeting for tomorrow at 2 PM...',
      time: '10:30 AM',
      unread: true,
    },
    {
      id: 2,
      sender: 'Michael Chen',
      subject: 'Project Update',
      preview: 'The latest version is ready for review. Please check...',
      time: '9:15 AM',
      unread: true,
    },
    {
      id: 3,
      sender: 'Emma Williams',
      subject: 'Quick Question',
      preview: 'Do you have a moment to discuss the new feature?',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: 4,
      sender: 'James Rodriguez',
      subject: 'Feedback Request',
      preview: 'I would love to get your thoughts on the proposal...',
      time: 'Yesterday',
      unread: false,
    },
    {
      id: 5,
      sender: 'Olivia Martinez',
      subject: 'Team Lunch',
      preview: 'Are you available for team lunch this Friday?',
      time: '2 days ago',
      unread: false,
    },
  ]);

  const [archivedCount, setArchivedCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  const handleDelete = (id: number) => {
    setMessages(messages.filter((msg) => msg.id !== id));
    setDeletedCount(deletedCount + 1);
  };

  const handleArchive = (id: number) => {
    setMessages(messages.filter((msg) => msg.id !== id));
    setArchivedCount(archivedCount + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Swipe Gestures Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Swipe left to delete, swipe right to archive (mobile/touch devices)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {archivedCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Archived
            </div>
          </div>
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {deletedCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Deleted
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Inbox ({messages.length})
            </h2>
          </div>

          {messages.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">
                No messages in your inbox
              </p>
            </div>
          ) : (
            <SwipeableList>
              {messages.map((message) => (
                <SwipeableItem
                  key={message.id}
                  onDelete={() => handleDelete(message.id)}
                  onArchive={() => handleArchive(message.id)}
                  className="border-b border-gray-200 dark:border-[#2A2A2A] last:border-b-0"
                >
                  <div className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {message.sender}
                        </h3>
                        {message.unread && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.time}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {message.subject}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {message.preview}
                    </p>
                  </div>
                </SwipeableItem>
              ))}
            </SwipeableList>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            How to Use Swipe Gestures
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              <div>
                <strong>Swipe Left:</strong> Reveals delete action (red background)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              <div>
                <strong>Swipe Right:</strong> Reveals archive action (blue background)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <strong>Threshold:</strong> Swipe at least 50px to trigger the action
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Technical Implementation
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Library:</strong> react-swipeable for touch gesture handling
            </p>
            <p>
              <strong>Delta Threshold:</strong> 50px minimum swipe distance
            </p>
            <p>
              <strong>Track Touch:</strong> Enabled for mobile devices
            </p>
            <p>
              <strong>Track Mouse:</strong> Disabled (touch-only)
            </p>
            <p>
              <strong>Visual Feedback:</strong> Background color reveals during swipe
            </p>
            <p>
              <strong>Confirmation:</strong> Action triggers only after threshold is met
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
