/**
 * Payout Service - Multi-Platform Payout Management
 * 
 * Handles payout schedules and export functionality
 */

import { revenueAPI } from './api-client';
import type { PayoutScheduleResponse } from './types';

export class PayoutService {
  /**
   * Get payout schedule for a creator
   */
  async getPayoutSchedule(creatorId: string): Promise<PayoutScheduleResponse> {
    console.log('[PayoutService] Fetching payout schedule for creator:', creatorId);

    const data = await revenueAPI.get<PayoutScheduleResponse>('/payouts', {
      creatorId,
    });

    console.log('[PayoutService] Payout schedule received:', {
      payoutCount: data.payouts.length,
      totalExpected: data.summary.totalExpected,
      netIncome: data.summary.netIncome,
      connectedPlatforms: data.platforms.filter(p => p.connected).length,
    });

    return data;
  }

  /**
   * Export payout data as CSV
   */
  async exportPayouts(
    creatorId: string,
    format: 'csv' | 'pdf' = 'csv'
  ): Promise<Blob> {
    console.log('[PayoutService] Exporting payouts:', {
      creatorId,
      format,
    });

    const response = await fetch(
      `/api/revenue/payouts/export?creatorId=${creatorId}&format=${format}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export payouts');
    }

    const blob = await response.blob();
    console.log('[PayoutService] Export complete:', {
      size: blob.size,
      type: blob.type,
    });

    return blob;
  }

  /**
   * Download exported payouts
   */
  async downloadPayouts(
    creatorId: string,
    format: 'csv' | 'pdf' = 'csv'
  ): Promise<void> {
    const blob = await this.exportPayouts(creatorId, format);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${creatorId}-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('[PayoutService] Download initiated');
  }

  /**
   * Update tax rate for calculations
   */
  async updateTaxRate(
    creatorId: string,
    taxRate: number
  ): Promise<{ success: boolean }> {
    console.log('[PayoutService] Updating tax rate:', {
      creatorId,
      taxRate,
    });

    const result = await revenueAPI.post<{ success: boolean }>(
      '/payouts/tax-rate',
      {
        creatorId,
        taxRate,
      }
    );

    console.log('[PayoutService] Tax rate updated');
    return result;
  }

  /**
   * Sync platform connection
   */
  async syncPlatform(
    creatorId: string,
    platform: 'onlyfans' | 'fansly' | 'patreon'
  ): Promise<{ success: boolean; lastSync: string }> {
    console.log('[PayoutService] Syncing platform:', {
      creatorId,
      platform,
    });

    const result = await revenueAPI.post<{ success: boolean; lastSync: string }>(
      '/payouts/sync',
      {
        creatorId,
        platform,
      }
    );

    console.log('[PayoutService] Platform synced:', result.lastSync);
    return result;
  }
}

export const payoutService = new PayoutService();
