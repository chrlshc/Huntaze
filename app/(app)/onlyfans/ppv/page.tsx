'use client';

import { useState } from 'react';
import { Plus, Send, Eye, DollarSign, TrendingUp, Users, Calendar, Image, Video, FileText, Filter, Search } from 'lucide-react';

export default function OnlyFansPPVPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'drafts' | 'sent'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // Mock PPV data
  const ppvCampaigns = [
    {
      id: 1,
      title: 'Exclusive Holiday Content 🎄',
      price: 25,
      mediaType: 'video',
      mediaCount: 3,
      thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400',
      description: 'Special holiday-themed content just for you!',
      createdAt: '2025-11-10',
      sentTo: 156,
      opened: 89,
      purchased: 23,
      revenue: 575,
      status: 'active',
    },
    {
      id: 2,
      title: 'Behind the Scenes Photos 📸',
      price: 15,
      mediaType: 'image',
      mediaCount: 12,
      thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400',
      description: 'Exclusive behind-the-scenes photos from my latest shoot',
      createdAt: '2025-11-08',
      sentTo: 203,
      opened: 134,
      purchased: 45,
      revenue: 675,
      status: 'active',
    },
    {
      id: 3,
      title: 'Weekend Special Content',
      price: 20,
      mediaType: 'video',
      mediaCount: 2,
      thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400',
      description: 'Special weekend content for my VIP fans',
      createdAt: '2025-11-12',
      status: 'draft',
    },
    {
      id: 4,
      title: 'Halloween Special 🎃',
      price: 30,
      mediaType: 'video',
      mediaCount: 5,
      thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400',
      description: 'Spooky Halloween content collection',
      createdAt: '2025-10-28',
      sentTo: 189,
      opened: 156,
      purchased: 67,
      revenue: 2010,
      status: 'sent',
    },
    {
      id: 5,
      title: 'Summer Vibes Collection ☀️',
      price: 18,
      mediaType: 'image',
      mediaCount: 8,
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
      description: 'Hot summer content collection',
      createdAt: '2025-10-15',
      sentTo: 178,
      opened: 145,
      purchased: 52,
      revenue: 936,
      status: 'sent',
    },
  ];

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredCampaigns = ppvCampaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesTab = activeTab === 'all' || campaign.status === activeTab;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return (b.revenue || 0) - (a.revenue || 0);
      case 'date': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'purchased': return (b.purchased || 0) - (a.purchased || 0);
      default: return 0;
    }
  });

  const totalRevenue = ppvCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalSent = ppvCampaigns.reduce((sum, c) => sum + (c.sentTo || 0), 0);
  const totalPurchased = ppvCampaigns.reduce((sum, c) => sum + (c.purchased || 0), 0);
  const conversionRate = totalSent > 0 ? (totalPurchased / totalSent) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">PPV Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage pay-per-view content</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create PPV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">+12% from last month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sent</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSent}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Across all campaigns</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Purchases</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPurchased}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total unlocks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">+2.3% from last month</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search PPV campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Drafts</option>
              <option value="sent">Sent</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="date">Sort by Date</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="purchased">Sort by Purchases</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {(['all', 'active', 'drafts', 'sent'] as const).map((tab) => {
              const count = tab === 'all' ? ppvCampaigns.length : ppvCampaigns.filter(c => c.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {sortedCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {campaign.thumbnail ? (
                      <img
                        src={campaign.thumbnail}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getMediaIcon(campaign.mediaType)}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {getMediaIcon(campaign.mediaType)}
                      <span>{campaign.mediaCount} files</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                      {campaign.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {campaign.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-white">
                        <DollarSign className="w-5 h-5" />
                        {campaign.price}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {campaign.status !== 'draft' && (
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{campaign.sentTo}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Sent</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{campaign.opened}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Opened</p>
                        </div>
                        <div>
                          <p className="font-semibold text-green-600 dark:text-green-400">{campaign.purchased}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Purchased</p>
                        </div>
                      </div>
                    )}

                    {campaign.revenue && (
                      <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${campaign.revenue.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {campaign.status === 'draft' ? (
                        <>
                          <button className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors">
                            Send Now
                          </button>
                          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            View Details
                          </button>
                          <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Duplicate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No PPV campaigns found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create your first PPV campaign to start earning
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create PPV Campaign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create PPV Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Create PPV Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  placeholder="Enter campaign title..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Media Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white">
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                  rows={3}
                  placeholder="Describe your content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Media
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Image className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Images, videos up to 500MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send To
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white">
                  <option value="all">All Fans</option>
                  <option value="vip">VIP Fans Only</option>
                  <option value="active">Active Fans</option>
                  <option value="custom">Custom Segment</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Save as Draft
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors">
                Create & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
