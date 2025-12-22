'use client';

/**
 * Content - Schedule Page
 * Schedule and manage content publication
 */

export const dynamic = 'force-dynamic';

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { 
  ShopifySectionHeader,
  ShopifyCard,
  ShopifyButton,
} from '@/components/ui/shopify';
import { Clock, Calendar, Plus, Play } from 'lucide-react';

export default function ContentSchedulePage() {
  return (
    <ShopifyPageLayout>
      <div className="space-y-6">
        <ShopifySectionHeader 
          title="Content Schedule" 
          description="Plan and schedule your content across platforms"
          icon={Clock}
        />

        <ShopifyCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Scheduled Content</h3>
              <ShopifyButton>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Post
              </ShopifyButton>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  title: "Beach Photoshoot", 
                  date: "Today, 6:00 PM", 
                  platform: "OnlyFans",
                  status: "Scheduled" 
                },
                { 
                  title: "Behind the Scenes", 
                  date: "Tomorrow, 2:00 PM", 
                  platform: "Instagram",
                  status: "Scheduled" 
                },
                { 
                  title: "Q&A Session", 
                  date: "Dec 20, 8:00 PM", 
                  platform: "OnlyFans",
                  status: "Draft" 
                },
              ].map((post, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h4 className="font-medium">{post.title}</h4>
                      <p className="text-sm text-gray-500">{post.date} • {post.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'Scheduled' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ShopifyCard>

        <ShopifyCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Calendar View</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Content calendar visualization</p>
            </div>
          </div>
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
