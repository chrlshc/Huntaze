// SIMPLE "Message These Fans Today" - What creators ACTUALLY need
// STUBBED VERSION FOR DEPLOYMENT - TODO: Implement when DB is ready

export interface DailyAction {
  fanId: string;
  fanName: string;
  reason: string;
  priority: 'NOW' | 'Today' | 'This Week';
  expectedValue: number;
  lastSpent: number;
  daysSinceLastPurchase: number;
  suggestion: string;
}

export class DailyActionService {
  // Get TODAY's money-making opportunities
  async getTodaysList(accountId: string): Promise<{
    urgentActions: DailyAction[];
    todayActions: DailyAction[];
    totalPotential: number;
  }> {
    // TODO: Implement when database is ready
    // For now, return empty results
    return {
      urgentActions: [],
      todayActions: [],
      totalPotential: 0
    };
  }

  // Simple best times based on past purchases
  async getBestTimes(accountId: string): Promise<{
    bestHours: number[];
    bestDays: string[];
  }> {
    // TODO: Implement when database is ready
    // Return default peak hours for now
    return {
      bestHours: [20, 21, 22], // 8-10 PM
      bestDays: ['Fri', 'Sat', 'Sun']
    };
  }
}

export const dailyActions = new DailyActionService();