'use client';

/**
 * Automations - Flows Page
 * Manage automation workflows and sequences
 */

export const dynamic = 'force-dynamic';

import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { 
  ShopifySectionHeader,
  ShopifyCard,
  ShopifyButton,
} from '@/components/ui/shopify';
import { Zap, Plus, Play, Settings } from 'lucide-react';

export default function AutomationFlowsPage() {
  return (
    <ShopifyPageLayout>
      <div className="space-y-6">
        <ShopifySectionHeader 
          title="Automation Flows" 
          description="Create and manage automated workflows"
          icon={Zap}
        />

        <ShopifyCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Active Flows</h3>
              <ShopifyButton>
                <Plus className="w-4 h-4 mr-2" />
                New Flow
              </ShopifyButton>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Welcome Message", status: "Active", triggers: "New Fan" },
                { name: "PPV Campaign", status: "Draft", triggers: "Scheduled" },
                { name: "Birthday Wishes", status: "Active", triggers: "Fan Birthday" },
              ].map((flow, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">{flow.name}</h4>
                    <p className="text-sm text-gray-500">Trigger: {flow.triggers}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      flow.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {flow.status}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ShopifyCard>
      </div>
    </ShopifyPageLayout>
  );
}
