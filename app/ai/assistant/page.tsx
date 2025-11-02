// Force dynamic rendering to avoid prerender issues with env vars
export const dynamic = 'force-dynamic';

import AssistantClient from './AssistantClient';

export default function AIAssistantPage() {
  return <AssistantClient />;
}
