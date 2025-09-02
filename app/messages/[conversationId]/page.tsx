'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-semibold text-gray-900">
            Conversation {conversationId}
          </h1>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">This conversation view is temporarily unavailable.</p>
          <button 
            onClick={() => router.push('/messages')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Return to messages
          </button>
        </div>
      </div>
    </div>
  );
}