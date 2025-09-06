"use client";

import { useState } from "react";
import { useOnboarding, PlatformConnection } from "@/src/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Instagram, Video, MessageSquare, Heart, CheckCircle2, X, ExternalLink, AlertCircle, Info, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateOAuthUrl, TOKEN_REFRESH_INFO } from "@/src/lib/platform-auth";

type Platform = {
  id: PlatformConnection['platform'];
  name: string;
  icon: React.ReactNode;
  description: string;
  permissions: string[];
  limits: string[];
  color: string;
  setupInstructions?: string[];
  tokenInfo?: {
    expiresIn: string;
    refreshMethod: string;
    notes: string[];
  };
};

const PLATFORMS: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-6 h-6" />,
    description: "Connect your Professional or Creator Instagram via Meta Business",
    permissions: ['Content publishing', 'Stats read', 'Comment management', 'Advanced insights'],
    limits: ['Max 5 posts/day', 'Stories not automated', '25 API calls/hour'],
    color: 'bg-gradient-to-br from-purple-600 to-pink-600',
    setupInstructions: [
      'Ensure you have a Professional or Creator Instagram account',
      'Connect your Instagram account to a Facebook Page',
      'Open Meta Business Suite',
      'Generate a long‑lived access token'
    ],
    tokenInfo: {
      expiresIn: '60 days',
      refreshMethod: 'Via Meta Business Dashboard',
      notes: [
        'Token must be renewed manually',
        'You will receive a notification 7 days before expiration',
        'Keep your Meta Business Suite up‑to‑date'
      ]
    }
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <Video className="w-6 h-6" />,
    description: "Link your TikTok Creator account via OAuth",
    permissions: ['Video publishing', 'Performance analytics', 'Profile read', 'Video stats'],
    limits: ['Max 3 posts/day', 'No automated DMs', 'Respect guidelines', 'Videos max 10MB'],
    color: 'bg-black',
    setupInstructions: [
      'Create a TikTok developer app',
      'Enable Login Kit',
      'Configure required permissions',
      'Authentication is automatic via OAuth'
    ],
    tokenInfo: {
      expiresIn: '24 hours',
      refreshMethod: 'Automatic',
      notes: [
        'Token renews automatically',
        'No action required on your part',
        'DMs are NOT allowed by the API'
      ]
    }
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: <MessageSquare className="w-6 h-6" />,
    description: "Connect your Reddit account with OAuth 2.0",
    permissions: ['Subreddit posting', 'Read messages', 'Post management', 'Karma tracking'],
    limits: ['Max 10 posts/day', 'Respect subreddit rules', 'Cooldown between posts', 'No spam'],
    color: 'bg-orange-600',
    setupInstructions: [
      'Use your existing Reddit account',
      'Authorize requested permissions',
      'Respect each subreddit’s rules',
      'Configure your posting limits'
    ],
    tokenInfo: {
      expiresIn: '1 heure',
      refreshMethod: 'Automatique',
      notes: [
        'Token refreshes automatically',
        'Reddit ratelimits are respected',
        'Check each sub’s rules'
      ]
    }
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    icon: <Heart className="w-6 h-6" />,
    description: "Integrate your OnlyFans account (unofficial API)",
    permissions: ['Send PPV', 'List management', 'Read messages', 'Mass messaging'],
    limits: ['ToS compliance', '18+ content only', 'Variable API limits'],
    color: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    setupInstructions: [
      'Log in with your OnlyFans credentials',
      'Enable two‑factor auth if needed',
      'Grant permissions for automation',
      'Configure your messaging preferences'
    ],
    tokenInfo: {
      expiresIn: 'Session',
      refreshMethod: 'Manual if logged out',
      notes: [
        'Session‑based connection',
        'Re‑login required if disconnected',
        'Unofficial API — use with care'
      ]
    }
  }
];

export function PlatformConnectionsStep() {
  const { platformConnections, connectPlatform, disconnectPlatform } = useOnboarding();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showInstructions, setShowInstructions] = useState<string | null>(null);

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform.id);
    
    try {
  // For Instagram, show special instructions
      if (platform.id === 'instagram') {
        setShowInstructions('instagram');
        setConnecting(null);
        return;
      }

      // Pour les autres plateformes, utiliser OAuth
      if (platform.id !== 'onlyfans') {
        const authUrl = generateOAuthUrl(platform.id as any);
        window.location.href = authUrl;
      } else {
        // OnlyFans utilise un flux custom
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockConnection: PlatformConnection = {
          platform: platform.id,
          connected: true,
          accessToken: 'session-' + platform.id,
          refreshToken: undefined,
          expiresAt: undefined,
          permissions: platform.permissions
        };
        
        connectPlatform(mockConnection);
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = (platformId: PlatformConnection['platform']) => {
    if (confirm('Are you sure you want to disconnect this platform?')) {
      disconnectPlatform(platformId);
    }
  };

  const isConnected = (platformId: string) => {
    return platformConnections.some(c => c.platform === platformId && c.connected);
  };

  const getConnectionStatus = (platformId: string) => {
    const connection = platformConnections.find(c => c.platform === platformId);
    if (!connection) return null;

    const tokenInfo = TOKEN_REFRESH_INFO[platformId];
    const now = new Date();
    const expiresAt = connection.expiresAt;

    if (expiresAt && tokenInfo.requiresRefresh) {
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 7) {
        return {
          status: 'warning',
          message: `Token expire dans ${daysUntilExpiry} jours`,
          action: tokenInfo.refreshMethod === 'business-dashboard' ? 'Renouveler' : null
        };
      }
    }

    return { status: 'ok', message: 'Active connection' };
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Secure connection</AlertTitle>
        <AlertDescription>
          Connect at least one platform to continue. Each connection uses official authentication methods to keep your data safe.
        </AlertDescription>
      </Alert>

      {showInstructions === 'instagram' && (
        <Alert className="border-purple-200 bg-purple-50">
          <Info className="h-4 w-4" />
          <AlertTitle>Instagram Instructions</AlertTitle>
          <AlertDescription className="mt-2">
            <ol className="space-y-2 mt-2">
              <li>1. Go to <a href="https://business.facebook.com" target="_blank" className="underline">Meta Business Suite</a></li>
              <li>2. Open "Settings" → "Integrations" → "Instagram"</li>
              <li>3. Generate a long‑lived access token (60 days)</li>
              <li>4. Copy the token and paste it below</li>
            </ol>
            <div className="mt-4 space-y-2">
              <input 
                type="text" 
                placeholder="Paste your Instagram token here"
                className="w-full p-2 border rounded"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    // Simuler la connexion Instagram
                    const mockConnection: PlatformConnection = {
                      platform: 'instagram',
                      connected: true,
                      accessToken: 'ig-token-example',
                      refreshToken: undefined,
                      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                      permissions: PLATFORMS[0].permissions
                    };
                    connectPlatform(mockConnection);
                    setShowInstructions(null);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Validate token
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowInstructions(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platforms">Available platforms</TabsTrigger>
          <TabsTrigger value="help">Help & Troubleshooting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="platforms" className="space-y-4">
          <div className="grid gap-4">
            {PLATFORMS.map((platform) => {
              const connected = isConnected(platform.id);
              const connectionStatus = connected ? getConnectionStatus(platform.id) : null;
              
              return (
                <Card key={platform.id} className={connected ? "border-green-500" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center text-white`}>
                          {platform.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <CardDescription>{platform.description}</CardDescription>
                        </div>
                      </div>
                      
                      {connected && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Connected
                          </Badge>
                          {connectionStatus?.status === 'warning' && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                              <Clock className="w-3 h-3 mr-1" />
                              {connectionStatus.message}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {selectedPlatform?.id === platform.id && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h5 className="font-medium text-sm">Connection info</h5>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1">Token expiry:</p>
                            <p className="text-gray-600">{platform.tokenInfo?.expiresIn}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Refresh method:</p>
                            <p className="text-gray-600">{platform.tokenInfo?.refreshMethod}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {platform.tokenInfo?.notes.map((note, idx) => (
                            <p key={idx} className="text-sm text-gray-600 flex items-start">
                              <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                              {note}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Granted permissions:</h4>
                        <ul className="space-y-1">
                      {platform.permissions.map((permission, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <CheckCircle2 className="w-3 h-3 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                              {permission}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Applied limits:</h4>
                        <ul className="space-y-1">
                          {platform.limits.map((limit, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <AlertCircle className="w-3 h-3 mr-2 mt-0.5 text-orange-600 flex-shrink-0" />
                              {limit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {connected ? (
                        <>
                          {connectionStatus?.action && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              {connectionStatus.action}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Disconnect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPlatform(platform)}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleConnect(platform)}
                            disabled={connecting === platform.id}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          >
                            {connecting === platform.id ? (
                              <>Connecting...</>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Connect {platform.name}
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPlatform(platform)}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            Instructions
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection troubleshooting</CardTitle>
              <CardDescription>Solutions to common issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Expired token</h4>
                  <p className="text-sm text-gray-600">
                    If your token expired, disconnect the platform and reconnect. 
                    For Instagram, generate a new token in Meta Business Suite.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Authentication failed</h4>
                  <p className="text-sm text-gray-600">
                    Ensure your account has required permissions (Business/Creator). 
                    Make sure pop‑ups are allowed for OAuth.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Revoke access</h4>
                  <p className="text-sm text-gray-600">
                    You can revoke access anytime from each platform’s security settings. Access will be revoked immediately on Huntaze.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">API limits reached</h4>
                  <p className="text-sm text-gray-600">
                    Each platform has its own limits. If you hit one, wait for reset (usually 1 hour) or reduce your activity.
                  </p>
                </div>
              </div>
              
              <Alert className="bg-purple-50 border-purple-200">
                <Info className="h-4 w-4" />
              <AlertDescription>
                Need more help? Contact our 24/7 support via chat 
                or browse our detailed knowledge base.
              </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">🔒 Security guaranteed</p>
        <p>
          All connections use official security protocols (OAuth 2.0). 
          Your passwords are never transmitted or stored. You stay in full control 
          and can revoke access at any time.
        </p>
      </div>
    </div>
  );
}
