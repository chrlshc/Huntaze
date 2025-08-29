'use client';

import { useState } from 'react';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import { platformsApi } from '@/src/lib/api';

export default function ConnectPlatformsPage() {
  const [ofUsername, setOfUsername] = useState('');
  const [ofApiKey, setOfApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleOFConnect = async () => {
    setError('');
    setNotice('');
    try {
      setLoading(true);
      if (!ofUsername || !ofApiKey) {
        setNotice('No credentials provided — you can connect later.');
        return;
      }
      await platformsApi.connectOnlyFans({ username: ofUsername, apiKey: ofApiKey });
      setNotice('OnlyFans connected!');
    } catch (e) {
      setError('Failed to connect. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</Link>
            <div className="flex items-center gap-2 text-gray-700">
              <Link2 className="w-5 h-5" />
              <span className="font-medium">Connect Platforms</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Link your accounts</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* OnlyFans card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">OnlyFans</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Connect OnlyFans to automate DMs and sync earnings.
            </p>
            <div className="grid gap-3 mb-4">
              <input
                className="p-3 border border-gray-300 rounded-lg bg-white"
                placeholder="Username (optional)"
                value={ofUsername}
                onChange={(e) => setOfUsername(e.target.value)}
              />
              <input
                className="p-3 border border-gray-300 rounded-lg bg-white"
                placeholder="API Key (optional)"
                value={ofApiKey}
                onChange={(e) => setOfApiKey(e.target.value)}
              />
            </div>
            {notice && <p className="text-green-600 text-sm mb-2">{notice}</p>}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="flex items-center gap-3">
              <button onClick={handleOFConnect} disabled={loading} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                {loading ? 'Connecting…' : 'Connect OnlyFans'}
              </button>
              <Link href="/onboarding" className="text-gray-500 hover:text-gray-700 text-sm">Skip for now</Link>
            </div>
          </div>

          {/* Fansly card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Fansly</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Fansly integration is optional — connect when ready.
            </p>
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Coming soon
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

