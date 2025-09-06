// AI Compliance & Governance System
// Ensures GDPR compliance, platform policies, and ethical AI usage

import { EventEmitter } from 'events';
import crypto from 'crypto';

// Data Types and Classifications
export interface DataClassification {
  type: 'personal' | 'behavioral' | 'financial' | 'content' | 'metadata';
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  retention: number; // days
  anonymizable: boolean;
  requiresConsent: boolean;
}

export interface ComplianceCheck {
  id: string;
  timestamp: Date;
  dataType: string;
  platform: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  verdict: 'approved' | 'rejected' | 'requires_review';
  reasons: string[];
  reviewer?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  actor: string; // AI or human
  data: any;
  outcome: string;
  reviewed: boolean;
  reviewer?: string;
}

// GDPR Compliance Manager
export class GDPRComplianceManager {
  private dataInventory = new Map<string, DataClassification>();
  private consentRecords = new Map<string, ConsentRecord>();
  private deletionQueue = new Map<string, Date>();
  
  constructor() {
    this.initializeDataClassifications();
    this.startDeletionProcessor();
  }
  
  private initializeDataClassifications() {
    // Define data types and their classifications
    this.dataInventory.set('fan_message', {
      type: 'personal',
      sensitivity: 'confidential',
      retention: 90,
      anonymizable: true,
      requiresConsent: true
    });
    
    this.dataInventory.set('purchase_history', {
      type: 'financial',
      sensitivity: 'restricted',
      retention: 365 * 2, // 2 years for tax
      anonymizable: false,
      requiresConsent: true
    });
    
    this.dataInventory.set('engagement_metrics', {
      type: 'behavioral',
      sensitivity: 'internal',
      retention: 180,
      anonymizable: true,
      requiresConsent: false
    });
    
    this.dataInventory.set('ai_insights', {
      type: 'metadata',
      sensitivity: 'internal',
      retention: 90,
      anonymizable: true,
      requiresConsent: false
    });
  }
  
  // Process data before AI learning
  sanitizeForLearning(data: any, dataType: string): any {
    const classification = this.dataInventory.get(dataType);
    if (!classification) {
      throw new Error(`Unknown data type: ${dataType}`);
    }
    
    if (classification.sensitivity === 'restricted') {
      // Never share restricted data
      return null;
    }
    
    // Anonymize personal data
    if (classification.type === 'personal') {
      return this.anonymizeData(data);
    }
    
    // Remove sensitive fields
    const sanitized = { ...data };
    delete sanitized.realName;
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.address;
    delete sanitized.creditCard;
    
    return sanitized;
  }
  
  private anonymizeData(data: any): any {
    const anonymized = { ...data };
    
    // Hash identifiers
    if (anonymized.userId) {
      anonymized.userId = this.hashId(anonymized.userId);
    }
    if (anonymized.fanId) {
      anonymized.fanId = this.hashId(anonymized.fanId);
    }
    
    // Generalize location data
    if (anonymized.location) {
      anonymized.location = this.generalizeLocation(anonymized.location);
    }
    
    // Remove direct identifiers
    delete anonymized.username;
    delete anonymized.displayName;
    
    return anonymized;
  }
  
  private hashId(id: string): string {
    return crypto.createHash('sha256').update(id).digest('hex').substring(0, 16);
  }
  
  private generalizeLocation(location: string): string {
    // Only keep country/state level
    const parts = location.split(',');
    return parts.slice(-2).join(',').trim();
  }
  
  // Handle data deletion requests
  async processRightToErasure(userId: string): Promise<void> {
    console.log(`Processing erasure request for user ${userId}`);
    
    // Mark for deletion
    this.deletionQueue.set(userId, new Date());
    
    // Immediate actions
    await this.deletePersonalData(userId);
    await this.anonymizeHistoricalData(userId);
    await this.notifyAITeam(userId);
  }
  
  private async deletePersonalData(userId: string): Promise<void> {
    // Delete from all systems
    console.log(`Deleting personal data for ${userId}`);
  }
  
  private async anonymizeHistoricalData(userId: string): Promise<void> {
    // Keep aggregated data but anonymize
    console.log(`Anonymizing historical data for ${userId}`);
  }
  
  private async notifyAITeam(userId: string): Promise<void> {
    // Tell AIs to forget this user
    console.log(`Notifying AI team to forget ${userId}`);
  }
  
  private startDeletionProcessor() {
    // Process deletion queue daily
    setInterval(() => {
      this.deletionQueue.forEach((date, userId) => {
        const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 30) {
          // Final deletion after 30 day grace period
          this.finalDelete(userId);
          this.deletionQueue.delete(userId);
        }
      });
    }, 24 * 60 * 60 * 1000); // Daily
  }
  
  private finalDelete(userId: string) {
    console.log(`Final deletion completed for ${userId}`);
  }
  
  // Export user data for portability
  async exportUserData(userId: string): Promise<any> {
    return {
      profile: await this.getProfile(userId),
      messages: await this.getMessages(userId),
      purchases: await this.getPurchases(userId),
      aiInsights: await this.getAIInsights(userId),
      exportDate: new Date(),
      format: 'json'
    };
  }
  
  private async getProfile(userId: string) { return {}; }
  private async getMessages(userId: string) { return []; }
  private async getPurchases(userId: string) { return []; }
  private async getAIInsights(userId: string) { return []; }
}

// Platform Policy Enforcer
export class PlatformPolicyEnforcer {
  private policies = new Map<string, PolicyRules>();
  
  constructor() {
    this.loadPlatformPolicies();
  }
  
  private loadPlatformPolicies() {
    // Instagram policies
    this.policies.set('instagram', {
      forbidden: [
        'direct OF mentions',
        'payment processing',
        'nude content in DMs',
        'spam messaging'
      ],
      rateLimit: {
        messagesPerHour: 20,
        messagesPerDay: 100,
        uniqueRecipientsPerDay: 50
      },
      contentRules: {
        maxMessageLength: 1000,
        maxEmojis: 20,
        requireHumanTouch: true
      }
    });
    
    // TikTok policies
    this.policies.set('tiktok', {
      forbidden: [
        'adult content solicitation',
        'external payment links',
        'regulated goods',
        'misleading content'
      ],
      rateLimit: {
        commentsPerHour: 50,
        messagesPerDay: 0, // No DM automation
        uniqueRecipientsPerDay: 0
      },
      contentRules: {
        maxCommentLength: 150,
        zeroToleranceSolicitation: true,
        requireModeration: true
      }
    });
    
    // Reddit policies
    this.policies.set('reddit', {
      forbidden: [
        'vote manipulation',
        'ban evasion',
        'unwanted messaging',
        'deceptive practices'
      ],
      rateLimit: {
        postsPerDay: 10,
        commentsPerHour: 30,
        messagesPerDay: 20
      },
      contentRules: {
        respectSubredditRules: true,
        requireAuthenticity: true,
        noAutomatedDMs: true
      }
    });
  }
  
  // Check if content/action is allowed
  async checkCompliance(
    platform: string,
    action: string,
    content: string
  ): Promise<ComplianceCheck> {
    const policy = this.policies.get(platform);
    if (!policy) {
      throw new Error(`Unknown platform: ${platform}`);
    }
    
    const check: ComplianceCheck = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      dataType: action,
      platform: platform as any,
      verdict: 'approved',
      reasons: []
    };
    
    // Check forbidden content
    for (const forbidden of policy.forbidden) {
      if (this.containsForbidden(content, forbidden)) {
        check.verdict = 'rejected';
        check.reasons.push(`Contains forbidden: ${forbidden}`);
      }
    }
    
    // Check content rules
    if (content.length > (policy.contentRules.maxMessageLength || 1000)) {
      check.verdict = 'rejected';
      check.reasons.push('Message too long');
    }
    
    // Flag for human review if needed
    if (policy.contentRules.requireHumanTouch && action === 'automated_message') {
      check.verdict = 'requires_review';
      check.reasons.push('Platform requires human touch');
    }
    
    return check;
  }
  
  private containsForbidden(content: string, forbidden: string): boolean {
    const lowerContent = content.toLowerCase();
    const keywords = forbidden.toLowerCase().split(' ');
    return keywords.some(keyword => lowerContent.includes(keyword));
  }
  
  // Rate limiting
  async checkRateLimit(
    platform: string,
    userId: string,
    action: string
  ): Promise<boolean> {
    const policy = this.policies.get(platform);
    if (!policy) return false;
    
    // Check against rate limits
    // In production, this would check Redis/database
    return true;
  }
}

// Human Oversight System
export class HumanOversightSystem extends EventEmitter {
  private auditLogs: AuditLog[] = [];
  private reviewQueue: ReviewItem[] = [];
  private approvalThresholds = {
    pricing: 100, // Require review for prices > $100
    massMessage: 50, // Require review for messages to > 50 fans
    aiConfidence: 0.7 // Require review if AI confidence < 70%
  };
  
  // Log all AI decisions
  logDecision(decision: {
    actor: string;
    action: string;
    data: any;
    confidence: number;
  }): string {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action: decision.action,
      actor: decision.actor,
      data: decision.data,
      outcome: 'pending',
      reviewed: false
    };
    
    this.auditLogs.push(log);
    
    // Check if human review needed
    if (this.requiresReview(decision)) {
      this.addToReviewQueue(log, decision);
    }
    
    return log.id;
  }
  
  private requiresReview(decision: any): boolean {
    // High-value decisions
    if (decision.action === 'set_price' && decision.data.price > this.approvalThresholds.pricing) {
      return true;
    }
    
    // Mass communications
    if (decision.action === 'send_message' && decision.data.recipients > this.approvalThresholds.massMessage) {
      return true;
    }
    
    // Low confidence AI decisions
    if (decision.confidence < this.approvalThresholds.aiConfidence) {
      return true;
    }
    
    // Crisis situations
    if (decision.action === 'crisis_response') {
      return true;
    }
    
    return false;
  }
  
  private addToReviewQueue(log: AuditLog, decision: any) {
    const reviewItem: ReviewItem = {
      id: log.id,
      priority: this.calculatePriority(decision),
      deadline: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      description: `${decision.actor} wants to ${decision.action}`,
      data: decision.data,
      suggestedAction: decision.data.message || decision.data.action
    };
    
    this.reviewQueue.push(reviewItem);
    this.emit('review_required', reviewItem);
  }
  
  private calculatePriority(decision: any): 'low' | 'medium' | 'high' | 'critical' {
    if (decision.action === 'crisis_response') return 'critical';
    if (decision.data.price > 200) return 'high';
    if (decision.data.recipients > 100) return 'high';
    if (decision.confidence < 0.5) return 'medium';
    return 'low';
  }
  
  // Human approves/rejects decision
  async reviewDecision(
    logId: string,
    verdict: 'approved' | 'rejected' | 'modified',
    reviewer: string,
    notes?: string,
    modifications?: any
  ): Promise<void> {
    const log = this.auditLogs.find(l => l.id === logId);
    if (!log) throw new Error('Log not found');
    
    log.reviewed = true;
    log.outcome = verdict;
    log.reviewer = reviewer;
    
    // Notify AI team of decision
    this.emit('human_decision', {
      logId,
      verdict,
      modifications,
      notes
    });
    
    // AI learns from human decisions
    if (verdict === 'rejected' || verdict === 'modified') {
      this.emit('ai_learning_opportunity', {
        original: log.data,
        correction: modifications || 'rejected',
        reason: notes
      });
    }
  }
  
  // Get pending reviews
  getPendingReviews(): ReviewItem[] {
    return this.reviewQueue
      .filter(item => !this.auditLogs.find(l => l.id === item.id)?.reviewed)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }
  
  // Analytics for oversight
  getOversightMetrics(): {
    totalDecisions: number;
    reviewedDecisions: number;
    approvalRate: number;
    avgReviewTime: number;
    pendingReviews: number;
  } {
    const reviewed = this.auditLogs.filter(l => l.reviewed);
    const approved = reviewed.filter(l => l.outcome === 'approved');
    
    return {
      totalDecisions: this.auditLogs.length,
      reviewedDecisions: reviewed.length,
      approvalRate: reviewed.length > 0 ? approved.length / reviewed.length : 0,
      avgReviewTime: this.calculateAvgReviewTime(),
      pendingReviews: this.getPendingReviews().length
    };
  }
  
  private calculateAvgReviewTime(): number {
    // In production, calculate actual review times
    return 15; // minutes
  }
}

// Explainability Engine
export class AIExplainabilityEngine {
  // Explain AI decision in human terms
  explainDecision(decision: {
    action: string;
    reasoning: string[];
    confidence: number;
    factors: Array<{ factor: string; weight: number }>;
  }): string {
    const explanation = [];
    
    explanation.push(`Action: ${decision.action}`);
    explanation.push(`Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
    explanation.push('\nKey factors:');
    
    decision.factors
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .forEach(factor => {
        explanation.push(`- ${factor.factor}: ${(factor.weight * 100).toFixed(0)}% impact`);
      });
    
    explanation.push('\nReasoning:');
    decision.reasoning.forEach(reason => {
      explanation.push(`- ${reason}`);
    });
    
    return explanation.join('\n');
  }
  
  // Track decision outcomes
  trackOutcome(
    decisionId: string,
    expected: any,
    actual: any,
    success: boolean
  ) {
    // Store for future learning
    console.log(`Decision ${decisionId}: ${success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Expected: ${JSON.stringify(expected)}`);
    console.log(`Actual: ${JSON.stringify(actual)}`);
  }
}

// Types
interface ConsentRecord {
  userId: string;
  timestamp: Date;
  scope: string[];
  withdrawable: boolean;
}

interface PolicyRules {
  forbidden: string[];
  rateLimit: {
    messagesPerHour?: number;
    messagesPerDay?: number;
    commentsPerHour?: number;
    postsPerDay?: number;
    uniqueRecipientsPerDay?: number;
  };
  contentRules: {
    maxMessageLength?: number;
    maxCommentLength?: number;
    maxEmojis?: number;
    requireHumanTouch?: boolean;
    requireModeration?: boolean;
    respectSubredditRules?: boolean;
    requireAuthenticity?: boolean;
    noAutomatedDMs?: boolean;
    zeroToleranceSolicitation?: boolean;
  };
}

interface ReviewItem {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: Date;
  description: string;
  data: any;
  suggestedAction: string;
}

// Main Compliance System
export class AIComplianceGovernance {
  private gdpr: GDPRComplianceManager;
  private platforms: PlatformPolicyEnforcer;
  private oversight: HumanOversightSystem;
  private explainability: AIExplainabilityEngine;
  
  constructor() {
    this.gdpr = new GDPRComplianceManager();
    this.platforms = new PlatformPolicyEnforcer();
    this.oversight = new HumanOversightSystem();
    this.explainability = new AIExplainabilityEngine();
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Listen for review requirements
    this.oversight.on('review_required', (item) => {
      console.log(`🚨 Human review required: ${item.description}`);
    });
    
    // Listen for learning opportunities
    this.oversight.on('ai_learning_opportunity', (data) => {
      console.log(`📚 AI Learning opportunity: ${JSON.stringify(data)}`);
    });
  }
  
  // Main compliance check for AI actions
  async checkAIAction(action: {
    actor: string;
    type: string;
    platform: string;
    data: any;
    confidence: number;
  }): Promise<{
    allowed: boolean;
    requiresReview: boolean;
    reasons: string[];
    modifications?: any;
  }> {
    const results = {
      allowed: true,
      requiresReview: false,
      reasons: [] as string[],
      modifications: undefined as any
    };
    
    // Platform compliance
    const platformCheck = await this.platforms.checkCompliance(
      action.platform,
      action.type,
      JSON.stringify(action.data)
    );
    
    if (platformCheck.verdict === 'rejected') {
      results.allowed = false;
      results.reasons.push(...platformCheck.reasons);
    } else if (platformCheck.verdict === 'requires_review') {
      results.requiresReview = true;
      results.reasons.push(...platformCheck.reasons);
    }
    
    // GDPR compliance
    if (action.data.personalData) {
      const sanitized = this.gdpr.sanitizeForLearning(
        action.data.personalData,
        'fan_message'
      );
      if (!sanitized) {
        results.allowed = false;
        results.reasons.push('Contains restricted personal data');
      } else {
        results.modifications = { ...action.data, personalData: sanitized };
      }
    }
    
    // Log decision
    const logId = this.oversight.logDecision({
      actor: action.actor,
      action: action.type,
      data: results.modifications || action.data,
      confidence: action.confidence
    });
    
    return results;
  }
  
  // Get compliance dashboard data
  getComplianceDashboard() {
    return {
      oversight: this.oversight.getOversightMetrics(),
      pendingReviews: this.oversight.getPendingReviews(),
      recentDecisions: this.getRecentDecisions(),
      complianceScore: this.calculateComplianceScore()
    };
  }
  
  private getRecentDecisions(): any[] {
    // Return last 10 decisions
    return [];
  }
  
  private calculateComplianceScore(): number {
    const metrics = this.oversight.getOversightMetrics();
    return metrics.approvalRate * 100;
  }
}

// Export singleton
export const aiCompliance = new AIComplianceGovernance();
