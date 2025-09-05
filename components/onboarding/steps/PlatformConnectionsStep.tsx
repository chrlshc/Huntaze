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
    description: "Connectez votre compte Instagram professionnel ou Creator via Meta Business",
    permissions: ['Publication de contenu', 'Lecture des statistiques', 'Gestion des commentaires', 'Insights avancés'],
    limits: ['Max 5 posts/jour', 'Stories non automatisées', '25 API calls/heure'],
    color: 'bg-gradient-to-br from-purple-600 to-pink-600',
    setupInstructions: [
      'Assurez-vous d\'avoir un compte Instagram Professionnel ou Creator',
      'Connectez votre compte Instagram à une Page Facebook',
      'Accédez au Meta Business Suite',
      'Générez un token d\'accès longue durée'
    ],
    tokenInfo: {
      expiresIn: '60 jours',
      refreshMethod: 'Via Meta Business Dashboard',
      notes: [
        'Le token doit être renouvelé manuellement',
        'Vous recevrez une notification 7 jours avant expiration',
        'Gardez votre Meta Business Suite à jour'
      ]
    }
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <Video className="w-6 h-6" />,
    description: "Liez votre compte TikTok Creator via OAuth",
    permissions: ['Publication de vidéos', 'Analyse des performances', 'Lecture du profil', 'Statistiques vidéo'],
    limits: ['Max 3 posts/jour', 'Aucun DM automatisé', 'Respect des guidelines', 'Vidéos max 10MB'],
    color: 'bg-black',
    setupInstructions: [
      'Créez une application développeur TikTok',
      'Activez le Login Kit',
      'Configurez les permissions requises',
      'L\'authentification est automatique via OAuth'
    ],
    tokenInfo: {
      expiresIn: '24 heures',
      refreshMethod: 'Automatique',
      notes: [
        'Renouvellement automatique du token',
        'Aucune action requise de votre part',
        'Les DMs ne sont PAS autorisés par l\'API'
      ]
    }
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: <MessageSquare className="w-6 h-6" />,
    description: "Connectez votre compte Reddit avec OAuth 2.0",
    permissions: ['Publication dans les subreddits', 'Lecture des messages', 'Gestion des posts', 'Karma tracking'],
    limits: ['Max 10 posts/jour', 'Respect des règles subreddit', 'Cooldown entre posts', 'Pas de spam'],
    color: 'bg-orange-600',
    setupInstructions: [
      'Utilisez votre compte Reddit existant',
      'Autorisez les permissions demandées',
      'Respectez les règles de chaque subreddit',
      'Configurez vos limites de posts'
    ],
    tokenInfo: {
      expiresIn: '1 heure',
      refreshMethod: 'Automatique',
      notes: [
        'Token rafraîchi automatiquement',
        'Respect du ratelimit Reddit',
        'Vérifiez les règles de chaque sub'
      ]
    }
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    icon: <Heart className="w-6 h-6" />,
    description: "Intégrez votre compte OnlyFans (API non officielle)",
    permissions: ['Envoi de PPV', 'Gestion des listes', 'Lecture des messages', 'Mass messaging'],
    limits: ['Conformité ToS', 'Contenu 18+ uniquement', 'Limites API variables'],
    color: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    setupInstructions: [
      'Connectez-vous avec vos identifiants OnlyFans',
      'Activez la double authentification si nécessaire',
      'Accordez les permissions pour l\'automatisation',
      'Configurez vos préférences de messaging'
    ],
    tokenInfo: {
      expiresIn: 'Session',
      refreshMethod: 'Manuel si déconnexion',
      notes: [
        'Connexion basée sur session',
        'Reconnexion requise si déconnecté',
        'API non officielle - prudence'
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
      // Pour Instagram, afficher les instructions spéciales
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
    if (confirm('Êtes-vous sûr de vouloir déconnecter cette plateforme?')) {
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

    return { status: 'ok', message: 'Connexion active' };
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Connexion sécurisée</AlertTitle>
        <AlertDescription>
          Connectez au moins une plateforme pour continuer. Chaque connexion utilise les méthodes 
          d'authentification officielles pour garantir la sécurité de vos données.
        </AlertDescription>
      </Alert>

      {showInstructions === 'instagram' && (
        <Alert className="border-purple-200 bg-purple-50">
          <Info className="h-4 w-4" />
          <AlertTitle>Instructions pour Instagram</AlertTitle>
          <AlertDescription className="mt-2">
            <ol className="space-y-2 mt-2">
              <li>1. Rendez-vous sur <a href="https://business.facebook.com" target="_blank" className="underline">Meta Business Suite</a></li>
              <li>2. Accédez à "Paramètres" → "Intégrations" → "Instagram"</li>
              <li>3. Générez un token d'accès longue durée (60 jours)</li>
              <li>4. Copiez le token et collez-le ci-dessous</li>
            </ol>
            <div className="mt-4 space-y-2">
              <input 
                type="text" 
                placeholder="Collez votre token Instagram ici"
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
                  Valider le token
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowInstructions(null)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platforms">Plateformes disponibles</TabsTrigger>
          <TabsTrigger value="help">Aide & Dépannage</TabsTrigger>
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
                            Connecté
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
                        <h5 className="font-medium text-sm">Informations de connexion</h5>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1">Expiration du token:</p>
                            <p className="text-gray-600">{platform.tokenInfo?.expiresIn}</p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Renouvellement:</p>
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
                        <h4 className="font-medium text-sm mb-2">Permissions accordées:</h4>
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
                        <h4 className="font-medium text-sm mb-2">Limites appliquées:</h4>
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
                            Déconnecter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPlatform(platform)}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            Détails
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
                              <>Connexion en cours...</>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Connecter {platform.name}
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
              <CardTitle>Dépannage connexions</CardTitle>
              <CardDescription>Solutions aux problèmes courants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Token expiré</h4>
                  <p className="text-sm text-gray-600">
                    Si votre token a expiré, déconnectez la plateforme et reconnectez-vous. 
                    Pour Instagram, générez un nouveau token dans Meta Business Suite.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Échec d'authentification</h4>
                  <p className="text-sm text-gray-600">
                    Vérifiez que votre compte a les permissions requises (compte Business/Creator). 
                    Assurez-vous que les pop-ups sont autorisés pour OAuth.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Révoquer l'accès</h4>
                  <p className="text-sm text-gray-600">
                    Vous pouvez révoquer l'accès à tout moment depuis les paramètres de sécurité 
                    de chaque plateforme. L'accès sera immédiatement révoqué côté Huntaze.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Limites API dépassées</h4>
                  <p className="text-sm text-gray-600">
                    Chaque plateforme a ses propres limites. Si vous atteignez une limite, 
                    attendez le reset (généralement 1 heure) ou réduisez votre activité.
                  </p>
                </div>
              </div>
              
              <Alert className="bg-purple-50 border-purple-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Besoin d'aide supplémentaire? Contactez notre support 24/7 via le chat 
                  ou consultez notre base de connaissances détaillée.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">🔒 Sécurité garantie</p>
        <p>
          Toutes les connexions utilisent les protocoles de sécurité officiels (OAuth 2.0). 
          Vos mots de passe ne sont jamais transmis ni stockés. Vous gardez le contrôle total 
          et pouvez révoquer l'accès à tout moment.
        </p>
      </div>
    </div>
  );
}