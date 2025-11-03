import { db } from '../index';

export interface Template {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  category: string;
  structure: TemplateStructure;
  previewUrl?: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface TemplateStructure {
  text: string;
  placeholders?: Array<{
    id: string;
    label: string;
    type: 'text' | 'image' | 'video';
  }>;
  mediaSlots?: Array<{
    id: string;
    type: 'image' | 'video';
    required: boolean;
  }>;
  suggestedPlatforms?: string[];
}

export interface CreateTemplateData {
  userId?: string;
  name: string;
  description?: string;
  category: string;
  structure: TemplateStructure;
  previewUrl?: string;
  isPublic?: boolean;
}

export const templatesRepository = {
  /**
   * Create a new template
   */
  async create(data: CreateTemplateData): Promise<Template> {
    const query = `
      INSERT INTO templates (
        user_id, name, description, category, structure, preview_url, is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, user_id as "userId", name, description, category, structure,
        preview_url as "previewUrl", is_public as "isPublic",
        usage_count as "usageCount", created_at as "createdAt"
    `;

    const values = [
      data.userId || null,
      data.name,
      data.description || null,
      data.category,
      JSON.stringify(data.structure),
      data.previewUrl || null,
      data.isPublic || false,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  /**
   * Get template by ID
   */
  async findById(id: string): Promise<Template | null> {
    const query = `
      SELECT 
        id, user_id as "userId", name, description, category, structure,
        preview_url as "previewUrl", is_public as "isPublic",
        usage_count as "usageCount", created_at as "createdAt"
      FROM templates
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Get templates with filters
   */
  async find(options: {
    userId?: string;
    category?: string;
    isPublic?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Template[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (options.userId !== undefined) {
      paramCount++;
      conditions.push(`(user_id = $${paramCount} OR is_public = true)`);
      values.push(options.userId);
    } else if (options.isPublic !== undefined) {
      paramCount++;
      conditions.push(`is_public = $${paramCount}`);
      values.push(options.isPublic);
    }

    if (options.category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      values.push(options.category);
    }

    if (options.search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${options.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id, user_id as "userId", name, description, category, structure,
        preview_url as "previewUrl", is_public as "isPublic",
        usage_count as "usageCount", created_at as "createdAt"
      FROM templates
      ${whereClause}
      ORDER BY usage_count DESC, created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(options.limit || 50, options.offset || 0);

    const result = await db.query(query, values);
    return result.rows;
  },

  /**
   * Get templates by category
   */
  async findByCategory(category: string, userId?: string): Promise<Template[]> {
    return this.find({ category, userId, isPublic: true });
  },

  /**
   * Get user's custom templates
   */
  async findByUser(userId: string): Promise<Template[]> {
    const query = `
      SELECT 
        id, user_id as "userId", name, description, category, structure,
        preview_url as "previewUrl", is_public as "isPublic",
        usage_count as "usageCount", created_at as "createdAt"
      FROM templates
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  },

  /**
   * Increment template usage count
   */
  async incrementUsage(id: string): Promise<void> {
    const query = 'UPDATE templates SET usage_count = usage_count + 1 WHERE id = $1';
    await db.query(query, [id]);
  },

  /**
   * Update template
   */
  async update(
    id: string,
    data: Partial<CreateTemplateData>
  ): Promise<Template | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(data.description);
    }

    if (data.category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      values.push(data.category);
    }

    if (data.structure !== undefined) {
      paramCount++;
      updates.push(`structure = $${paramCount}`);
      values.push(JSON.stringify(data.structure));
    }

    if (data.previewUrl !== undefined) {
      paramCount++;
      updates.push(`preview_url = $${paramCount}`);
      values.push(data.previewUrl);
    }

    if (data.isPublic !== undefined) {
      paramCount++;
      updates.push(`is_public = $${paramCount}`);
      values.push(data.isPublic);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE templates
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, user_id as "userId", name, description, category, structure,
        preview_url as "previewUrl", is_public as "isPublic",
        usage_count as "usageCount", created_at as "createdAt"
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  /**
   * Delete template
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM templates WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  },

  /**
   * Get most used templates
   */
  async getMostUsed(limit: number = 10): Promise<Template[]> {
    const query = `
      SELECT 
        id, user_id as "userId", name, description, category, structure,
        preview_url as "previewUrl", is_public as "isPublic",
        usage_count as "usageCount", created_at as "createdAt"
      FROM templates
      WHERE is_public = true
      ORDER BY usage_count DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  },
};

// Export as class for compatibility
export class TemplatesRepository {
  static create = templatesRepository.create;
  static findById = templatesRepository.findById;
  static find = templatesRepository.find;
  static findByCategory = templatesRepository.findByCategory;
  static findByUser = templatesRepository.findByUser;
  static incrementUsage = templatesRepository.incrementUsage;
  static update = templatesRepository.update;
  static delete = templatesRepository.delete;
  static getMostUsed = templatesRepository.getMostUsed;
}
