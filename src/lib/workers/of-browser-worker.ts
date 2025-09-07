// OnlyFans Browser Worker - Automates browser interactions
// STUBBED VERSION FOR DEPLOYMENT - TODO: Implement when Playwright is available

import type { OfMessage } from '@/lib/types/onlyfans';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Stub function for sending messages
export async function sendOfMessage(
  accountId: string,
  message: OfMessage
): Promise<SendResult> {
  console.log('Stubbed: Sending message via browser worker', { accountId, message });
  
  // TODO: Implement actual browser automation when Playwright is available
  return {
    success: false,
    error: 'Browser automation not implemented yet'
  };
}

// Stub browser worker pool
export const browserWorkerPool = {
  closeAll: async () => {
    console.log('Stubbed: Closing all browser workers');
  }
};