'use client';

import { useState } from 'react';
import { AlertCircle, Mail } from 'lucide-react';

export default function OnlyFansPlaceholder() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to waitlist
    await fetch('/api/waitlist/onlyfans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    setJoined(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <img src="/onlyfans-logo.svg" alt="OnlyFans" className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">OnlyFans Integration</h3>
          <p className="text-sm text-gray-600 mt-1">Coming Soon - Join the waitlist</p>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">API Access Pending</span>
            </div>
            <p className="text-sm text-blue-700">
              We\'re working with OnlyFans to get official API access. 
              Join our waitlist to be notified when it\'s available.
            </p>
          </div>
          
          {!joined ? (
            <form onSubmit={handleJoinWaitlist} className="mt-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                Notify Me
              </button>
            </form>
          ) : (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
              ✓ You\'re on the list! We\'ll email you at {email} when ready.
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            Expected: Q1 2025 • Priority for paid subscribers
          </div>
        </div>
      </div>
    </div>
  );
}