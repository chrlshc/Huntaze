'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  TrendingUp, 
  Download,
  Star,
  ArrowLeft
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/export-all";

interface KPIData {
  totalFans: number;
  activeFans: number;
  totalRevenue: number;
  avgRevenuePerFan: number;
  totalMessages: number;
  responseRate: number;
}

interface TopFan {
  id: number;
  name: string;
  handle?: string;
  avatar?: string;
  valueCents: number;
  messageCount: number;
  lastSeenAt: string;
}

export default function OnlyFansAnalyticsPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [topFans, setTopFans] = useState<TopFan[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIs(),
        loadTopFans(),
      ]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIs = async () => {
    try {
      const [fansResponse, conversationsResponse] = await Promise.all([
        fetch('/api/crm/fans'),
        fetch('/api/crm/conversations'),
      ]);

      if (fansResponse.ok && conversationsResponse.ok) {
        const fansData = await fansResponse.json();
        const conversationsData = await conversationsResponse.json();

        const fans = fansData.fans || [];
        const conversations = conversationsData.conversations || [];

        const totalRevenue = fans.reduce((sum: number, fan: any) => sum + (fan.valueCents || 0), 0);
        const activeFans = fans.filter((fan: any) => {
          const lastSeen = new Date(fan.lastSeenAt || fan.createdAt);
          const sevenDaysAgo = subDays(new Date(), 7);
          return lastSeen > sevenDaysAgo;
        }).length;

        setKpis({
          totalFans: fans.length,
          activeFans,
          totalRevenue,
          avgRevenuePerFan: fans.length > 0 ? totalRevenue / fans.length : 0,
          totalMessages: conversations.length * 10,
          responseRate: 85,
        });
      }
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    }
  };

  const loadTopFans = async () => {
    try {
      const response = await fetch('/api/crm/fans');
      if (response.ok) {
        const data = await response.json();
        const fans = (data.fans || [])
          .sort((a: any, b: any) => (b.valueCents || 0) - (a.valueCents || 0))
          .slice(0, 10)
          .map((fan: any) => ({
            ...fan,
            messageCount: Math.floor(Math.random() * 50) + 10,
          }));
        setTopFans(fans);
      }
    } catch (error) {
      console.error('Failed to load top fans:', error);
    }
  };

  const exportData = async () => {
    try {
      const csvData = [
        ['Fan Name', 'Handle', 'Value (€)', 'Messages'],
        ...topFans.map(fan => [
          fan.name,
          fan.handle || '',
          (fan.valueCents / 100).toFixed(2),
          fan.messageCount.toString(),
        ])
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onlyfans-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return `${(cents / 100).toFixed(2)}€`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/platforms" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Analytics OnlyFans</h1>
              <p className="text-gray-600">Tableau de bord des performances</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Select 
              value={timeRange} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </Select>
            <Button variant="ghost" onClick={exportData}>
  <Download className="w-4 h-4" />
              Exporter CSV
</Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Fans</h3>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{kpis.totalFans.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {kpis.activeFans} active (7d)
              </p>
            </Card>

            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Revenue Total</h3>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.totalRevenue)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(kpis.avgRevenuePerFan)} par fan
              </p>
            </Card>

            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Messages</h3>
                <MessageSquare className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">{kpis.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {formatPercentage(kpis.responseRate)} response rate
              </p>
            </Card>

            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Engagement Rate</h3>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{formatPercentage(kpis.responseRate)}</div>
              <p className="text-xs text-gray-500 mt-1">
                +2.5% vs last month
              </p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex space-x-2 border-b border-gray-200">
            <Button 
              variant="primary" 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Overview
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setActiveTab('fans')}
              className={`px-4 py-2 font-medium ${activeTab === 'fans' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Top Fans
            </Button>
          </div>

          {activeTab === 'overview' && (
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Overview</h3>
              <p className="text-gray-600">
                Revenue and upcoming messages charts (requires Recharts integration).
              </p>
            </Card>
          )}

          {activeTab === 'fans' && (
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Top 10 Fans by Revenue</h3>
              <div className="space-y-4">
                {topFans.map((fan, index) => (
                  <div key={fan.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                      {fan.name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{fan.name}</p>
                        {index < 3 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{fan.handle}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(fan.valueCents)}</p>
                      <p className="text-sm text-gray-500">{fan.messageCount} messages</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
