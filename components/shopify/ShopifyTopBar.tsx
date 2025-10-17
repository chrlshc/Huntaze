'use client';

import React, { useState } from 'react';
import { Search, Bell, HelpCircle, X } from 'lucide-react';

export const ShopifyTopBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des fans, messages, produits..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300
                       bg-gray-50 text-sm placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       hover:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 ml-6">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">Nouveau fan inscrit</p>
                          <p className="text-xs text-gray-500 mt-1">Il y a 5 minutes</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="text-sm text-center w-full text-green-600 hover:text-green-700 font-medium">
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Help */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};