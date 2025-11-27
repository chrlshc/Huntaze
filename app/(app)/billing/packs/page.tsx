/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';

import { MessagePacksClient } from './MessagePacksClient';

export default function MessagePacksPage() {
  return <MessagePacksClient />;
}
