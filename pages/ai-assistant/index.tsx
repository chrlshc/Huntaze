import React from 'react';
import type { GetServerSideProps } from 'next';
import { HuntazeLayout } from '@/components/admin/HuntazeLayout';
import { Card } from '@/components/ui/card';
import ChatInterface from '@/components/assistant/ChatInterface';
import AITools from '@/components/assistant/AITools';
import ProactiveInsights from '@/components/assistant/ProactiveInsights';

export default function AIAssistantPage() {
  return (
    <HuntazeLayout
      title="Assistant IA"
      primaryAction={{ label: 'New Chat', href: '#' }}
      secondaryActions={[{ label: 'Playbooks', href: '#' }, { label: 'Guardrails', href: '#' }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Chat</h2>
          <ChatInterface />
        </Card>
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">AI Tools</h2>
            <AITools />
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Proactive Insights</h2>
            <ProactiveInsights />
          </Card>
        </div>
      </div>
    </HuntazeLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
