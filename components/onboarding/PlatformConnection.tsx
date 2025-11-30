'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

const platforms: Platform[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Share short-form videos',
    icon: '/icons/tiktok.svg',
    color: 'bg-black',
    available: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Photos, videos, and stories',
    icon: '/icons/instagram.svg',
    color: 'bg-gradient-to-br from-purple-600 to-pink-600',
    available: true
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Community discussions',
    icon: '/icons/reddit.svg',
    color: 'bg-orange-600',
    available: true
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    description: 'Exclusive content for subscribers',
    icon: '/icons/onlyfans.svg',
    color: 'bg-blue-500',
    available: true
  }
];

interface PlatformConnectionProps {
  onComplete: () => void;
  isFirst?: boolean;
}

export function PlatformConnection({ onComplete, isFirst = false }: PlatformConnectionProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      // Ask backend for the correct auth URL (centralized mapping)
      const res = await fetch('/api/onboarding/connect-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, action: 'connect' })
      });

      if (!res.ok) throw new Error(`Failed to initialize connection (${res.status})`);
      const data = await res.json();

      const target = data?.authUrl ||
        (platformId === 'onlyfans' ? '/of-connect' : `/api/auth/${platformId}`);

      window.location.href = target;
    } catch (error) {
      console.error('Failed to connect platform:', error);
      setConnecting(null);
    }
  };

  const handleContinue = () => {
    if (connectedPlatforms.length > 0 || !isFirst) {
      onComplete();
    }
  };

  const canContinue = isFirst ? connectedPlatforms.length > 0 : true;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isFirst ? 'Connect your first platform' : 'Connect more platforms'}
        </h2>
        <p className="text-gray-600">
          {isFirst 
            ? 'Link your social media account to start creating content'
            : 'Add more platforms to expand your reach'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map(platform => {
          const isConnected = connectedPlatforms.includes(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <div
              key={platform.id}
              className={`p-6 rounded-lg border-2 transition-all ${
                isConnected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold text-xl`}>
                  {platform.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {platform.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {platform.description}
                  </p>
                  
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </div>
                  ) : (
                    <Button 
                      variant="primary" 
                      onClick={() => handleConnect(platform.id)}
                      disabled={!platform.available || isConnecting}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                        platform.available
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Connect
                        </>
                      )}
</Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isFirst && connectedPlatforms.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> You need to connect at least one platform to continue.
          </p>
        </div>
      )}

      {connectedPlatforms.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            <strong>Great!</strong> You've connected {connectedPlatforms.length} platform{connectedPlatforms.length > 1 ? 's' : ''}.
            {connectedPlatforms.length >= 2 && ' You\'ve unlocked cross-platform scheduling!'}
          </p>
        </div>
      )}

      <Button variant="primary" onClick={handleContinue} disabled={!canContinue}>
  Continue
</Button>
    </div>
  );
}
