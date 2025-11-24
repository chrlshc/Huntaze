// Force dynamic rendering to avoid prerender issues with env vars
// Enable static generation for optimal performance and SEO
export const dynamic = 'force-static';

import AssistantClient from './AssistantClient';

export default function AIAssistantPage() {
  return <AssistantClient />;
}
