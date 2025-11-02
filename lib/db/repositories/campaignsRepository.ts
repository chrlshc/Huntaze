import { getPool } from '../index';

export interface Campaign {
  id: number;
  userId: number;
  name: string;
  type: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  template?: any;
  targetAudience?: any;
  schedule?: any;
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    revenueCents: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CampaignsRepository {
  /**
   * Create a new campaign
   */
  static async createCampaign(
    userId: number,
    data: {
      name: string;
      type: string;
      status?: string;
      template?: any;
      targetAudience?: any;
      schedule?: any;
      metrics?: any;
    }
  ): Promise<Campaign> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO campaigns (
        user_id, name, type, status, template, target_audience, schedule, metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, user_id as "userId", name, type, status,
        template, target_audience as "targetAudience", schedule, metrics,
        started_at as "startedAt", completed_at as "completedAt",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        data.name,
        data.type,
        data.status || 'draft',
        JSON.stringify(data.template || {}),
        JSON.stringify(data.targetAudience || {}),
        JSON.stringify(data.schedule || {}),
        JSON.stringify(data.metrics || { sent: 0, delivered: 0, opened: 0, clicked: 0, revenueCents: 0 }),
      ]
    );
    return result.rows[0];
  }

  /**
   * Get a campaign by ID
   */
  static async getCampaign(userId: number, campaignId: number): Promise<Campaign | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", name, type, status,
        template, target_audience as "targetAudience", schedule, metrics,
        started_at as "startedAt", completed_at as "completedAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM campaigns 
      WHERE id = $1 AND user_id = $2`,
      [campaignId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update campaign metrics
   */
  static async updateCampaignMetrics(
    campaignId: number,
    metrics: Partial<Campaign['metrics']>
  ): Promise<void> {
    const pool = getPool();
    
    // Get current metrics
    const current = await pool.query(
      'SELECT metrics FROM campaigns WHERE id = $1',
      [campaignId]
    );
    
    if (current.rows.length === 0) return;
    
    const currentMetrics = current.rows[0].metrics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      revenueCents: 0,
    };
    
    // Merge with new metrics
    const updatedMetrics = {
      ...currentMetrics,
      ...metrics,
    };
    
    await pool.query(
      'UPDATE campaigns SET metrics = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(updatedMetrics), campaignId]
    );
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(
    campaignId: number,
    status: Campaign['status']
  ): Promise<void> {
    const pool = getPool();
    
    const updates: any = { status };
    
    if (status === 'active' && !updates.startedAt) {
      updates.startedAt = new Date();
    }
    
    if (status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }
    
    const setClause = Object.keys(updates)
      .map((key, idx) => `${key === 'startedAt' ? 'started_at' : key === 'completedAt' ? 'completed_at' : key} = $${idx + 1}`)
      .join(', ');
    
    await pool.query(
      `UPDATE campaigns SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${Object.keys(updates).length + 1}`,
      [...Object.values(updates), campaignId]
    );
  }

  /**
   * List campaigns for a user
   */
  static async listCampaigns(userId: number): Promise<Campaign[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", name, type, status,
        template, target_audience as "targetAudience", schedule, metrics,
        started_at as "startedAt", completed_at as "completedAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM campaigns 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}
