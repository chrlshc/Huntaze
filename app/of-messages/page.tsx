'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfInbox from '@/components/of/inbox';
import OfCampaigns from '@/components/of/campaigns';
import { MessageSquare, Send } from 'lucide-react';

export default function OfMessagesPage() {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            OnlyFans Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your OnlyFans DMs and mass message campaigns
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 dark:text-yellow-500">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                Automation Notice
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This tool assists with message management. Always follow OnlyFans guidelines and respect your fans' preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-6">
            <OfInbox />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <OfCampaigns />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}