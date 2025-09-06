'use client';

import { useState } from 'react';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import ComplianceNotice from '@/components/compliance/ComplianceNotice';
import { OnlyFansLogoIcon, InstagramLogoIcon, TikTokLogoIcon, RedditLogoIcon, ThreadsLogoIcon } from '@/src/components/platform-icons';

const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '618116867842215';
const INSTAGRAM_REDIRECT_URI = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || 'https://huntaze.com/auth/instagram/callback';
const THREADS_APP_ID = process.env.NEXT_PUBLIC_THREADS_APP_ID || '';
const THREADS_REDIRECT_URI = process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI || 'https://huntaze.com/auth/threads/callback';

export default function ConnectPlatformsPage() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const joinOFWaitlist = async () => {
    try {
      setLoading(true);
      setError('');
      setNotice('');
      const resp = await fetch('/api/waitlist/onlyfans', { method: 'POST' });
      if (!resp.ok) throw new Error('Failed to join waitlist');
      setNotice('Joined the OnlyFans API waitlist. We will notify you.');
    } catch (e: any) {
      setError(e.message || 'Failed to join waitlist');
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
        
        {/* Instagram Section — drives traffic to OnlyFans */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <InstagramLogoIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Instagram</h2>
          </div>
          <p className="text-gray-600 mb-4">Connect Instagram to drive traffic to your OnlyFans (bio links, stories, best‑practice CTAs).</p>
          <a
            href={`https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Connect Instagram
          </a>
        </div>
        
        {/* Threads Section — top of funnel to OnlyFans */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ThreadsLogoIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Threads</h2>
          </div>
          <p className="text-gray-600 mb-4">Use Threads to create conversation and funnel traffic to your OnlyFans.</p>
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
              <OnlyFansLogoIcon className="w-6 h-6" />
              <h3 className="text-lg font-semibold">OnlyFans</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Read‑only via CSV import for performance analytics. No password required.</p>
            {notice && <p className="text-green-600 text-sm mb-2">{notice}</p>}
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/platforms/import/onlyfans">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">Import OF CSV</button>
              </Link>
              <button onClick={joinOFWaitlist} disabled={loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                {loading ? 'Joining…' : 'Join OF API Waitlist'}
              </button>
              <Link href="/onboarding" className="text-gray-500 hover:text-gray-700 text-sm">Skip for now</Link>
            </div>
          </div>

          {/* Fansly removed until support is ready */}
          {/* Reddit card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <RedditLogoIcon className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Reddit</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Connect Reddit to engage communities and drive traffic to your OnlyFans.</p>
            <Link href="/auth/reddit">
              <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                Connect Reddit
              </button>
            </Link>
          </div>

          {/* TikTok card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <TikTokLogoIcon className="w-6 h-6" />
              <h3 className="text-lg font-semibold">TikTok</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Use TikTok to generate awareness and drive traffic to your OnlyFans.</p>
            <Link href="/auth/tiktok">
              <button className="px-6 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition-colors">
                Connect TikTok
              </button>
            </Link>
          </div>

          {/* Threads card */}
          <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <ThreadsLogoIcon className="w-6 h-6" />
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
              <InstagramLogoIcon className="w-6 h-6" />
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
