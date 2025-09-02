'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationSettings() {
  const { permission, isSupported, subscribeToPush, unsubscribeFromPush, subscription } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner if notifications are supported but not enabled
    if (isSupported && permission === 'default') {
      setTimeout(() => setShowBanner(true), 5000); // Show after 5 seconds
    }
  }, [isSupported, permission]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      await subscribeToPush();
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Notification Banner */}
      {showBanner && permission === 'default' && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Enable Notifications</h3>
                <p className="text-sm text-gray-600 mt-1">Get instant alerts for new messages and important updates</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl"
                  >
                    Enable
                  </button>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="px-4 py-2 text-gray-600 text-sm font-medium"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Component */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-600">
                {permission === 'granted' && subscription
                  ? 'Receive alerts for new messages'
                  : permission === 'denied'
                  ? 'Notifications blocked by browser'
                  : 'Enable to get instant alerts'}
              </p>
            </div>
          </div>

          {permission === 'granted' && subscription ? (
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <BellOff className="w-4 h-4" />
              <span className="text-sm font-medium">Disable</span>
            </button>
          ) : permission === 'default' ? (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Enable</span>
            </button>
          ) : (
            <span className="text-sm text-gray-500">Blocked</span>
          )}
        </div>

        {/* Installation prompt for mobile */}
        {isSupported && !window.matchMedia('(display-mode: standalone)').matches && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">Install App</p>
                <p className="text-xs text-purple-700">Add to home screen for the best experience</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}