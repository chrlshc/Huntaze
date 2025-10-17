'use client';

import React from 'react';
import { ShopifyLayout } from '@/components/shopify/ShopifyLayout';
import { ShopifyCard } from '@/components/shopify/ShopifyCard';
import { ShopifyStatCard } from '@/components/shopify/ShopifyStatCard';
import { ShopifyButton } from '@/components/shopify/ShopifyButton';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  CreditCard,
  Download,
  Calendar,
  ChevronDown,
  Package,
  Plus,
  Mail,
  BarChart
} from 'lucide-react';

export default function ShopifyDashboardExample() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$12,674',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'green' as const,
      description: 'vs dernier mois'
    },
    {
      title: 'Active Fans',
      value: '2,451',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue' as const,
      description: '85% de rétention'
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: '-2.1%',
      changeType: 'negative' as const,
      icon: TrendingUp,
      color: 'purple' as const,
      description: 'Objectif: 30%'
    },
    {
      title: 'Avg. Revenue/Fan',
      value: '$47.23',
      change: '+5.4%',
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'orange' as const,
      description: 'Top 10% industrie'
    }
  ];

  return (
    <ShopifyLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Bienvenue! Voici un aperçu de vos performances
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ShopifyButton variant="secondary" size="md">
              <Calendar className="w-4 h-4" />
              <span>30 derniers jours</span>
              <ChevronDown className="w-4 h-4" />
            </ShopifyButton>
            <ShopifyButton variant="primary" size="md" icon={Download}>
              Export
            </ShopifyButton>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <ShopifyStatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <ShopifyCard 
            title="Revenue Overview" 
            subtitle="Performance des 30 derniers jours"
            action="Voir détails"
          >
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Graphique de revenus</p>
              </div>
            </div>
          </ShopifyCard>
        </div>

        {/* Activity Feed */}
        <div>
          <ShopifyCard title="Activité Récente" action="Tout voir">
            <div className="space-y-4">
              {[
                { type: 'success', title: 'Nouveau fan VIP', desc: 'John Doe - Plan Premium', time: '2 min' },
                { type: 'info', title: 'Message reçu', desc: 'Sarah - Nouveau message', time: '15 min' },
                { type: 'warning', title: 'Paiement en attente', desc: 'Mike - En cours', time: '1h' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    item.type === 'success' ? 'bg-green-500' :
                    item.type === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ShopifyCard>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <ShopifyCard 
          title="Top Produits" 
          subtitle="Les plus populaires ce mois"
          action="Gérer produits"
        >
          <div className="space-y-3">
            {[
              { name: 'Pack Premium', sales: '234 ventes', revenue: '$5,842', growth: '+12%' },
              { name: 'Accès VIP', sales: '189 ventes', revenue: '$3,756', growth: '+8%' },
              { name: 'Messages Privés', sales: '156 ventes', revenue: '$2,340', growth: '+23%' },
            ].map((product, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{product.revenue}</p>
                  <p className="text-xs font-medium text-green-600">{product.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </ShopifyCard>

        {/* Quick Actions */}
        <ShopifyCard title="Actions Rapides">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Plus, label: 'Nouveau Produit', color: 'hover:bg-green-50 hover:border-green-300' },
              { icon: Mail, label: 'Envoyer Message', color: 'hover:bg-blue-50 hover:border-blue-300' },
              { icon: Users, label: 'Inviter Fans', color: 'hover:bg-purple-50 hover:border-purple-300' },
              { icon: BarChart, label: 'Voir Analytics', color: 'hover:bg-orange-50 hover:border-orange-300' },
            ].map((action, i) => (
              <button
                key={i}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-gray-200 bg-white hover:shadow-sm transition-all ${action.color}`}
              >
                <action.icon className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </ShopifyCard>
      </div>
    </ShopifyLayout>
  );
}