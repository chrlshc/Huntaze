// Force dynamic rendering to avoid prerender issues with client-only hooks
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import AssistantClient from './AssistantClient';

export default function AIAssistantPage() {
  return <AssistantClient />;
}
