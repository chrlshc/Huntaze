// Smart Onboarding System - Struggle Indicators Repository

import { Pool } from 'pg';
import { CachedRepository } from './base';
import { StruggleIndicator, StruggleMetrics } from '../types';
import { SMART_ONBOARDING_TABLES, CACHE_KEYS, CACHE_TTL } from '../config/database';

interface StruggleIndicatorRecord {
  id: string;
  userId: string;
  journeyId?: string;
  stepId?: string;
  overallScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  indicators: StruggleIndicator[];
  patterns: any[];
  detectedAt: Date;
  resolvedAt?: Date;
  resolutionMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StruggleIndicatorsRepository extends CachedRepository<StruggleIndicatorRecord> {
  constructor(db: Pool) {
    super(
      db, 
      SMART_ONBOARDING_TABLES.STRUGGLE_INDICATORS,
      'smart_onboarding:struggle_indicators',
      CACHE_TTL.INTERVENTION_PLANS
    );
  }

  protected mapRowToEntity(row: any): StruggleIndicatorRecord {
    return {
      id: row.id,
      userId: row.user_id,
      journeyId: row.journey_id,
      stepId: row.step_id,
      overallScore: parseFloat(row.overall_score),
      severity: row.severity,
      duration: parseInt(row.duration),
      indicators: row.indicators || [],
      patterns: row.patterns || [],
      detectedAt: new Date(row.detected_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolutionMethod: row.resolution_method,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  protected mapEntityToRow(entity: Partial<StruggleIndicatorRecord>): Record<string, any> {
    return {
      user_id: entity.userId,
      journey_id: entity.journeyId,
      step_id: entity.stepId,
      overall_score: entity.overallScore,
      severity: entity.severity,
      duration: entity.duration,
      indicators: JSON.stringify(entity.indicators || []),
      patterns: JSON.stringify(entity.patterns || []),
      detected_at: entity.detectedAt,
      resolved_at: entity.resolvedAt,
      resolution_method: entity.resolutionMethod
    };
  }

  // Store struggle metrics
  async storeStruggleMetrics(metrics: StruggleMetrics): Promise<StruggleIndicatorRecord> {
    const record: Omit<StruggleIndicatorRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: metrics.userId,
      stepId: metrics.stepId,
      overallScore: metrics.overallScore,
      severity: metrics.severity,
      duration: metrics.duration,
      indicators: metrics.indicators,
      patterns: metrics.patterns,
      detectedAt: new Date()
    };

    return this.create(record);
  }

  // Get active struggles for a user
  async getActiveStruggles(userId: string): Promise<StruggleIndicatorRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND resolved_at IS NULL
      ORDER BY detected_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get struggles by severity
  async getStrugglesBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 50
  ): Promise<StruggleIndicatorRecord[]> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE severity = $1 AND resolved_at IS NULL
      ORDER BY detected_at DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [severity, limit]);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get struggle history for a user
  async getStruggleHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<StruggleIndicatorRecord[]> {
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
    `;
    
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND detected_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND detected_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY detected_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  // Get struggle patterns analysis
  async getStrugglePatterns(
    userId?: string,
    days: number = 30
  ): Promise<{
    commonIndicators: Array<{ type: string; frequency: number; avgSeverity: number }>;
    severityTrends: Array<{ date: Date; severity: string; count: number }>;
    resolutionEffectiveness: Array<{ method: string; successRate: number; avgResolutionTime: number }>;
    stepStruggles: Array<{ stepId: string; struggleCount: number; avgSeverity: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let baseCondition = 'WHERE detected_at >= $1';
    let params: any[] = [startDate];
    
    if (userId) {
      baseCondition += ' AND user_id = $2';
      params.push(userId);
    }

    // Common indicators analysis
    const indicatorsQuery = `
      SELECT 
        indicator_type,
        COUNT(*) as frequency,
        AVG(CASE severity 
          WHEN 'low' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'high' THEN 3 
          WHEN 'critical' THEN 4 
        END) as avg_severity
      FROM ${this.tableName},
      jsonb_array_elements(indicators) as indicator,
      jsonb_extract_path_text(indicator, 'type') as indicator_type
      ${baseCondition}
      GROUP BY indicator_type
      ORDER BY frequency DESC
    `;

    // Severity trends analysis
    const trendsQuery = `
      SELECT 
        DATE(detected_at) as date,
        severity,
        COUNT(*) as count
      FROM ${this.tableName}
      ${baseCondition}
      GROUP BY DATE(detected_at), severity
      ORDER BY date DESC, severity
    `;

    // Resolution effectiveness analysis
    const resolutionQuery = `
      SELECT 
        resolution_method as method,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END) as resolved_cases,
        AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))) as avg_resolution_time
      FROM ${this.tableName}
      ${baseCondition} AND resolution_method IS NOT NULL
      GROUP BY resolution_method
    `;

    // Step struggles analysis
    const stepQuery = `
      SELECT 
        step_id,
        COUNT(*) as struggle_count,
        AVG(overall_score) as avg_severity
      FROM ${this.tableName}
      ${baseCondition} AND step_id IS NOT NULL
      GROUP BY step_id
      ORDER BY struggle_count DESC
    `;

    const [indicatorsResult, trendsResult, resolutionResult, stepResult] = await Promise.all([
      this.db.query(indicatorsQuery, params),
      this.db.query(trendsQuery, params),
      this.db.query(resolutionQuery, params),
      this.db.query(stepQuery, params)
    ]);

    return {
      commonIndicators: indicatorsResult.rows.map(row => ({
        type: row.indicator_type,
        frequency: parseInt(row.frequency),
        avgSeverity: parseFloat(row.avg_severity)
      })),
      severityTrends: trendsResult.rows.map(row => ({
        date: new Date(row.date),
        severity: row.severity,
        count: parseInt(row.count)
      })),
      resolutionEffectiveness: resolutionResult.rows.map(row => ({
        method: row.method,
        successRate: row.resolved_cases / row.total_cases,
        avgResolutionTime: parseFloat(row.avg_resolution_time) || 0
      })),
      stepStruggles: stepResult.rows.map(row => ({
        stepId: row.step_id,
        struggleCount: parseInt(row.struggle_count),
        avgSeverity: parseFloat(row.avg_severity)
      }))
    };
  }

  // Mark struggle as resolved
  async resolveStruggle(
    id: string, 
    resolutionMethod: string,
    resolvedAt: Date = new Date()
  ): Promise<StruggleIndicatorRecord | null> {
    const query = `
      UPDATE ${this.tableName}
      SET resolved_at = $2, resolution_method = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [id, resolvedAt, resolutionMethod]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const entity = this.mapRowToEntity(result.rows[0]);
    
    // Update cache
    const cacheKey = this.getCacheKey(id);
    await this.invalidateCache(id);
    
    return entity;
  }

  // Get struggle statistics
  async getStruggleStatistics(
    userId?: string,
    days: number = 30
  ): Promise<{
    totalStruggles: number;
    resolvedStruggles: number;
    resolutionRate: number;
    averageResolutionTime: number;
    severityDistribution: Record<string, number>;
    mostCommonIndicators: Array<{ type: string; count: number }>;
    strugglesPerDay: Array<{ date: Date; count: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let baseCondition = 'WHERE detected_at >= $1';
    let params: any[] = [startDate];
    
    if (userId) {
      baseCondition += ' AND user_id = $2';
      params.push(userId);
    }

    // Basic statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_struggles,
        COUNT(resolved_at) as resolved_struggles,
        AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))) as avg_resolution_time
      FROM ${this.tableName}
      ${baseCondition}
    `;

    // Severity distribution
    const severityQuery = `
      SELECT severity, COUNT(*) as count
      FROM ${this.tableName}
      ${baseCondition}
      GROUP BY severity
    `;

    // Daily struggles
    const dailyQuery = `
      SELECT 
        DATE(detected_at) as date,
        COUNT(*) as count
      FROM ${this.tableName}
      ${baseCondition}
      GROUP BY DATE(detected_at)
      ORDER BY date DESC
    `;

    const [statsResult, severityResult, dailyResult] = await Promise.all([
      this.db.query(statsQuery, params),
      this.db.query(severityQuery, params),
      this.db.query(dailyQuery, params)
    ]);

    const stats = statsResult.rows[0];
    const totalStruggles = parseInt(stats.total_struggles);
    const resolvedStruggles = parseInt(stats.resolved_struggles);

    return {
      totalStruggles,
      resolvedStruggles,
      resolutionRate: totalStruggles > 0 ? resolvedStruggles / totalStruggles : 0,
      averageResolutionTime: parseFloat(stats.avg_resolution_time) || 0,
      severityDistribution: severityResult.rows.reduce((acc, row) => {
        acc[row.severity] = parseInt(row.count);
        return acc;
      }, {}),
      mostCommonIndicators: [], // This would require more complex JSON processing
      strugglesPerDay: dailyResult.rows.map(row => ({
        date: new Date(row.date),
        count: parseInt(row.count)
      }))
    };
  }

  // Clean up old resolved struggles
  async cleanupOldStruggles(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const query = `
      DELETE FROM ${this.tableName}
      WHERE resolved_at IS NOT NULL AND resolved_at < $1
    `;

    const result = await this.db.query(query, [cutoffDate]);
    return result.rowCount || 0;
  }

  // Get real-time struggle alerts
  async getActiveStruggleAlerts(
    minSeverity: 'medium' | 'high' | 'critical' = 'high'
  ): Promise<Array<{
    id: string;
    userId: string;
    stepId?: string;
    severity: string;
    duration: number;
    detectedAt: Date;
    indicators: StruggleIndicator[];
  }>> {
    const severityOrder = { medium: 2, high: 3, critical: 4 };
    const minSeverityValue = severityOrder[minSeverity];

    const query = `
      SELECT id, user_id, step_id, severity, duration, detected_at, indicators
      FROM ${this.tableName}
      WHERE resolved_at IS NULL
        AND CASE severity 
          WHEN 'medium' THEN 2 
          WHEN 'high' THEN 3 
          WHEN 'critical' THEN 4 
          ELSE 1 
        END >= $1
        AND detected_at > NOW() - INTERVAL '1 hour'
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 4 
          WHEN 'high' THEN 3 
          WHEN 'medium' THEN 2 
          ELSE 1 
        END DESC,
        detected_at DESC
    `;

    const result = await this.db.query(query, [minSeverityValue]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      stepId: row.step_id,
      severity: row.severity,
      duration: parseInt(row.duration),
      detectedAt: new Date(row.detected_at),
      indicators: row.indicators || []
    }));
  }
}