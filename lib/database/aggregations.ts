/**
 * Database-level aggregation utilities
 * 
 * Performs COUNT, SUM, AVG, MIN, MAX operations in the database instead of application code
 * This is much more efficient for large datasets
 * 
 * Requirements: 7.4 - Move aggregations to database
 */

import { Prisma } from '@prisma/client';

/**
 * Aggregation result types
 */
export interface CountResult {
  count: number;
}

export interface SumResult {
  sum: number | null;
}

export interface AvgResult {
  avg: number | null;
}

export interface MinMaxResult {
  min: number | null;
  max: number | null;
}

export interface AggregationResult {
  count?: number;
  sum?: number | null;
  avg?: number | null;
  min?: number | null;
  max?: number | null;
}

/**
 * Build a database aggregation query
 * 
 * @example
 * const result = await prisma.order.aggregate({
 *   ...buildAggregation(['count', 'sum'], { field: 'total' }),
 *   where: { status: 'completed' }
 * });
 */
export function buildAggregation(
  operations: Array<'count' | 'sum' | 'avg' | 'min' | 'max'>,
  options?: { field?: string }
) {
  const aggregation: any = {};

  operations.forEach(op => {
    switch (op) {
      case 'count':
        aggregation._count = true;
        break;
      case 'sum':
        if (options?.field) {
          aggregation._sum = { [options.field]: true };
        }
        break;
      case 'avg':
        if (options?.field) {
          aggregation._avg = { [options.field]: true };
        }
        break;
      case 'min':
        if (options?.field) {
          aggregation._min = { [options.field]: true };
        }
        break;
      case 'max':
        if (options?.field) {
          aggregation._max = { [options.field]: true };
        }
        break;
    }
  });

  return aggregation;
}

/**
 * Format aggregation results into a clean object
 */
export function formatAggregationResult(result: any): AggregationResult {
  const formatted: AggregationResult = {};

  if (result._count !== undefined) {
    formatted.count = typeof result._count === 'number' ? result._count : result._count._all || 0;
  }

  if (result._sum) {
    const sumField = Object.keys(result._sum)[0];
    formatted.sum = sumField ? result._sum[sumField] : null;
  }

  if (result._avg) {
    const avgField = Object.keys(result._avg)[0];
    formatted.avg = avgField ? result._avg[avgField] : null;
  }

  if (result._min) {
    const minField = Object.keys(result._min)[0];
    formatted.min = minField ? result._min[minField] : null;
  }

  if (result._max) {
    const maxField = Object.keys(result._max)[0];
    formatted.max = maxField ? result._max[maxField] : null;
  }

  return formatted;
}

/**
 * Build a GROUP BY aggregation query
 * 
 * @example
 * const results = await prisma.order.groupBy({
 *   by: ['status'],
 *   ...buildGroupByAggregation(['count', 'sum'], { field: 'total' }),
 *   where: { createdAt: { gte: startDate } }
 * });
 */
export function buildGroupByAggregation(
  operations: Array<'count' | 'sum' | 'avg' | 'min' | 'max'>,
  options?: { field?: string }
) {
  const aggregation: any = {};

  operations.forEach(op => {
    switch (op) {
      case 'count':
        aggregation._count = { _all: true };
        break;
      case 'sum':
        if (options?.field) {
          aggregation._sum = { [options.field]: true };
        }
        break;
      case 'avg':
        if (options?.field) {
          aggregation._avg = { [options.field]: true };
        }
        break;
      case 'min':
        if (options?.field) {
          aggregation._min = { [options.field]: true };
        }
        break;
      case 'max':
        if (options?.field) {
          aggregation._max = { [options.field]: true };
        }
        break;
    }
  });

  return aggregation;
}

/**
 * Format GROUP BY aggregation results
 */
export function formatGroupByResults(results: any[]): Array<Record<string, any>> {
  return results.map(result => {
    const formatted: Record<string, any> = {};

    // Copy grouping fields
    Object.keys(result).forEach(key => {
      if (!key.startsWith('_')) {
        formatted[key] = result[key];
      }
    });

    // Format aggregations
    if (result._count) {
      formatted.count = result._count._all || 0;
    }

    if (result._sum) {
      const sumField = Object.keys(result._sum)[0];
      formatted.sum = sumField ? result._sum[sumField] : null;
    }

    if (result._avg) {
      const avgField = Object.keys(result._avg)[0];
      formatted.avg = avgField ? result._avg[avgField] : null;
    }

    if (result._min) {
      const minField = Object.keys(result._min)[0];
      formatted.min = minField ? result._min[minField] : null;
    }

    if (result._max) {
      const maxField = Object.keys(result._max)[0];
      formatted.max = maxField ? result._max[maxField] : null;
    }

    return formatted;
  });
}

/**
 * Helper for common aggregation patterns
 */
export const aggregationHelpers = {
  /**
   * Count records matching a condition
   */
  async count<T>(
    model: any,
    where?: any
  ): Promise<number> {
    const result = await model.count({ where });
    return result;
  },

  /**
   * Sum a numeric field
   */
  async sum<T>(
    model: any,
    field: string,
    where?: any
  ): Promise<number | null> {
    const result = await model.aggregate({
      _sum: { [field]: true },
      where,
    });
    return result._sum[field];
  },

  /**
   * Calculate average of a numeric field
   */
  async avg<T>(
    model: any,
    field: string,
    where?: any
  ): Promise<number | null> {
    const result = await model.aggregate({
      _avg: { [field]: true },
      where,
    });
    return result._avg[field];
  },

  /**
   * Find min and max of a numeric field
   */
  async minMax<T>(
    model: any,
    field: string,
    where?: any
  ): Promise<MinMaxResult> {
    const result = await model.aggregate({
      _min: { [field]: true },
      _max: { [field]: true },
      where,
    });
    return {
      min: result._min[field],
      max: result._max[field],
    };
  },

  /**
   * Get comprehensive statistics for a numeric field
   */
  async stats<T>(
    model: any,
    field: string,
    where?: any
  ): Promise<AggregationResult> {
    const result = await model.aggregate({
      _count: true,
      _sum: { [field]: true },
      _avg: { [field]: true },
      _min: { [field]: true },
      _max: { [field]: true },
      where,
    });

    return formatAggregationResult(result);
  },

  /**
   * Group by a field and aggregate
   */
  async groupBy<T>(
    model: any,
    groupByField: string | string[],
    operations: Array<'count' | 'sum' | 'avg' | 'min' | 'max'>,
    options?: { field?: string; where?: any; orderBy?: any }
  ): Promise<Array<Record<string, any>>> {
    const by = Array.isArray(groupByField) ? groupByField : [groupByField];
    
    const result = await model.groupBy({
      by,
      ...buildGroupByAggregation(operations, { field: options?.field }),
      where: options?.where,
      orderBy: options?.orderBy,
    });

    return formatGroupByResults(result);
  },
};

/**
 * Performance comparison helper
 * Demonstrates the difference between app-level and DB-level aggregation
 */
export const performanceComparison = {
  /**
   * BAD: Application-level aggregation
   * Fetches all records and computes in JavaScript
   */
  async sumInApp(model: any, field: string, where?: any): Promise<number> {
    const records = await model.findMany({ where, select: { [field]: true } });
    return records.reduce((sum: number, record: any) => sum + (record[field] || 0), 0);
  },

  /**
   * GOOD: Database-level aggregation
   * Computes in database and returns only the result
   */
  async sumInDb(model: any, field: string, where?: any): Promise<number | null> {
    return aggregationHelpers.sum(model, field, where);
  },

  /**
   * BAD: Application-level count
   */
  async countInApp(model: any, where?: any): Promise<number> {
    const records = await model.findMany({ where });
    return records.length;
  },

  /**
   * GOOD: Database-level count
   */
  async countInDb(model: any, where?: any): Promise<number> {
    return aggregationHelpers.count(model, where);
  },
};
