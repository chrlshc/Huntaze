/**
 * Forecast Service - Revenue Forecasting & Goal Setting
 * 
 * Handles revenue predictions and goal recommendations
 */

import { revenueAPI } from './api-client';
import type { RevenueForecastResponse } from './types';

export class ForecastService {
  /**
   * Get revenue forecast for a creator
   */
  async getForecast(
    creatorId: string,
    months: number = 12
  ): Promise<RevenueForecastResponse> {
    console.log('[ForecastService] Fetching forecast for creator:', creatorId, {
      months,
    });

    const data = await revenueAPI.get<RevenueForecastResponse>('/forecast', {
      creatorId,
      months: months.toString(),
    });

    console.log('[ForecastService] Forecast received:', {
      historicalPoints: data.historical.length,
      forecastPoints: data.forecast.length,
      currentMonthCompletion: data.currentMonth.completion,
      nextMonthPredicted: data.nextMonth.projected,
      modelAccuracy: data.metadata.modelAccuracy,
    });

    return data;
  }

  /**
   * Set revenue goal and get recommendations
   */
  async setGoal(
    creatorId: string,
    goalAmount: number,
    targetMonth: string
  ): Promise<{ success: boolean; recommendations: any[] }> {
    console.log('[ForecastService] Setting revenue goal:', {
      creatorId,
      goalAmount,
      targetMonth,
    });

    const result = await revenueAPI.post<{ success: boolean; recommendations: any[] }>(
      '/forecast/goal',
      {
        creatorId,
        goalAmount,
        targetMonth,
      }
    );

    console.log('[ForecastService] Goal set with recommendations:', {
      recommendationCount: result.recommendations.length,
    });

    return result;
  }

  /**
   * Get what-if scenario analysis
   */
  async getScenario(
    creatorId: string,
    changes: {
      newSubscribers?: number;
      priceIncrease?: number;
      churnReduction?: number;
    }
  ): Promise<{ projectedRevenue: number; impact: number }> {
    console.log('[ForecastService] Running scenario analysis:', {
      creatorId,
      changes,
    });

    const result = await revenueAPI.post<{ projectedRevenue: number; impact: number }>(
      '/forecast/scenario',
      {
        creatorId,
        ...changes,
      }
    );

    console.log('[ForecastService] Scenario result:', {
      projectedRevenue: result.projectedRevenue,
      impact: result.impact,
    });

    return result;
  }
}

export const forecastService = new ForecastService();
