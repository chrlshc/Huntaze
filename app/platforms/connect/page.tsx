'use client';

import { useState } from 'react';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import { ofIntegrationApi } from '@/src/lib/api';
import ComplianceNotice from '@/components/compliance/ComplianceNotice';

const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '618116867842215';
const INSTAGRAM_REDIRECT_URI = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || 'https://huntaze.com/auth/instagram/callback';
const THREADS_APP_ID = process.env.NEXT_PUBLIC_THREADS_APP_ID || '';
const THREADS_REDIRECT_URI = process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI || 'https://huntaze.com/auth/threads/callback';

export default function ConnectPlatformsPage() {
  const [ofUsername, setOfUsername] = useState('');
  const [ofPassword, setOfPassword] = useState('');
  const [ofTotp, setOfTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const handleOFConnect = async () => {
    setError('');
    setNotice('');
    try {
      setLoading(true);
      if (!ofUsername || !ofPassword) {
        setError('Please enter your OnlyFans username and password');
        return;
      }
      await ofIntegrationApi.connect({ username: ofUsername, password: ofPassword, totp: ofTotp || undefined });
      setNotice('OnlyFans connected! Syncing your data...');
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
        <ComplianceNotice platform="OnlyFans" />
        
        {/* Instagram Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Instagram</h2>
          <p className="text-gray-600 mb-4">Connect your Instagram account to manage messages and content.</p>
          <a
            href={`https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Connect Instagram
          </a>
        </div>
        
        {/* Threads Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Threads</h2>
          <p className="text-gray-600 mb-4">Connect your Threads account through Instagram to publish and engage with your audience.</p>
          <p className="text-sm text-gray-500 mb-4">Note: Threads access requires an Instagram Business or Creator account.</p>
          <button
            disabled
            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Connect via Instagram first
          </button>
        </div>
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
            <p className="text-sm text-gray-600 mb-4">Connect OnlyFans to sync earnings, subscribers, and messages.</p>
            <div className="grid gap-3 mb-4">
              <input
                className="p-3 border border-gray-300 rounded-lg bg-white"
                placeholder="OnlyFans Username"
                value={ofUsername}
                onChange={(e) => setOfUsername(e.target.value)}
              />
              <input
                type="password"
                className="p-3 border border-gray-300 rounded-lg bg-white"
                placeholder="OnlyFans Password"
                value={ofPassword}
                onChange={(e) => setOfPassword(e.target.value)}
              />
              <input
                className="p-3 border border-gray-300 rounded-lg bg-white"
                placeholder="2FA Code (if enabled)"
                value={ofTotp}
                onChange={(e) => setOfTotp(e.target.value)}
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
          {/* Reddit card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Reddit</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Connect Reddit to import your communities and manage content.
            </p>
            <Link href="/auth/reddit">
              <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                Connect Reddit
              </button>
            </Link>
          </div>

          {/* TikTok card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-red-500 text-white">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">TikTok</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Connect TikTok to track your content performance and fan engagement.
            </p>
            <Link href="/auth/tiktok">
              <button className="px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-lg font-medium transition-colors">
                Connect TikTok
              </button>
            </Link>
          </div>

          {/* Threads card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-gray-900 text-white">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Threads</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Connect Threads to share updates and engage with your community.
            </p>
            <Link href="/auth/threads">
              <button className="px-6 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition-colors">
                Connect Threads
              </button>
            </Link>
          </div>

          {/* Instagram card - Disabled */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-pink-50 text-pink-600">
                <Link2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Instagram</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Instagram integration pending Meta verification.
            </p>
            <button disabled className="px-6 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed text-sm">
              Verification required
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
