'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Gift } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  description: string;
  benefit: string;
  color: string;
}

const additionalPlatforms: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Photos, videos, and stories',
    benefit: 'Unlock visual content tools',
    color: 'bg-gradient-to-br from-purple-600 to-pink-600'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Community discussions',
    benefit: 'Access community engagement features',
    color: 'bg-orange-600'
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    description: 'Exclusive content for subscribers',
    benefit: 'Enable CRM and messaging tools',
    color: 'bg-blue-500'
  }
];

interface AdditionalPlatformsProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function AdditionalPlatforms({ onComplete, onSkip }: AdditionalPlatformsProps) {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      const res = await fetch('/api/onboarding/connect-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, action: 'connect' })
      });

      if (!res.ok) throw new Error(`Failed to initialize connection (${res.status})`);
      const data = await res.json();
      const target = data?.authUrl || (platformId === 'onlyfans' ? '/of-connect' : `/api/auth/${platformId}`);
      window.location.href = target;
    } catch (error) {
      console.error('Failed to connect platform:', error);
      setConnecting(null);
    }
  };

  const handleContinue = () => {
    if (connectedPlatforms.length > 0) {
      onComplete();
    } else {
      onSkip();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect more platforms
        </h2>
        <p className="text-gray-600">
          Add more accounts to unlock additional features and expand your reach
        </p>
      </div>

      {/* Benefits Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Gift className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Unlock More Features
            </h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ Cross-platform scheduling</li>
              <li>✓ Unified analytics dashboard</li>
              <li>✓ Advanced automation tools</li>
              <li>✓ Multi-platform content optimization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 gap-4">
        {additionalPlatforms.map(platform => {
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold text-xl`}>
                    {platform.name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {platform.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {platform.description}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      {platform.benefit}
                    </p>
                  </div>
                </div>
                
                {isConnected ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    Connected
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
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
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {connectedPlatforms.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            <strong>Awesome!</strong> You've connected {connectedPlatforms.length} additional platform{connectedPlatforms.length > 1 ? 's' : ''}.
            {connectedPlatforms.length >= 2 && ' You now have access to advanced cross-platform features!'}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Skip for Now
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {connectedPlatforms.length > 0 ? 'Continue' : 'Skip & Continue'}
        </button>
      </div>

      <p className="text-xs text-center text-gray-500">
        You can always connect more platforms later from your settings
      </p>
    </div>
  );
}
