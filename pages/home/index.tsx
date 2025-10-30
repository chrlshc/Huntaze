import React from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { AdminLayout } from '@/components/admin/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Dashboard principal de l'app Huntaze
const todayStats = {
  revenue: 847.50,
  messages: 23,
  newFans: 12,
  contentViews: 1456,
};

const quickActions = [
  {
    title: 'Répondre aux messages',
    description: '5 messages en attente',
    icon: '💬',
    urgent: true,
    action: '/inbox',
  },
  {
    title: 'Publier du contenu',
    description: 'Planifié pour 14h30',
    icon: '📸',
    urgent: false,
    action: '/content-creation',
  },
  {
    title: 'Campagne PPV',
    description: 'Envoyer à 234 fans',
    icon: '🎯',
    urgent: false,
    action: '/marketing',
  },
  {
    title: 'Vérifier analytics',
    description: 'Nouveaux insights disponibles',
    icon: '📊',
    urgent: false,
    action: '/analytics',
  },
];

const recentActivity = [
  {
    type: 'message',
    platform: 'OnlyFans',
    content: 'Nouveau message de premium_fan',
    time: '2 min',
    amount: 50,
  },
  {
    type: 'subscription',
    platform: 'OnlyFans',
    content: 'Nouvel abonnement VIP',
    time: '15 min',
    amount: 25,
  },
  {
    type: 'tip',
    platform: 'OnlyFans',
    content: 'Pourboire reçu',
    time: '1h',
    amount: 15,
  },
  {
    type: 'view',
    platform: 'Instagram',
    content: 'Story vue 156 fois',
    time: '2h',
    amount: 0,
  },
];

const aiSuggestions = [
  {
    type: 'content',
    title: 'Contenu suggéré',
    suggestion: 'Tes photos en lingerie rouge génèrent +40% d\'engagement. Planifie-en plus cette semaine.',
    priority: 'high',
  },
  {
    type: 'timing',
    title: 'Meilleur moment',
    suggestion: 'Tes fans sont plus actifs entre 20h-22h. Programme tes PPV à ce moment.',
    priority: 'medium',
  },
  {
    type: 'pricing',
    title: 'Optimisation prix',
    suggestion: 'Augmente tes PPV à 35€ (+5€). Ton taux d\'achat restera stable.',
    priority: 'low',
  },
];

export default function HomePage() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      'OnlyFans': '🔥',
      'Instagram': '📸',
      'TikTok': '🎵',
    };
    return icons[platform as keyof typeof icons] || '📱';
  };

  return (
    <>
      <Head>
        <title>Accueil - Huntaze</title>
        <meta name="description" content="Dashboard principal Huntaze - Vue d'ensemble de votre activité" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <AdminLayout
        title="Accueil"
        primaryAction={{
          label: 'Assistant IA',
          href: '/ai-assistant',
        }}
        secondaryActions={[
          {
            label: 'Voir tout',
            href: '/analytics',
          },
        ]}
      >
        {/* Stats du jour */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Revenus aujourd'hui</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(todayStats.revenue)}
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
                  <p className="text-sm text-slate-600">Messages reçus</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {todayStats.messages}
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
                  <p className="text-sm text-slate-600">Nouveaux fans</p>
                  <p className="text-2xl font-bold text-slate-900">
                    +{todayStats.newFans}
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
                  <p className="text-sm text-slate-600">Vues contenu</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {todayStats.contentViews.toLocaleString()}
                  </p>
                </div>
                <span className="text-2xl">👀</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start space-y-2 ${
                    action.urgent ? 'border-orange-200 bg-orange-50' : ''
                  }`}
                  asChild
                >
                  <a href={action.action}>
                    <div className="flex items-center space-x-2 w-full">
                      <span className="text-2xl">{action.icon}</span>
                      {action.urgent && (
                        <Badge variant="warning" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{action.title}</p>
                      <p className="text-sm text-slate-600">{action.description}</p>
                    </div>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activité récente */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activité récente</CardTitle>
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <span className="text-lg">{getPlatformIcon(activity.platform)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {activity.content}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">{activity.time}</span>
                        {activity.amount > 0 && (
                          <span className="text-sm font-medium text-emerald-600">
                            +{formatPrice(activity.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions IA */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <span className="mr-2">🤖</span>
                  Suggestions IA
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/ai-assistant">Assistant complet</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-l-4 ${
                      suggestion.priority === 'high' 
                        ? 'border-red-400 bg-red-50' 
                        : suggestion.priority === 'medium'
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-blue-400 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-slate-700">
                          {suggestion.suggestion}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          suggestion.priority === 'high' 
                            ? 'destructive' 
                            : suggestion.priority === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                        className="ml-2"
                      >
                        {suggestion.priority === 'high' ? 'Urgent' : 
                         suggestion.priority === 'medium' ? 'Important' : 'Info'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raccourcis vers les sections principales */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <a href="/onlyfans">
                  <span className="text-2xl">🔥</span>
                  <span className="text-sm">OnlyFans</span>
                </a>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <a href="/marketing">
                  <span className="text-2xl">🎯</span>
                  <span className="text-sm">Marketing</span>
                </a>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <a href="/analytics">
                  <span className="text-2xl">📊</span>
                  <span className="text-sm">Analytics</span>
                </a>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <a href="/content-creation">
                  <span className="text-2xl">🎨</span>
                  <span className="text-sm">Création</span>
                </a>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <a href="/ai-assistant">
                  <span className="text-2xl">🤖</span>
                  <span className="text-sm">Assistant IA</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
