// Offline Mode - AI stops, human chatters take over
// For Scale+ plans when creator wants human touch
// STUBBED VERSION FOR DEPLOYMENT - TODO: Implement when DB is ready

export interface OfflineSchedule {
  accountId: string;
  enabled: boolean;
  schedule: {
    monday: { start: number; end: number; } | null;
    tuesday: { start: number; end: number; } | null;
    wednesday: { start: number; end: number; } | null;
    thursday: { start: number; end: number; } | null;
    friday: { start: number; end: number; } | null;
    saturday: { start: number; end: number; } | null;
    sunday: { start: number; end: number; } | null;
  };
  timezone: string;
  chatterTeam?: {
    teamName: string;
    notificationEmail: string;
    slackWebhook?: string;
  };
}

export interface ChatterHandoff {
  conversationId: string;
  fanName: string;
  fanValue: number;
  lastMessage: string;
  context: string;
  suggestedResponse: string;
  priority: 'high' | 'medium' | 'low';
}

export class OfflineModeService {
  // Check if currently in offline mode
  async isOfflineMode(accountId: string): Promise<boolean> {
    // TODO: Implement when database is ready
    return false;
  }

  // Update offline schedule
  async updateSchedule(accountId: string, schedule: OfflineSchedule): Promise<void> {
    // TODO: Implement when database is ready
    console.log('Offline schedule update stubbed:', accountId, schedule);
  }

  // Get conversations that need handoff
  async getHandoffQueue(accountId: string): Promise<ChatterHandoff[]> {
    // TODO: Implement when database is ready
    return [];
  }

  // Notify chatters about new conversations
  async notifyChatters(accountId: string, conversations: ChatterHandoff[]): Promise<void> {
    // TODO: Implement when database is ready
    console.log('Chatter notification stubbed:', conversations.length, 'conversations');
  }

  // Mark AI as paused for specific conversations
  async pauseAIForConversation(accountId: string, fanId: string): Promise<void> {
    // TODO: Implement when database is ready
    console.log('AI paused for conversation:', fanId);
  }

  // Resume AI for conversations
  async resumeAIForConversation(accountId: string, fanId: string): Promise<void> {
    // TODO: Implement when database is ready
    console.log('AI resumed for conversation:', fanId);
  }

  // Set up automatic offline mode
  async enableAutoOffline(accountId: string, schedule: OfflineSchedule): Promise<void> {
    // TODO: Implement when database is ready
    console.log('Auto offline enabled:', schedule);
  }

  async disableAutoOffline(accountId: string): Promise<void> {
    // TODO: Implement when database is ready
    console.log('Auto offline disabled');
  }
}

export const offlineMode = new OfflineModeService();