import { getDashboardSnapshot } from './dashboard-service';
import type { DailyAction } from './dashboard-types';
import { getDefaultSnapshot } from './dashboard-defaults';

export class DailyActionService {
  async getTodaysList(accountId: string): Promise<{
    urgentActions: DailyAction[];
    todayActions: DailyAction[];
    totalPotential: number;
  }> {
    const snapshot = await getDashboardSnapshot(accountId).catch(() => getDefaultSnapshot(accountId));
    const urgentActions = snapshot.actionList.items.filter((item) => item.priority === 'NOW');
    const todayActions = snapshot.actionList.items.filter((item) => item.priority !== 'NOW');

    return {
      urgentActions,
      todayActions,
      totalPotential: snapshot.actionList.totalPotential,
    };
  }

  async getBestTimes(accountId: string): Promise<{
    bestHours: number[];
    bestDays: string[];
  }> {
    const snapshot = await getDashboardSnapshot(accountId).catch(() => getDefaultSnapshot(accountId));
    return snapshot.bestTimes;
  }
}

export const dailyActions = new DailyActionService();

