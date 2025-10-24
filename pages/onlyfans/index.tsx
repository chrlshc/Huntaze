import React from 'react';
import Head from 'next/head';
import { AdminLayout } from '@/components/admin/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

// Données OnlyFans
const accountStats = {
  totalEarnings: 15847.50,
  monthlyEarnings: 4250.00,
  subscribers: 1247,
  newSubscribers: 23,
  messages: 156,
  tips: 89,
  ppvSales: 34,
  subscriptionPrice: 25.00,
};

const recentMessages = [
  {
    id: '1',
    fan: 'premium_user_123',
    message: 'Hey babe! Do you have any custom content available? I\'m looking for something special 😘',
    time: '2 min',
    amount: 0,
    type: 'message',
    status: 'unread',
  },
  {
    id: '2',
    fan: 'vip_fan_456',
    message: 'Just tipped you! Love your latest post 💕',
    time: '15 min',
    amount: 50,
    type: 'tip',
    status: 'read',
  },
  {
    id: '3',
    fan: 'loyal_subscriber',
    message: 'Can we do a video call session this week?',
    time: '1h',
    amount: 0,
    type: 'message',
    status: 'responded',
  },
  {
    id: '4',
    fan: 'new_fan_789',
    message: 'Just subscribed! What\'s your best content?',
    time: '2h',
    amount: 25,
    type: 'subscription',
    status: 'unread',
  },
];

const contentPerformance = [
  {
    id: '1',
    type: 'Photo',
    title: 'Lingerie rouge - Set complet',
    likes: 234,
    comments: 45,
    tips: 12,
    revenue: 180,
    posted: '2h',
  },
  {
    id: '2',
    type: 'Video',
    title: 'Behind the scenes - Shooting',
    likes: 189,
    comments: 32,
    tips: 8,
    revenue: 120,
    posted: '1d',
  },
  {
    id: '3',
    type: 'PPV',
    title: 'Contenu exclusif VIP',
    sent: 156,
    opened: 89,
    purchased: 23,
    revenue: 575,
    posted: '2d',
  },
];

const quickActions = [
  {
    title: 'Répondre aux messages',
    count: 12,
    icon: '💬',
    color: 'bg-blue-50 border-blue-200',
    urgent: true,
  },
  {
    title: 'Envoyer un PPV',
    count: 1247,
    icon: '💰',
    color: 'bg-green-50 border-green-200',
    urgent: false,
  },
  {
    title: 'Publier du contenu',
    count: 0,
    icon: '📸',
    color: 'bg-purple-50 border-purple-200',
    urgent: false,
  },
  {
    title: 'Programmer une story',
    count: 0,
    icon: '📱',
    color: 'bg-orange-50 border-orange-200',
    urgent: false,
  },
];

export default function OnlyFansPage() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getMessageStatusBadge = (status: string) => {
    const variants = {
      unread: 'destructive',
      read: 'secondary',
      responded: 'success',
    } as const;

    const labels = {
      unread: 'Non lu',
      read: 'Lu',
      responded: 'Répondu',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getMessageTypeIcon = (type: string) => {
    const icons = {
      message: '💬',
      tip: '💰',
      subscription: '⭐',
    };
    return icons[type as keyof typeof icons] || '📱';
  };

  return (
    <>
      <Head>
        <title>OnlyFans - Huntaze</title>
        <meta name="description" content="Gestion de votre compte OnlyFans - Messages, revenus et contenu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AdminLayout
        title="OnlyFans"
        primaryAction={{
          label: 'Nouveau PPV',
          onClick: () => console.log('Nouveau PPV'),
        }}
        secondaryActions={[
          {
            label: 'Publier contenu',
            onClick: () => console.log('Publier contenu'),
          },
          {
            label: 'Paramètres compte',
            onClick: () => console.log('Paramètres'),
          },
        ]}
      >
        {/* Stats OnlyFans */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Revenus ce mois</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(accountStats.monthlyEarnings)}
                  </p>
                  <p className="text-xs text-emerald-600">
                    Total: {formatPrice(accountStats.totalEarnings)}
                  </p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Abonnés</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {accountStats.subscribers.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-600">
                    +{accountStats.newSubscribers} ce mois
                  </p>
                </div>
                <span className="text-2xl">👥</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Messages</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {accountStats.messages}
                  </p>
                  <p className="text-xs text-orange-600">
                    12 non lus
                  </p>
                </div>
                <span className="text-2xl">💬</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Prix abonnement</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(accountStats.subscriptionPrice)}
                  </p>
                  <p className="text-xs text-slate-500">
                    /mois
                  </p>
                </div>
                <span className="text-2xl">⭐</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center space-y-2 ${action.color} ${
                    action.urgent ? 'ring-2 ring-red-200' : ''
                  }`}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <div className="text-center">
                    <p className="font-medium text-slate-900">{action.title}</p>
                    {action.count > 0 && (
                      <p className="text-sm text-slate-600">
                        {action.count.toLocaleString()} {action.title.includes('message') ? 'non lus' : 'fans'}
                      </p>
                    )}
                  </div>
                  {action.urgent && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Messages récents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="mr-2">💬</span>
                  Messages récents
                </CardTitle>
                <Button variant="outline" size="sm">
                  Voir tous les messages
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getMessageTypeIcon(message.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">{message.fan}</span>
                          <div className="flex items-center space-x-2">
                            {message.amount > 0 && (
                              <span className="text-sm font-medium text-emerald-600">
                                +{formatPrice(message.amount)}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">{message.time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {message.message}
                        </p>
                        <div className="flex items-center justify-between">
                          {getMessageStatusBadge(message.status)}
                          <Button variant="ghost" size="sm">
                            Répondre
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance du contenu */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="mr-2">📊</span>
                  Performance du contenu
                </CardTitle>
                <Button variant="outline" size="sm">
                  Voir analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentPerformance.map((content) => (
                  <div key={content.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{content.type}</Badge>
                        <span className="font-medium text-slate-900">{content.title}</span>
                      </div>
                      <span className="text-xs text-slate-500">{content.posted}</span>
                    </div>
                    
                    {content.type === 'PPV' ? (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Envoyés</p>
                          <p className="font-medium">{content.sent}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Achetés</p>
                          <p className="font-medium">{content.purchased}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Revenus</p>
                          <p className="font-medium text-emerald-600">{formatPrice(content.revenue)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Likes</p>
                          <p className="font-medium">{content.likes}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Commentaires</p>
                          <p className="font-medium">{content.comments}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Tips</p>
                          <p className="font-medium">{content.tips}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Revenus</p>
                          <p className="font-medium text-emerald-600">{formatPrice(content.revenue)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conseils IA spécifiques OnlyFans */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">🤖</span>
              Conseils IA pour OnlyFans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-medium text-emerald-900 mb-2">💰 Optimisation revenus</h4>
                <p className="text-sm text-emerald-700">
                  Tes PPV à 25€ ont un taux d'achat de 18%. Teste 30€ sur ton prochain envoi pour maximiser les revenus.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📸 Contenu performant</h4>
                <p className="text-sm text-blue-700">
                  Tes photos en lingerie rouge génèrent +40% de tips. Programme-en plus cette semaine.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">⏰ Timing optimal</h4>
                <p className="text-sm text-purple-700">
                  Tes fans sont plus actifs entre 20h-22h. Programme tes posts à ce moment pour plus d'engagement.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">💬 Messages en attente</h4>
                <p className="text-sm text-orange-700">
                  12 messages non lus depuis plus de 2h. Réponds rapidement pour maintenir l'engagement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
}