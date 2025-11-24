/**
 * Creator Messages Page
 */

'use client';

import { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';

export default function CreatorMessagesPage() {
  const [messageText, setMessageText] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageCircle className="w-8 h-8 text-purple-600" />
          <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Message interface coming soon...</p>
          
          <div className="mt-6">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
            />
            <button
              className="mt-3 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
