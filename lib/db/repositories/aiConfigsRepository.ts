import { getPool } from '../index';

export interface AIConfig {
  userId: number;
  personality?: string;
  responseStyle?: string;
  tone?: string;
  responseLength?: string;
  platforms?: string[];
  customResponses?: any[];
  pricing?: any;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export class AIConfigsRepository {
  static async getConfig(userId: number): Promise<AIConfig | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        user_id as "userId", personality, response_style as "responseStyle",
        tone, response_length as "responseLength", platforms, custom_responses as "customResponses",
        pricing, enabled,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM ai_configs 
      WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async upsertConfig(userId: number, data: Partial<AIConfig>): Promise<AIConfig> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO ai_configs (
        user_id, personality, response_style, tone, response_length,
        platforms, custom_responses, pricing, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        personality = COALESCE(EXCLUDED.personality, ai_configs.personality),
        response_style = COALESCE(EXCLUDED.response_style, ai_configs.response_style),
        tone = COALESCE(EXCLUDED.tone, ai_configs.tone),
        response_length = COALESCE(EXCLUDED.response_length, ai_configs.response_length),
        platforms = COALESCE(EXCLUDED.platforms, ai_configs.platforms),
        custom_responses = COALESCE(EXCLUDED.custom_responses, ai_configs.custom_responses),
        pricing = COALESCE(EXCLUDED.pricing, ai_configs.pricing),
        enabled = COALESCE(EXCLUDED.enabled, ai_configs.enabled),
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        user_id as "userId", personality, response_style as "responseStyle",
        tone, response_length as "responseLength", platforms, custom_responses as "customResponses",
        pricing, enabled,
        created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        data.personality || null,
        data.responseStyle || null,
        data.tone || null,
        data.responseLength || null,
        JSON.stringify(data.platforms || []),
        JSON.stringify(data.customResponses || []),
        JSON.stringify(data.pricing || {}),
        data.enabled !== undefined ? data.enabled : true
      ]
    );
    return result.rows[0];
  }
}
