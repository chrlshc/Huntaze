import { query } from '../db/index';

export interface ProductivityMetrics {
  contentCreated: {
    total: number;
    byPeriod: Array<{ date: string; count: number }>;
    byStatus: Record<string, number>;
  };
  averageCreationTime: {
    overall: number; // in minutes
    byContentType: Record<string, number>;
  };
  templateUsage: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
  }>;
  mediaUsage: {
    totalUploads: number;
    totalSize: number;
    byType: Record<string, number>;
  };
  platformDistribution: Record<string, number>;
  productivity: {
    contentPerDay: number;
    contentPerWeek: number;
    contentPerMonth: number;
  };
}

export const productivityMetricsService = {
  async getMetrics(userId: string, startDate: Date, endDate: Date): Promise<ProductivityMetrics> {
    // Content created metrics
    const contentCreated = await query(
      `SELECT 
        COUNT(*) as total,
        status,
        DATE(created_at) as date
       FROM content_items
       WHERE user_id = $1 
         AND created_at >= $2 
         AND created_at <= $3
       GROUP BY status, DATE(created_at)
       ORDER BY date DESC`,
      [userId, startDate, endDate]
    );

    // Calculate by period
    const byPeriod: Array<{ date: string; count: number }> = [];
    const byStatus: Record<string, number> = {};
    let totalContent = 0;

    contentCreated.rows.forEach(row => {
      totalContent += parseInt(row.count);
      byStatus[row.status] = (byStatus[row.status] || 0) + parseInt(row.count);
      
      const existingDate = byPeriod.find(p => p.date === row.date);
      if (existingDate) {
        existingDate.count += parseInt(row.count);
      } else {
        byPeriod.push({ date: row.date, count: parseInt(row.count) });
      }
    });

    // Average creation time (simplified - based on time between creation and first update)
    const creationTimes = await query(
      `SELECT 
        EXTRACT(EPOCH FROM (updated_at - created_at))/60 as minutes,
        category
       FROM content_items
       WHERE user_id = $1 
         AND created_at >= $2 
         AND created_at <= $3
         AND updated_at > created_at
         AND status != 'draft'`,
      [userId, startDate, endDate]
    );

    let totalMinutes = 0;
    const byContentType: Record<string, { total: number; count: number }> = {};

    creationTimes.rows.forEach(row => {
      const minutes = parseFloat(row.minutes);
      totalMinutes += minutes;
      
      if (row.category) {
        if (!byContentType[row.category]) {
          byContentType[row.category] = { total: 0, count: 0 };
        }
        byContentType[row.category].total += minutes;
        byContentType[row.category].count++;
      }
    });

    const averageCreationTime = {
      overall: creationTimes.rows.length > 0 ? totalMinutes / creationTimes.rows.length : 0,
      byContentType: Object.entries(byContentType).reduce((acc, [key, val]) => {
        acc[key] = val.total / val.count;
        return acc;
      }, {} as Record<string, number>)
    };

    // Template usage
    const templateUsage = await query(
      `SELECT 
        t.id as template_id,
        t.name as template_name,
        COUNT(*) as usage_count
       FROM content_items ci
       JOIN templates t ON (ci.metadata->>'template_id')::uuid = t.id
       WHERE ci.user_id = $1 
         AND ci.created_at >= $2 
         AND ci.created_at <= $3
       GROUP BY t.id, t.name
       ORDER BY usage_count DESC
       LIMIT 10`,
      [userId, startDate, endDate]
    );

    // Media usage
    const mediaUsage = await query(
      `SELECT 
        COUNT(*) as total_uploads,
        SUM(size_bytes) as total_size,
        type,
        COUNT(*) as type_count
       FROM media_assets
       WHERE user_id = $1 
         AND uploaded_at >= $2 
         AND uploaded_at <= $3
       GROUP BY type`,
      [userId, startDate, endDate]
    );

    const mediaMetrics = {
      totalUploads: 0,
      totalSize: 0,
      byType: {} as Record<string, number>
    };

    mediaUsage.rows.forEach(row => {
      mediaMetrics.totalUploads += parseInt(row.type_count);
      mediaMetrics.totalSize += parseInt(row.total_size || 0);
      mediaMetrics.byType[row.type] = parseInt(row.type_count);
    });

    // Platform distribution
    const platformDist = await query(
      `SELECT 
        cp.platform,
        COUNT(*) as count
       FROM content_platforms cp
       JOIN content_items ci ON cp.content_id = ci.id
       WHERE ci.user_id = $1 
         AND ci.created_at >= $2 
         AND ci.created_at <= $3
       GROUP BY cp.platform
       ORDER BY count DESC`,
      [userId, startDate, endDate]
    );

    const platformDistribution: Record<string, number> = {};
    platformDist.rows.forEach(row => {
      platformDistribution[row.platform] = parseInt(row.count);
    });

    // Productivity rates
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksDiff = daysDiff / 7;
    const monthsDiff = daysDiff / 30;

    return {
      contentCreated: {
        total: totalContent,
        byPeriod,
        byStatus
      },
      averageCreationTime,
      templateUsage: templateUsage.rows.map(row => ({
        templateId: row.template_id,
        templateName: row.template_name,
        usageCount: parseInt(row.usage_count)
      })),
      mediaUsage: mediaMetrics,
      platformDistribution,
      productivity: {
        contentPerDay: totalContent / daysDiff,
        contentPerWeek: totalContent / weeksDiff,
        contentPerMonth: totalContent / monthsDiff
      }
    };
  },

  async trackContentEvent(userId: string, contentId: string, eventType: 'created' | 'edited' | 'published') {
    // This could be expanded to track detailed events in a separate table
    // For now, we rely on the content_items timestamps
    console.log(`[Metrics] ${eventType} event for content ${contentId} by user ${userId}`);
  }
};
