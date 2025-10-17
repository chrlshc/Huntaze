// OnlyFans Browser Worker - Automates browser interactions
// STUBBED VERSION FOR DEPLOYMENT - TODO: Implement when Playwright is available

import type { OfMessage } from '@/lib/types/onlyfans';
import { makeReqLogger } from '@/lib/logger';

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
  makeReqLogger({ userId: accountId, route: 'of_browser_worker', method: 'JOB' }).info('of_browser_send_stubbed');
  
  // TODO: Implement actual browser automation when Playwright is available
  return {
    success: false,
    error: 'Browser automation not implemented yet'
  };
}

// Stub browser worker pool
export const browserWorkerPool = {
  closeAll: async () => {
    makeReqLogger({ route: 'of_browser_worker', method: 'JOB' }).info('of_browser_close_all');
  }
};
