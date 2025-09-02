'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function ThreadsAuthPage() {
  const [showInfo, setShowInfo] = useState(false);
  
  const handleThreadsAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_THREADS_CLIENT_ID || process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI || 'https://huntaze.com/auth/threads/callback';
    const state = Math.random().toString(36).substring(7);
    
    // Save state for verification
    sessionStorage.setItem('threads_oauth_state', state);
    
    // Threads uses Instagram Basic Display API with additional scopes
    const authUrl = `https://api.instagram.com/oauth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'user_profile,user_media,threads_basic,threads_content_publish',
      response_type: 'code',
      state: state
    })}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" fill="white" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Connect Threads</h1>
          <p className="text-gray-600 mb-6">
            Link your Threads account to manage your content and engage with your community
          </p>
          
          <button
            onClick={handleThreadsAuth}
            className="w-full bg-black hover:bg-gray-900 text-white font-medium py-3 rounded-lg transition-colors mb-4"
          >
            Connect with Threads
          </button>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showInfo ? 'Hide' : 'Show'} requirements
          </button>
          
          {showInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm">
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Instagram Professional account</li>
                <li>• Threads account linked to Instagram</li>
                <li>• Business verification (for API access)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}