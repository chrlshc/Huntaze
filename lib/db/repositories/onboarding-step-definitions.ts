/**
 * Onboarding Step Definitions Repository
 * 
 * Handles CRUD operations for onboarding step definitions with versioning,
 * market-specific filtering, and role-based visibility.
 */

import { Pool } from 'pg';

export interface StepDefinition {
  id: string;
  version: number;
  title: string;
  description?: string;
  required: boolean;
  weight: number;
  roleVisibility: string[];
  marketRule?: {
    markets?: string[];
    [key: string]: any;
  };
  requiredPlan?: string;
  activeFrom?: Date;
  activeTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStepDefinitionInput {
  id: string;
  version?: number;
  title: string;
  description?: string;
  required?: boolean;
  weight?: number;
  roleVisibility?: string[];
  marketRule?: Record<string, any>;
  requiredPlan?: string;
  activeFrom?: Date;
  activeTo?: Date;
}

export interface UpdateStepDefinitionInput {
  title?: string;
  description?: string;
  required?: boolean;
  weight?: number;
  roleVisibility?: string[];
  marketRule?: Record<string, any>;
  requiredPlan?: string;
  activeFrom?: Date;
  activeTo?: Date;
}

export class OnboardingStepDefinitionsRepository {
  constructor(private pool: Pool) {}

  /**
   * Get all active steps, optionally filtered by market and role
   */
  async getActiveSteps(options?: {
    market?: string;
    role?: string;
  }): Promise<StepDefinition[]> {
    const { market, role } = options || {};
    
    let query = `
      SELECT 
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility as "roleVisibility",
        market_rule as "marketRule",
        required_plan as "requiredPlan",
        active_from as "activeFrom",
        active_to as "activeTo",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM onboarding_step_definitions
      WHERE (active_from IS NULL OR active_from <= NOW())
        AND (active_to IS NULL OR active_to >= NOW())
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filter by market if provided
    if (market) {
      query += ` AND (market_rule IS NULL OR market_rule @> $${paramIndex}::jsonb)`;
      params.push(JSON.stringify({ markets: [market] }));
      paramIndex++;
    }
    
    // Filter by role if provided
    if (role) {
      query += ` AND $${paramIndex} = ANY(role_visibility)`;
      params.push(role);
      paramIndex++;
    }
    
    query += ` ORDER BY weight DESC, id ASC`;
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get a specific step definition by ID and version
   */
  async getStepById(id: string, version?: number): Promise<StepDefinition | null> {
    let query = `
      SELECT 
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility as "roleVisibility",
        market_rule as "marketRule",
        required_plan as "requiredPlan",
        active_from as "activeFrom",
        active_to as "activeTo",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM onboarding_step_definitions
      WHERE id = $1
    `;
    
    const params: any[] = [id];
    
    if (version !== undefined) {
      query += ` AND version = $2`;
      params.push(version);
    } else {
      query += ` ORDER BY version DESC LIMIT 1`;
    }
    
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Get all versions of a step
   */
  async getStepVersions(id: string): Promise<StepDefinition[]> {
    const query = `
      SELECT 
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility as "roleVisibility",
        market_rule as "marketRule",
        required_plan as "requiredPlan",
        active_from as "activeFrom",
        active_to as "activeTo",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM onboarding_step_definitions
      WHERE id = $1
      ORDER BY version DESC
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows;
  }

  /**
   * Create a new step definition
   */
  async createStep(input: CreateStepDefinitionInput): Promise<StepDefinition> {
    const {
      id,
      version = 1,
      title,
      description,
      required = false,
      weight = 0,
      roleVisibility = ['owner', 'staff', 'admin'],
      marketRule,
      requiredPlan,
      activeFrom,
      activeTo
    } = input;
    
    const query = `
      INSERT INTO onboarding_step_definitions (
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility,
        market_rule,
        required_plan,
        active_from,
        active_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility as "roleVisibility",
        market_rule as "marketRule",
        required_plan as "requiredPlan",
        active_from as "activeFrom",
        active_to as "activeTo",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const result = await this.pool.query(query, [
      id,
      version,
      title,
      description,
      required,
      weight,
      roleVisibility,
      marketRule ? JSON.stringify(marketRule) : null,
      requiredPlan,
      activeFrom,
      activeTo
    ]);
    
    return result.rows[0];
  }

  /**
   * Update a step definition
   */
  async updateStep(
    id: string,
    version: number,
    input: UpdateStepDefinitionInput
  ): Promise<StepDefinition | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(input.title);
      paramIndex++;
    }
    
    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(input.description);
      paramIndex++;
    }
    
    if (input.required !== undefined) {
      updates.push(`required = $${paramIndex}`);
      params.push(input.required);
      paramIndex++;
    }
    
    if (input.weight !== undefined) {
      updates.push(`weight = $${paramIndex}`);
      params.push(input.weight);
      paramIndex++;
    }
    
    if (input.roleVisibility !== undefined) {
      updates.push(`role_visibility = $${paramIndex}`);
      params.push(input.roleVisibility);
      paramIndex++;
    }
    
    if (input.marketRule !== undefined) {
      updates.push(`market_rule = $${paramIndex}`);
      params.push(JSON.stringify(input.marketRule));
      paramIndex++;
    }
    
    if (input.requiredPlan !== undefined) {
      updates.push(`required_plan = $${paramIndex}`);
      params.push(input.requiredPlan);
      paramIndex++;
    }
    
    if (input.activeFrom !== undefined) {
      updates.push(`active_from = $${paramIndex}`);
      params.push(input.activeFrom);
      paramIndex++;
    }
    
    if (input.activeTo !== undefined) {
      updates.push(`active_to = $${paramIndex}`);
      params.push(input.activeTo);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return this.getStepById(id, version);
    }
    
    const query = `
      UPDATE onboarding_step_definitions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND version = $${paramIndex + 1}
      RETURNING 
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility as "roleVisibility",
        market_rule as "marketRule",
        required_plan as "requiredPlan",
        active_from as "activeFrom",
        active_to as "activeTo",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    params.push(id, version);
    
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Create a new version of a step (for migration)
   */
  async createNewVersion(
    id: string,
    input: Partial<CreateStepDefinitionInput>
  ): Promise<StepDefinition> {
    // Get the latest version
    const latestVersion = await this.getStepById(id);
    
    if (!latestVersion) {
      throw new Error(`Step ${id} not found`);
    }
    
    const newVersion = latestVersion.version + 1;
    
    // Create new version with merged data
    return this.createStep({
      id,
      version: newVersion,
      title: input.title || latestVersion.title,
      description: input.description !== undefined ? input.description : latestVersion.description,
      required: input.required !== undefined ? input.required : latestVersion.required,
      weight: input.weight !== undefined ? input.weight : latestVersion.weight,
      roleVisibility: input.roleVisibility || latestVersion.roleVisibility,
      marketRule: input.marketRule !== undefined ? input.marketRule : latestVersion.marketRule,
      requiredPlan: input.requiredPlan !== undefined ? input.requiredPlan : latestVersion.requiredPlan,
      activeFrom: input.activeFrom || new Date(),
      activeTo: input.activeTo
    });
  }

  /**
   * Deactivate a step (set active_to to now)
   */
  async deactivateStep(id: string, version: number): Promise<StepDefinition | null> {
    const query = `
      UPDATE onboarding_step_definitions
      SET active_to = NOW()
      WHERE id = $1 AND version = $2
      RETURNING 
        id,
        version,
        title,
        description,
        required,
        weight,
        role_visibility as "roleVisibility",
        market_rule as "marketRule",
        required_plan as "requiredPlan",
        active_from as "activeFrom",
        active_to as "activeTo",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const result = await this.pool.query(query, [id, version]);
    return result.rows[0] || null;
  }

  /**
   * Delete a step definition (use with caution)
   */
  async deleteStep(id: string, version: number): Promise<boolean> {
    const query = `
      DELETE FROM onboarding_step_definitions
      WHERE id = $1 AND version = $2
    `;
    
    const result = await this.pool.query(query, [id, version]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get steps filtered by market rules
   */
  async getStepsByMarket(market: string): Promise<StepDefinition[]> {
    return this.getActiveSteps({ market });
  }

  /**
   * Get required steps only
   */
  async getRequiredSteps(options?: {
    market?: string;
    role?: string;
  }): Promise<StepDefinition[]> {
    const steps = await this.getActiveSteps(options);
    return steps.filter(step => step.required);
  }
}
