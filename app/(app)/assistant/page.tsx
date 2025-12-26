'use client';

import { Page } from '@shopify/polaris';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AssistantPage() {
  return (
    <Page title="Assistant">
      <EmptyState
        variant="no-data"
        title="Assistant is available in the chatbot"
        description="Open Majordome Chatbot to start a conversation."
        action={{ label: 'Open chatbot', onClick: () => (window.location.href = '/chatbot') }}
      />
    </Page>
  );
}
