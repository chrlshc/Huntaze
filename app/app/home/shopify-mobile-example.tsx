'use client';

import React, { useState } from 'react';
import { ShopifyMobileLayout } from '@/components/mobile/ShopifyMobileLayout';
import { ShopifyMobileCard, ShopifyProductCard, ShopifyListItem } from '@/components/mobile/ShopifyMobileCard';
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function ShopifyMobileDashboard() {
  const [activeTab, setActiveTab] = useState('today');

  return (
    <ShopifyMobileLayout title="Dashboard">
      {/* Stats Summary */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
        <div className="px-4 py-3">
          <div className="flex gap-2 mb-3">
            {['today', 'week', 'month'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Total Sales</span>
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">$3,847</p>
              <p className="text-xs text-green-600 font-medium">+12% from yesterday</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Orders</span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">47</p>
              <p className="text-xs text-blue-600 font-medium">+8 new orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          <ShopifyMobileCard 
            className="text-center py-6"
            onClick={() => console.log('Add product')}
          >
            <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Add Product</p>
          </ShopifyMobileCard>
          
          <ShopifyMobileCard 
            className="text-center py-6"
            onClick={() => console.log('View orders')}
          >
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">View Orders</p>
          </ShopifyMobileCard>
        </div>

        {/* Recent Orders */}
        <ShopifyMobileCard noPadding>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
              <button className="text-sm text-green-600 font-medium">View all</button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {[
              { id: '#1234', customer: 'Sarah Miller', amount: '$89.00', status: 'Paid', time: '2 min ago' },
              { id: '#1233', customer: 'John Smith', amount: '$125.50', status: 'Pending', time: '15 min ago' },
              { id: '#1232', customer: 'Emma Wilson', amount: '$67.00', status: 'Paid', time: '1 hour ago' },
            ].map((order) => (
              <ShopifyListItem
                key={order.id}
                title={order.id}
                subtitle={`${order.customer} • ${order.time}`}
                value={order.amount}
                onClick={() => console.log('View order', order.id)}
              />
            ))}
          </div>
        </ShopifyMobileCard>

        {/* Top Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Top Products</h2>
            <button className="text-sm text-green-600 font-medium">See all</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ShopifyProductCard
              image="https://via.placeholder.com/200"
              title="Premium Bundle Package"
              price="$49.99"
              originalPrice="$79.99"
              badge="Best Seller"
            />
            <ShopifyProductCard
              image="https://via.placeholder.com/200"
              title="VIP Access Pass"
              price="$29.99"
              badge="20% OFF"
            />
          </div>
        </div>

        {/* Analytics Preview */}
        <ShopifyMobileCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Performance</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-medium text-gray-900">24.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '24.8%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg. Order Value</span>
                <span className="font-medium text-gray-900">$82.50</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </ShopifyMobileCard>

        {/* Customer Activity */}
        <ShopifyMobileCard noPadding>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Customer Activity</h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { type: 'new', text: 'New customer signed up', time: '5 min ago' },
              { type: 'order', text: 'Order #1234 completed', time: '12 min ago' },
              { type: 'review', text: '5-star review received', time: '1 hour ago' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  activity.type === 'new' ? 'bg-green-500' :
                  activity.type === 'order' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ShopifyMobileCard>
      </div>
    </ShopifyMobileLayout>
  );
}