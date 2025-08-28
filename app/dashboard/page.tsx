'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, User, Settings, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [meter, setMeter] = useState<any>(null);

  useEffect(() => {
    // Fetch user data from API
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Not logged in, redirect to auth
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        window.location.href = '/auth';
      }
    };

    const fetchMeter = async () => {
      try {
        const resp = await fetch('/api/billing/commission/meter');
        if (resp.ok) setMeter(await resp.json());
      } catch (e) {
        console.warn('Commission meter unavailable');
      }
    };

    fetchUser();
    fetchMeter();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name || user?.email || 'User'}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Signed in with {user?.provider}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Revenue</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">$0</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">This month</p>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Fans</h3>
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total subscribers</p>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Commission Cap</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            {meter ? (
              <>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded">
                  <div className="h-3 bg-purple-600 rounded" style={{ width: `${Math.min(100, Math.round((meter.usedCents / meter.capCents) * 100))}%` }} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  ${((meter.usedCents || 0) / 100).toFixed(2)} used of ${(meter.capCents / 100).toFixed(2)} cap
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">—</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Meter unavailable</p>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/configure"
              className="block p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              Configure AI Assistant
            </Link>
            <button className="p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
              View Analytics
            </button>
            <button className="p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
              Account Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
