/**
 * Example API route demonstrating database-level aggregations
 * 
 * Shows the difference between app-level and DB-level aggregations
 * Requirements: 7.4 - Move aggregations to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { aggregationHelpers, performanceComparison } from '@/lib/database/aggregations';

// Mock data for demonstration
const mockOrders = Array.from({ length: 1000 }, (_, i) => ({
  id: String(i + 1),
  total: Math.floor(Math.random() * 1000) + 10,
  status: ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
}));

// Mock Prisma model
const mockModel = {
  findMany: async ({ where, select }: any) => {
    let filtered = mockOrders;
    if (where?.status) {
      filtered = filtered.filter(o => o.status === where.status);
    }
    if (select) {
      return filtered.map((o: any) => {
        const result: any = {};
        Object.keys(select).forEach(key => {
          if (select[key]) result[key] = o[key];
        });
        return result;
      });
    }
    return filtered;
  },

  count: async ({ where }: any) => {
    let filtered = mockOrders;
    if (where?.status) {
      filtered = filtered.filter(o => o.status === where.status);
    }
    return filtered.length;
  },

  aggregate: async ({ _count, _sum, _avg, _min, _max, where }: any) => {
    let filtered = mockOrders;
    if (where?.status) {
      filtered = filtered.filter(o => o.status === where.status);
    }

    const result: any = {};

    if (_count) {
      result._count = filtered.length;
    }

    if (_sum) {
      const field = Object.keys(_sum)[0];
      result._sum = {
        [field]: filtered.reduce((sum, o: any) => sum + (o[field] || 0), 0),
      };
    }

    if (_avg) {
      const field = Object.keys(_avg)[0];
      const sum = filtered.reduce((sum, o: any) => sum + (o[field] || 0), 0);
      result._avg = {
        [field]: filtered.length > 0 ? sum / filtered.length : null,
      };
    }

    if (_min) {
      const field = Object.keys(_min)[0];
      result._min = {
        [field]: filtered.length > 0 ? Math.min(...filtered.map((o: any) => o[field])) : null,
      };
    }

    if (_max) {
      const field = Object.keys(_max)[0];
      result._max = {
        [field]: filtered.length > 0 ? Math.max(...filtered.map((o: any) => o[field])) : null,
      };
    }

    return result;
  },

  groupBy: async ({ by, _count, _sum, _avg, where }: any) => {
    let filtered = mockOrders;
    if (where?.status) {
      filtered = filtered.filter(o => o.status === where.status);
    }

    const groups: any = {};
    filtered.forEach((order: any) => {
      const key = by.map((field: string) => order[field]).join('|');
      if (!groups[key]) {
        groups[key] = {
          ...by.reduce((acc: any, field: string) => {
            acc[field] = order[field];
            return acc;
          }, {}),
          items: [],
        };
      }
      groups[key].items.push(order);
    });

    return Object.values(groups).map((group: any) => {
      const result: any = {};
      by.forEach((field: string) => {
        result[field] = group[field];
      });

      if (_count) {
        result._count = { _all: group.items.length };
      }

      if (_sum) {
        const field = Object.keys(_sum)[0];
        result._sum = {
          [field]: group.items.reduce((sum: number, o: any) => sum + (o[field] || 0), 0),
        };
      }

      if (_avg) {
        const field = Object.keys(_avg)[0];
        const sum = group.items.reduce((sum: number, o: any) => sum + (o[field] || 0), 0);
        result._avg = {
          [field]: group.items.length > 0 ? sum / group.items.length : null,
        };
      }

      return result;
    });
  },
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation') || 'stats';
    const status = searchParams.get('status');

    const where = status ? { status } : undefined;

    let result: any;

    switch (operation) {
      case 'count':
        result = {
          count: await aggregationHelpers.count(mockModel, where),
        };
        break;

      case 'sum':
        result = {
          totalRevenue: await aggregationHelpers.sum(mockModel, 'total', where),
        };
        break;

      case 'avg':
        result = {
          averageOrderValue: await aggregationHelpers.avg(mockModel, 'total', where),
        };
        break;

      case 'minmax':
        result = await aggregationHelpers.minMax(mockModel, 'total', where);
        break;

      case 'stats':
        result = await aggregationHelpers.stats(mockModel, 'total', where);
        break;

      case 'groupby':
        result = await aggregationHelpers.groupBy(
          mockModel,
          'status',
          ['count', 'sum', 'avg'],
          { field: 'total' }
        );
        break;

      case 'performance':
        // Demonstrate performance difference
        const startApp = Date.now();
        const appSum = await performanceComparison.sumInApp(mockModel, 'total', where);
        const appTime = Date.now() - startApp;

        const startDb = Date.now();
        const dbSum = await performanceComparison.sumInDb(mockModel, 'total', where);
        const dbTime = Date.now() - startDb;

        result = {
          appLevel: {
            sum: appSum,
            timeMs: appTime,
            method: 'Fetch all records, sum in JavaScript',
          },
          dbLevel: {
            sum: dbSum,
            timeMs: dbTime,
            method: 'Compute in database, return only result',
          },
          improvement: `${Math.round((appTime / dbTime) * 100)}% faster`,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      filter: where,
      result,
      meta: {
        totalOrders: mockOrders.length,
        operations: ['count', 'sum', 'avg', 'minmax', 'stats', 'groupby', 'performance'],
      },
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform aggregation' },
      { status: 500 }
    );
  }
}
