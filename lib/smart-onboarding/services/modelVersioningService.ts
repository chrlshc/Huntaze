import { ModelVersion, ModelMetadata, VersionComparison, ModelLineage } from '../types';
import { redisClient } from '../config/redis';
import { logger } from '../../utils/logger';

interface VersionRegistry {
  [modelId: string]: {
    versions: ModelVersion[];
    branches: ModelBranch[];
    tags: ModelTag[];
    lineage: ModelLineage;
  };
}

interface ModelBranch {
  name: string;
  baseVersion: string;
  headVersion: string;
  createdAt: Date;
  description: string;
  isActive: boolean;
}

interface ModelTag {
  name: string;
  version: string;
  createdAt: Date;
  description: string;
  metadata: Record<string, any>;
}

interface ModelDiff {
  modelId: string;
  fromVersion: string;
  toVersion: string;
  changes: {
    architecture: any[];
    parameters: any[];
    performance: any[];
    config: any[];
  };
  compatibility: 'compatible' | 'breaking' | 'unknown';
}

export class ModelVersioningService {
  private versionRegistry: VersionRegistry = {};
  private versioningConfig = {
    maxVersionsPerModel: 50,
    autoCleanupOldVersions: true,
    retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    compressionEnabled: true
  };

  constructor() {
    this.loadVersionRegistry();
    this.startCleanupScheduler();
  }

  /**
   * Create new model version
   */
  async createVersion(
    modelId: string,
    modelData: any,
    metadata: ModelMetadata,
    parentVersion?: string
  ): Promise<ModelVersion> {
    try {
      // Generate version number
      const version = await this.generateVersionNumber(modelId, metadata.versionType || 'minor');

      // Create version object
      const modelVersion: ModelVersion = {
        version,
        modelId,
        createdAt: new Date(),
        config: metadata.config,
        metrics: metadata.metrics,
        modelData: await this.compressModelData(modelData),
        status: 'created',
        deploymentStatus: 'pending',
        parentVersion,
        metadata: {
          ...metadata,
          size: this.calculateModelSize(modelData),
          checksum: await this.calculateChecksum(modelData),
          creator: metadata.creator || 'system',
          description: metadata.description || `Version ${version} of ${modelId}`,
          tags: metadata.tags || []
        }
      };

      // Store version
      await this.storeVersion(modelVersion);

      // Update registry
      await this.updateVersionRegistry(modelId, modelVersion);

      // Update lineage
      await this.updateModelLineage(modelId, modelVersion);

      logger.info('Model version created', {
        modelId,
        version,
        parentVersion,
        size: modelVersion.metadata?.size
      });

      return modelVersion;

    } catch (error) {
      logger.error('Failed to create model version', error instanceof Error ? error : new Error(String(error)), { modelId });
      throw error;
    }
  }

  /**
   * Get model version
   */
  async getVersion(modelId: string, version: string): Promise<ModelVersion | null> {
    try {
      const versionKey = `${modelId}:${version}`;
      const versionData = await redisClient.hget('ml_model_versions', versionKey);
      
      if (!versionData) {
        return null;
      }

      const modelVersion = JSON.parse(versionData);
      
      // Decompress model data if needed
      if (modelVersion.modelData && this.isCompressed(modelVersion.modelData)) {
        modelVersion.modelData = await this.decompressModelData(modelVersion.modelData);
      }

      return modelVersion;

    } catch (error) {
      logger.error('Failed to get model version', error instanceof Error ? error : new Error(String(error)), { modelId, version });
      return null;
    }
  }

  /**
   * List model versions
   */
  async listVersions(
    modelId: string,
    options: {
      limit?: number;
      offset?: number;
      branch?: string;
      tag?: string;
      status?: string;
    } = {}
  ): Promise<ModelVersion[]> {
    try {
      const registry = this.versionRegistry[modelId];
      if (!registry) {
        return [];
      }

      let versions = [...registry.versions];

      // Filter by branch
      if (options.branch) {
        const branch = registry.branches.find(b => b.name === options.branch);
        if (branch) {
          versions = versions.filter(v => this.isVersionInBranch(v, branch));
        }
      }

      // Filter by tag
      if (options.tag) {
        const tag = registry.tags.find(t => t.name === options.tag);
        if (tag) {
          versions = versions.filter(v => v.version === tag.version);
        }
      }

      // Filter by status
      if (options.status) {
        versions = versions.filter(v => v.status === options.status);
      }

      // Sort by creation date (newest first)
      versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      
      return versions.slice(offset, offset + limit);

    } catch (error) {
      logger.error('Failed to list model versions', error instanceof Error ? error : new Error(String(error)), { modelId });
      return [];
    }
  }

  /**
   * Compare model versions
   */
  async compareVersions(
    modelId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<VersionComparison> {
    try {
      const fromModel = await this.getVersion(modelId, fromVersion);
      const toModel = await this.getVersion(modelId, toVersion);

      if (!fromModel || !toModel) {
        throw new Error('One or both versions not found');
      }

      const comparison: VersionComparison = {
        modelId,
        fromVersion,
        toVersion,
        createdAt: new Date(),
        differences: {
          metrics: this.compareMetrics(fromModel.metrics, toModel.metrics),
          config: this.compareConfig(fromModel.config, toModel.config),
          architecture: this.compareArchitecture(fromModel.modelData, toModel.modelData),
          performance: this.comparePerformance(fromModel.metrics, toModel.metrics)
        },
        compatibility: this.assessCompatibility(fromModel, toModel),
        recommendation: this.generateRecommendation(fromModel, toModel)
      };

      // Store comparison for future reference
      await this.storeComparison(comparison);

      return comparison;

    } catch (error) {
      logger.error('Failed to compare model versions', error instanceof Error ? error : new Error(String(error)), { modelId, fromVersion, toVersion });
      throw error;
    }
  }

  /**
   * Create model branch
   */
  async createBranch(
    modelId: string,
    branchName: string,
    baseVersion: string,
    description: string = ''
  ): Promise<ModelBranch> {
    try {
      // Validate base version exists
      const baseModel = await this.getVersion(modelId, baseVersion);
      if (!baseModel) {
        throw new Error(`Base version ${baseVersion} not found`);
      }

      // Check if branch already exists
      const registry = this.versionRegistry[modelId];
      if (registry?.branches.find(b => b.name === branchName)) {
        throw new Error(`Branch ${branchName} already exists`);
      }

      const branch: ModelBranch = {
        name: branchName,
        baseVersion,
        headVersion: baseVersion,
        createdAt: new Date(),
        description,
        isActive: true
      };

      // Update registry
      if (!this.versionRegistry[modelId]) {
        this.versionRegistry[modelId] = { versions: [], branches: [], tags: [], lineage: { nodes: [], edges: [] } };
      }
      
      this.versionRegistry[modelId].branches.push(branch);
      await this.persistVersionRegistry(modelId);

      logger.info('Model branch created', { modelId, branchName, baseVersion });

      return branch;

    } catch (error) {
      logger.error('Failed to create model branch', error instanceof Error ? error : new Error(String(error)), { modelId, branchName });
      throw error;
    }
  }

  /**
   * Create model tag
   */
  async createTag(
    modelId: string,
    tagName: string,
    version: string,
    description: string = '',
    metadata: Record<string, any> = {}
  ): Promise<ModelTag> {
    try {
      // Validate version exists
      const modelVersion = await this.getVersion(modelId, version);
      if (!modelVersion) {
        throw new Error(`Version ${version} not found`);
      }

      // Check if tag already exists
      const registry = this.versionRegistry[modelId];
      if (registry?.tags.find(t => t.name === tagName)) {
        throw new Error(`Tag ${tagName} already exists`);
      }

      const tag: ModelTag = {
        name: tagName,
        version,
        createdAt: new Date(),
        description,
        metadata
      };

      // Update registry
      if (!this.versionRegistry[modelId]) {
        this.versionRegistry[modelId] = { versions: [], branches: [], tags: [], lineage: { nodes: [], edges: [] } };
      }
      
      this.versionRegistry[modelId].tags.push(tag);
      await this.persistVersionRegistry(modelId);

      logger.info('Model tag created', { modelId, tagName, version });

      return tag;

    } catch (error) {
      logger.error('Failed to create model tag', error instanceof Error ? error : new Error(String(error)), { modelId, tagName });
      throw error;
    }
  }

  /**
   * Get model lineage
   */
  async getModelLineage(modelId: string): Promise<ModelLineage> {
    try {
      const registry = this.versionRegistry[modelId];
      if (!registry) {
        return { nodes: [], edges: [] };
      }

      return registry.lineage;

    } catch (error) {
      logger.error('Failed to get model lineage', error instanceof Error ? error : new Error(String(error)), { modelId });
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Delete model version
   */
  async deleteVersion(modelId: string, version: string, force: boolean = false): Promise<void> {
    try {
      const modelVersion = await this.getVersion(modelId, version);
      if (!modelVersion) {
        throw new Error(`Version ${version} not found`);
      }

      // Check if version is deployed
      if (modelVersion.deploymentStatus === 'deployed' && !force) {
        throw new Error('Cannot delete deployed version without force flag');
      }

      // Check if version has dependents
      const dependents = await this.getVersionDependents(modelId, version);
      if (dependents.length > 0 && !force) {
        throw new Error(`Version has ${dependents.length} dependent versions. Use force to delete.`);
      }

      // Remove from storage
      const versionKey = `${modelId}:${version}`;
      await redisClient.hdel('ml_model_versions', versionKey);

      // Update registry
      const registry = this.versionRegistry[modelId];
      if (registry) {
        registry.versions = registry.versions.filter(v => v.version !== version);
        await this.persistVersionRegistry(modelId);
      }

      // Update lineage
      await this.removeFromLineage(modelId, version);

      logger.info('Model version deleted', { modelId, version, force });

    } catch (error) {
      logger.error('Failed to delete model version', error instanceof Error ? error : new Error(String(error)), { modelId, version });
      throw error;
    }
  }

  /**
   * Rollback to previous version
   */
  async rollbackToVersion(modelId: string, targetVersion: string): Promise<ModelVersion> {
    try {
      const targetModel = await this.getVersion(modelId, targetVersion);
      if (!targetModel) {
        throw new Error(`Target version ${targetVersion} not found`);
      }

      // Create rollback version
      const rollbackMetadata: ModelMetadata = {
        versionType: 'patch',
        config: targetModel.config,
        metrics: targetModel.metrics,
        description: `Rollback to version ${targetVersion}`,
        tags: ['rollback'],
        creator: 'system'
      };

      const rollbackVersion = await this.createVersion(
        modelId,
        targetModel.modelData,
        rollbackMetadata,
        targetVersion
      );

      logger.info('Model rolled back to version', { modelId, targetVersion, rollbackVersion: rollbackVersion.version });

      return rollbackVersion;

    } catch (error) {
      logger.error('Failed to rollback model version', error as Error, { modelId, targetVersion });
      throw error;
    }
  }

  /**
   * Export model version
   */
  async exportVersion(modelId: string, version: string, format: 'json' | 'binary' = 'json'): Promise<any> {
    try {
      const modelVersion = await this.getVersion(modelId, version);
      if (!modelVersion) {
        throw new Error(`Version ${version} not found`);
      }

      const exportData = {
        metadata: {
          modelId,
          version,
          exportedAt: new Date(),
          format
        },
        model: modelVersion,
        lineage: await this.getVersionLineage(modelId, version)
      };

      if (format === 'binary') {
        return this.serializeToBinary(exportData);
      }

      return exportData;

    } catch (error) {
      logger.error('Failed to export model version', error as Error, { modelId, version });
      throw error;
    }
  }

  /**
   * Import model version
   */
  async importVersion(importData: any): Promise<ModelVersion> {
    try {
      const { metadata, model } = importData;
      
      // Validate import data
      if (!model || !metadata) {
        throw new Error('Invalid import data format');
      }

      // Check if version already exists
      const existingVersion = await this.getVersion(model.modelId, model.version);
      if (existingVersion) {
        throw new Error(`Version ${model.version} already exists`);
      }

      // Store imported version
      await this.storeVersion(model);
      await this.updateVersionRegistry(model.modelId, model);

      logger.info('Model version imported', { modelId: model.modelId, version: model.version });

      return model;

    } catch (error) {
      logger.error('Failed to import model version', error as Error, { });
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async loadVersionRegistry(): Promise<void> {
    try {
      const registryData = await redisClient.get('ml_version_registry');
      if (registryData) {
        this.versionRegistry = JSON.parse(registryData);
      }
    } catch (error) {
      logger.error('Failed to load version registry', error as Error, { });
    }
  }

  private async persistVersionRegistry(modelId: string): Promise<void> {
    try {
      await redisClient.hset('ml_version_registry', modelId, JSON.stringify(this.versionRegistry[modelId]));
    } catch (error) {
      logger.error('Failed to persist version registry', error as Error, { modelId });
    }
  }

  private async generateVersionNumber(modelId: string, versionType: 'major' | 'minor' | 'patch'): Promise<string> {
    const registry = this.versionRegistry[modelId];
    const versions = registry?.versions || [];
    
    if (versions.length === 0) {
      return '1.0.0';
    }

    // Get latest version
    const latestVersion = versions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    
    const [major, minor, patch] = latestVersion.version.replace('v', '').split('.').map(Number);

    switch (versionType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  private async compressModelData(modelData: any): Promise<any> {
    if (!this.versioningConfig.compressionEnabled) {
      return modelData;
    }

    // Implement compression logic
    return {
      compressed: true,
      data: JSON.stringify(modelData), // Simplified compression
      originalSize: JSON.stringify(modelData).length
    };
  }

  private async decompressModelData(compressedData: any): Promise<any> {
    if (!this.isCompressed(compressedData)) {
      return compressedData;
    }

    // Implement decompression logic
    return JSON.parse(compressedData.data);
  }

  private isCompressed(data: any): boolean {
    return data && typeof data === 'object' && data.compressed === true;
  }

  private calculateModelSize(modelData: any): number {
    return JSON.stringify(modelData).length;
  }

  private async calculateChecksum(modelData: any): Promise<string> {
    // Simple checksum calculation
    const dataString = JSON.stringify(modelData);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async storeVersion(version: ModelVersion): Promise<void> {
    const versionKey = `${version.modelId}:${version.version}`;
    await redisClient.hset('ml_model_versions', versionKey, JSON.stringify(version));
  }

  private async updateVersionRegistry(modelId: string, version: ModelVersion): Promise<void> {
    if (!this.versionRegistry[modelId]) {
      this.versionRegistry[modelId] = { versions: [], branches: [], tags: [], lineage: { nodes: [], edges: [] } };
    }

    this.versionRegistry[modelId].versions.push(version);
    await this.persistVersionRegistry(modelId);
  }

  private async updateModelLineage(modelId: string, version: ModelVersion): Promise<void> {
    const registry = this.versionRegistry[modelId];
    if (!registry) return;

    // Add node to lineage
    registry.lineage.nodes.push({
      id: version.version,
      version: version.version,
      createdAt: version.createdAt,
      metadata: version.metadata
    });

    // Add edge if parent version exists
    if (version.parentVersion) {
      registry.lineage.edges.push({
        from: version.parentVersion,
        to: version.version,
        type: 'derived_from'
      });
    }

    await this.persistVersionRegistry(modelId);
  }

  private compareMetrics(metricsA: any, metricsB: any): any {
    const changes = [];
    
    for (const key in metricsA) {
      if (metricsB[key] !== undefined && metricsA[key] !== metricsB[key]) {
        changes.push({
          metric: key,
          from: metricsA[key],
          to: metricsB[key],
          change: metricsB[key] - metricsA[key]
        });
      }
    }

    return changes;
  }

  private compareConfig(configA: any, configB: any): any {
    // Deep comparison of configuration objects
    return this.deepCompare(configA, configB);
  }

  private compareArchitecture(modelA: any, modelB: any): any {
    // Compare model architectures
    return { changes: [], compatible: true };
  }

  private comparePerformance(metricsA: any, metricsB: any): any {
    const performanceMetrics = ['accuracy', 'precision', 'recall', 'f1Score'];
    const changes = [];

    for (const metric of performanceMetrics) {
      if (metricsA[metric] !== undefined && metricsB[metric] !== undefined) {
        const improvement = metricsB[metric] - metricsA[metric];
        changes.push({
          metric,
          improvement,
          percentage: (improvement / metricsA[metric]) * 100
        });
      }
    }

    return changes;
  }

  private assessCompatibility(fromModel: ModelVersion, toModel: ModelVersion): 'compatible' | 'breaking' | 'unknown' {
    // Assess compatibility between versions
    if (fromModel.config && toModel.config) {
      const configChanges = this.compareConfig(fromModel.config, toModel.config);
      if (configChanges.breaking && configChanges.breaking.length > 0) {
        return 'breaking';
      }
    }

    return 'compatible';
  }

  private generateRecommendation(fromModel: ModelVersion, toModel: ModelVersion): string {
    const performanceChanges = this.comparePerformance(fromModel.metrics, toModel.metrics);
    
    if (performanceChanges.some((change: any) => change.improvement > 0.05)) {
      return 'Upgrade recommended: Significant performance improvements detected';
    } else if (performanceChanges.some((change: any) => change.improvement < -0.02)) {
      return 'Caution: Performance regression detected';
    }

    return 'Neutral: No significant performance changes';
  }

  private async storeComparison(comparison: VersionComparison): Promise<void> {
    const comparisonKey = `${comparison.modelId}:${comparison.fromVersion}:${comparison.toVersion}`;
    await redisClient.hset('ml_version_comparisons', comparisonKey, JSON.stringify(comparison));
  }

  private isVersionInBranch(version: ModelVersion, branch: ModelBranch): boolean {
    // Check if version belongs to branch
    return version.version >= branch.baseVersion && version.version <= branch.headVersion;
  }

  private async getVersionDependents(modelId: string, version: string): Promise<string[]> {
    const registry = this.versionRegistry[modelId];
    if (!registry) return [];

    return registry.versions
      .filter(v => v.parentVersion === version)
      .map(v => v.version);
  }

  private async removeFromLineage(modelId: string, version: string): Promise<void> {
    const registry = this.versionRegistry[modelId];
    if (!registry) return;

    // Remove node and associated edges
    registry.lineage.nodes = registry.lineage.nodes.filter(n => n.version !== version);
    registry.lineage.edges = registry.lineage.edges.filter(e => e.from !== version && e.to !== version);

    await this.persistVersionRegistry(modelId);
  }

  private async getVersionLineage(modelId: string, version: string): Promise<any> {
    const registry = this.versionRegistry[modelId];
    if (!registry) return null;

    // Get lineage path for specific version
    const path = [];
    let currentVersion = version;

    while (currentVersion) {
      const node = registry.lineage.nodes.find(n => n.version === currentVersion);
      if (node) {
        path.unshift(node);
        const parentEdge = registry.lineage.edges.find(e => e.to === currentVersion);
        currentVersion = parentEdge?.from ?? '';
        if (!currentVersion) break;
      } else {
        break;
      }
    }

    return path;
  }

  private serializeToBinary(data: any): Buffer {
    // Convert to binary format
    return Buffer.from(JSON.stringify(data));
  }

  private deepCompare(objA: any, objB: any): any {
    const changes: { added: string[]; removed: string[]; modified: any[]; breaking: any[] } = { 
      added: [], 
      removed: [], 
      modified: [], 
      breaking: [] 
    };
    
    // Simple deep comparison implementation
    const keysA = Object.keys(objA || {});
    const keysB = Object.keys(objB || {});
    
    for (const key of keysA) {
      if (!(key in objB)) {
        changes.removed.push(key);
      } else if (objA[key] !== objB[key]) {
        changes.modified.push({ key, from: objA[key], to: objB[key] });
      }
    }
    
    for (const key of keysB) {
      if (!(key in objA)) {
        changes.added.push(key);
      }
    }
    
    return changes;
  }

  private startCleanupScheduler(): void {
    setInterval(async () => {
      if (this.versioningConfig.autoCleanupOldVersions) {
        await this.cleanupOldVersions();
      }
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private async cleanupOldVersions(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.versioningConfig.retentionPeriod);
      
      for (const [modelId, registry] of Object.entries(this.versionRegistry)) {
        const oldVersions = registry.versions.filter(v => 
          v.createdAt < cutoffDate && 
          v.deploymentStatus !== 'deployed' &&
          registry.versions.length > this.versioningConfig.maxVersionsPerModel
        );

        for (const version of oldVersions) {
          try {
            await this.deleteVersion(modelId, version.version, true);
            logger.info('Old version cleaned up', { modelId, version: version.version });
          } catch (error) {
            logger.error('Failed to cleanup old version', error as Error, { modelId, version: version.version });
          }
        }
      }
    } catch (error) {
      logger.error('Version cleanup failed', error as Error, { });
    }
  }
}

export const modelVersioningService = new ModelVersioningService();
