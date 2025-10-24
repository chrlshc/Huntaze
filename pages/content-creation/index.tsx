import React from 'react';
import { HuntazeLayout } from '@/components/admin/HuntazeLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ContentLibrary from '@/components/content-creation/ContentLibrary';
import EditorialCalendar from '@/components/content-creation/EditorialCalendar';
import PPVCampaignManager from '@/components/content-creation/PPVCampaignManager';

export default function ContentCreationPage() {
  return (
    <HuntazeLayout
      title="Content Creation"
      primaryAction={{ label: 'New Asset', href: '#' }}
      secondaryActions={[{ label: 'Import', href: '#' }, { label: 'Templates', href: '#' }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Library</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge>Photos</Badge>
              <Badge variant="outline">Videos</Badge>
              <Badge variant="outline">Stories</Badge>
            </div>
          </div>
          <ContentLibrary />
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Editorial Calendar</h2>
          <EditorialCalendar />
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">PPV Campaigns</h2>
            <Badge>Beta</Badge>
          </div>
          <PPVCampaignManager />
        </Card>
      </div>
    </HuntazeLayout>
  );
}

