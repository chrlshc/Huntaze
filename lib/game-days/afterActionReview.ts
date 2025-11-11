/**
 * After Action Review (AAR) System
 * Systematic learning capture and improvement tracking from Game Days
 */

export interface AARTemplate {
  id: string;
  name: string;
  sections: AARSection[];
  requiredParticipants: string[];
  timeboxMinutes: number;
}

export interface AARSection {
  title: string;
  questions: string[];
  required: boolean;
  timeboxMinutes: number;
}

export interface AfterActionReview {
  id: string;
  gameDay: {
    executionId: string;
    scenarioName: string;
    date: number;
    duration: number;
    participants: string[];
  };
  template: string;
  facilitator: string;
  participants: AARParticipant[];
  sections: AARSectionResponse[];
  timeline: AARTimelineEvent[];
  findings: AARFinding[];
  actionItems: AARActionItem[];
  metrics: AARMetrics;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: number;
  completedAt?: number;
}

export interface AARParticipant {
  name: string;
  role: string;
  team: string;
  attendance: 'PRESENT' | 'ABSENT' | 'PARTIAL';
  contributions: string[];
}

export interface AARSectionResponse {
  sectionTitle: string;
  responses: {
    question: string;
    answers: string[];
    consensus?: string;
    actionRequired: boolean;
  }[];
  keyInsights: string[];
  timeSpent: number;
}

export interface AARTimelineEvent {
  timestamp: number;
  phase: 'WHAT_HAPPENED' | 'WHAT_WENT_WELL' | 'WHAT_COULD_IMPROVE' | 'ACTION_PLANNING';
  participant: string;
  content: string;
  category: 'TECHNICAL' | 'PROCESS' | 'COMMUNICATION' | 'TOOLING';
}

export interface AARFinding {
  id: string;
  category: 'SUCCESS' | 'IMPROVEMENT' | 'RISK' | 'LEARNING';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string[];
  recommendations: string[];
  relatedActionItems: string[];
}

export interface AARActionItem {
  id: string;
  title: string;
  description: string;
  category: 'RUNBOOK' | 'MONITORING' | 'PROCESS' | 'TRAINING' | 'TOOLING' | 'COMMUNICATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee: string;
  team: string;
  dueDate: number;
  estimatedEffort: string;
  successCriteria: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'BLOCKED';
  createdAt: number;
  updatedAt: number;
}

export interface AARMetrics {
  participationRate: number;
  timeToCompletion: number;
  findingsCount: {
    success: number;
    improvement: number;
    risk: number;
    learning: number;
  };
  actionItemsCount: {
    total: number;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
  };
  followUpRate: number; // % of action items completed
}

class AfterActionReviewManager {
  private reviews = new Map<string, AfterActionReview>();
  private templates = new Map<string, AARTemplate>();

  constructor() {
    this.setupDefaultTemplates();
  }

  async scheduleAAR(
    gameDay: {
      executionId: string;
      scenarioName: string;
      date: number;
      duration: number;
      participants: string[];
    },
    templateId: string = 'standard',
    facilitator: string,
    scheduledAt: number
  ): Promise<string> {
    const aarId = this.generateAARId();
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`AAR template ${templateId} not found`);
    }

    const aar: AfterActionReview = {
      id: aarId,
      gameDay,
      template: templateId,
      facilitator,
      participants: gameDay.participants.map(name => ({
        name,
        role: 'Participant',
        team: 'Unknown',
        attendance: 'PRESENT',
        contributions: []
      })),
      sections: template.sections.map(section => ({
        sectionTitle: section.title,
        responses: section.questions.map(question => ({
          question,
          answers: [],
          actionRequired: false
        })),
        keyInsights: [],
        timeSpent: 0
      })),
      timeline: [],
      findings: [],
      actionItems: [],
      metrics: {
        participationRate: 0,
        timeToCompletion: 0,
        findingsCount: { success: 0, improvement: 0, risk: 0, learning: 0 },
        actionItemsCount: { total: 0, byPriority: {}, byCategory: {} },
        followUpRate: 0
      },
      status: 'SCHEDULED',
      scheduledAt
    };

    this.reviews.set(aarId, aar);
    
    console.log(`📅 AAR scheduled: ${aarId} for Game Day ${gameDay.executionId}`);
    
    return aarId;
  }

  async conductAAR(aarId: string): Promise<void> {
    const aar = this.reviews.get(aarId);
    if (!aar) {
      throw new Error(`AAR ${aarId} not found`);
    }

    aar.status = 'IN_PROGRESS';
    const startTime = Date.now();

    try {
      // Execute AAR sections
      for (const section of aar.sections) {
        await this.conductSection(aar, section);
      }

      // Generate findings and action items
      await this.generateFindings(aar);
      await this.generateActionItems(aar);

      // Calculate metrics
      this.calculateAARMetrics(aar, startTime);

      aar.status = 'COMPLETED';
      aar.completedAt = Date.now();

      console.log(`✅ AAR completed: ${aarId}`);
    } catch (error) {
      console.error(`❌ AAR failed: ${aarId}`, error);
      throw error;
    }
  }

  private async conductSection(aar: AfterActionReview, section: AARSectionResponse): Promise<void> {
    const sectionStartTime = Date.now();
    
    console.log(`📋 Conducting AAR section: ${section.sectionTitle}`);
    
    // Simulate section discussion
    for (const response of section.responses) {
      // In a real implementation, this would collect actual responses
      // For demo, simulate responses
      response.answers = [
        'Simulated response 1',
        'Simulated response 2'
      ];
      
      // Determine if action is required
      response.actionRequired = Math.random() > 0.7; // 30% chance
      
      if (response.answers.length > 1) {
        response.consensus = response.answers[0]; // Simplified consensus
      }
    }

    // Generate key insights
    section.keyInsights = [
      'Key insight from section discussion',
      'Important learning point identified'
    ];

    section.timeSpent = Date.now() - sectionStartTime;
  }

  private async generateFindings(aar: AfterActionReview): Promise<void> {
    // Analyze responses to generate findings
    const findings: AARFinding[] = [];

    // Success findings
    findings.push({
      id: this.generateId(),
      category: 'SUCCESS',
      title: 'Monitoring System Performed Well',
      description: 'Alerts fired within target timeframes and provided actionable information',
      impact: 'HIGH',
      evidence: ['Alert timestamps', 'Team response times'],
      recommendations: ['Continue current monitoring practices'],
      relatedActionItems: []
    });

    // Improvement findings
    findings.push({
      id: this.generateId(),
      category: 'IMPROVEMENT',
      title: 'Runbook Gaps Identified',
      description: 'Some procedures were unclear or missing steps',
      impact: 'MEDIUM',
      evidence: ['Team confusion during execution', 'Manual intervention required'],
      recommendations: ['Update runbooks with missing steps', 'Add decision trees'],
      relatedActionItems: []
    });

    // Risk findings
    if (Math.random() > 0.5) {
      findings.push({
        id: this.generateId(),
        category: 'RISK',
        title: 'Single Point of Failure Identified',
        description: 'Critical dependency without adequate redundancy',
        impact: 'HIGH',
        evidence: ['Service outage caused cascade failure'],
        recommendations: ['Implement redundancy', 'Add circuit breakers'],
        relatedActionItems: []
      });
    }

    // Learning findings
    findings.push({
      id: this.generateId(),
      category: 'LEARNING',
      title: 'Team Coordination Insights',
      description: 'Communication patterns and decision-making observations',
      impact: 'MEDIUM',
      evidence: ['Communication logs', 'Decision timeline'],
      recommendations: ['Regular communication drills', 'Clear escalation paths'],
      relatedActionItems: []
    });

    aar.findings = findings;
  }

  private async generateActionItems(aar: AfterActionReview): Promise<void> {
    const actionItems: AARActionItem[] = [];

    // Generate action items from findings
    for (const finding of aar.findings) {
      if (finding.category === 'IMPROVEMENT' || finding.category === 'RISK') {
        for (const recommendation of finding.recommendations) {
          actionItems.push({
            id: this.generateId(),
            title: `${finding.title}: ${recommendation}`,
            description: finding.description,
            category: this.categorizeActionItem(recommendation),
            priority: finding.impact === 'CRITICAL' ? 'URGENT' : 
                     finding.impact === 'HIGH' ? 'HIGH' : 'MEDIUM',
            assignee: this.assignActionItem(recommendation),
            team: this.getTeamForCategory(this.categorizeActionItem(recommendation)),
            dueDate: this.calculateDueDate(finding.impact),
            estimatedEffort: this.estimateEffort(recommendation),
            successCriteria: [`Implement ${recommendation}`, 'Validate in next Game Day'],
            status: 'OPEN',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      }
    }

    aar.actionItems = actionItems;
  }

  private categorizeActionItem(recommendation: string): AARActionItem['category'] {
    if (recommendation.toLowerCase().includes('runbook')) return 'RUNBOOK';
    if (recommendation.toLowerCase().includes('monitor') || recommendation.toLowerCase().includes('alert')) return 'MONITORING';
    if (recommendation.toLowerCase().includes('process') || recommendation.toLowerCase().includes('procedure')) return 'PROCESS';
    if (recommendation.toLowerCase().includes('training') || recommendation.toLowerCase().includes('drill')) return 'TRAINING';
    if (recommendation.toLowerCase().includes('tool') || recommendation.toLowerCase().includes('system')) return 'TOOLING';
    return 'COMMUNICATION';
  }

  private assignActionItem(recommendation: string): string {
    // Simplified assignment logic
    if (recommendation.toLowerCase().includes('runbook')) return 'SRE Team';
    if (recommendation.toLowerCase().includes('monitor')) return 'SRE Team';
    if (recommendation.toLowerCase().includes('training')) return 'Team Lead';
    return 'Product Owner';
  }

  private getTeamForCategory(category: AARActionItem['category']): string {
    const teamMap = {
      RUNBOOK: 'SRE',
      MONITORING: 'SRE',
      PROCESS: 'Operations',
      TRAINING: 'All Teams',
      TOOLING: 'Engineering',
      COMMUNICATION: 'Product'
    };
    return teamMap[category] || 'Engineering';
  }

  private calculateDueDate(impact: string): number {
    const daysFromNow = {
      CRITICAL: 3,
      HIGH: 7,
      MEDIUM: 14,
      LOW: 30
    }[impact] || 14;

    return Date.now() + (daysFromNow * 24 * 60 * 60 * 1000);
  }

  private estimateEffort(recommendation: string): string {
    // Simplified effort estimation
    if (recommendation.toLowerCase().includes('implement') || recommendation.toLowerCase().includes('build')) {
      return '1-2 weeks';
    }
    if (recommendation.toLowerCase().includes('update') || recommendation.toLowerCase().includes('improve')) {
      return '2-3 days';
    }
    return '1 day';
  }

  private calculateAARMetrics(aar: AfterActionReview, startTime: number): void {
    const presentParticipants = aar.participants.filter(p => p.attendance === 'PRESENT');
    
    aar.metrics = {
      participationRate: (presentParticipants.length / aar.participants.length) * 100,
      timeToCompletion: (Date.now() - startTime) / 1000 / 60, // minutes
      findingsCount: {
        success: aar.findings.filter(f => f.category === 'SUCCESS').length,
        improvement: aar.findings.filter(f => f.category === 'IMPROVEMENT').length,
        risk: aar.findings.filter(f => f.category === 'RISK').length,
        learning: aar.findings.filter(f => f.category === 'LEARNING').length
      },
      actionItemsCount: {
        total: aar.actionItems.length,
        byPriority: this.countByField(aar.actionItems, 'priority'),
        byCategory: this.countByField(aar.actionItems, 'category')
      },
      followUpRate: 0 // Will be calculated later as action items are completed
    };
  }

  private countByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private setupDefaultTemplates(): void {
    // Standard AAR template
    this.templates.set('standard', {
      id: 'standard',
      name: 'Standard Game Day AAR',
      requiredParticipants: ['Incident Commander', 'SRE', 'Development Lead'],
      timeboxMinutes: 90,
      sections: [
        {
          title: 'What Happened?',
          questions: [
            'What was the timeline of events?',
            'What systems were affected?',
            'What was the user impact?',
            'How did monitoring and alerting perform?'
          ],
          required: true,
          timeboxMinutes: 20
        },
        {
          title: 'What Went Well?',
          questions: [
            'What processes worked as expected?',
            'What tools were effective?',
            'What team responses were exemplary?',
            'What preparations paid off?'
          ],
          required: true,
          timeboxMinutes: 15
        },
        {
          title: 'What Could Be Improved?',
          questions: [
            'What processes broke down or were unclear?',
            'What tools were missing or ineffective?',
            'What communication issues occurred?',
            'What knowledge gaps were exposed?'
          ],
          required: true,
          timeboxMinutes: 25
        },
        {
          title: 'Action Planning',
          questions: [
            'What specific actions will prevent this issue?',
            'What runbooks need updates?',
            'What monitoring improvements are needed?',
            'What training should be conducted?'
          ],
          required: true,
          timeboxMinutes: 30
        }
      ]
    });

    // Security incident AAR template
    this.templates.set('security', {
      id: 'security',
      name: 'Security Incident AAR',
      requiredParticipants: ['Incident Commander', 'Security Lead', 'Legal', 'Communications'],
      timeboxMinutes: 120,
      sections: [
        {
          title: 'Incident Timeline',
          questions: [
            'When was the incident first detected?',
            'What was the attack vector?',
            'What data was potentially compromised?',
            'When was containment achieved?'
          ],
          required: true,
          timeboxMinutes: 30
        },
        {
          title: 'Response Effectiveness',
          questions: [
            'How effective was the incident response?',
            'Were communication protocols followed?',
            'Was legal/regulatory compliance maintained?',
            'How was customer communication handled?'
          ],
          required: true,
          timeboxMinutes: 25
        },
        {
          title: 'Security Controls',
          questions: [
            'Which security controls worked?',
            'Which controls failed or were bypassed?',
            'What detection capabilities need improvement?',
            'What prevention measures should be added?'
          ],
          required: true,
          timeboxMinutes: 35
        },
        {
          title: 'Remediation & Prevention',
          questions: [
            'What immediate remediation is required?',
            'What long-term security improvements are needed?',
            'What compliance reporting is required?',
            'What customer notification is needed?'
          ],
          required: true,
          timeboxMinutes: 30
        }
      ]
    });
  }

  private generateAARId(): string {
    return `aar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  // Public API methods
  getAAR(aarId: string): AfterActionReview | undefined {
    return this.reviews.get(aarId);
  }

  getAllAARs(): AfterActionReview[] {
    return Array.from(this.reviews.values());
  }

  getAARsByGameDay(executionId: string): AfterActionReview[] {
    return Array.from(this.reviews.values()).filter(aar => 
      aar.gameDay.executionId === executionId
    );
  }

  getTemplate(templateId: string): AARTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): AARTemplate[] {
    return Array.from(this.templates.values());
  }

  async updateActionItemStatus(
    aarId: string,
    actionItemId: string,
    status: AARActionItem['status'],
    notes?: string
  ): Promise<void> {
    const aar = this.reviews.get(aarId);
    if (!aar) {
      throw new Error(`AAR ${aarId} not found`);
    }

    const actionItem = aar.actionItems.find(item => item.id === actionItemId);
    if (!actionItem) {
      throw new Error(`Action item ${actionItemId} not found`);
    }

    actionItem.status = status;
    actionItem.updatedAt = Date.now();

    // Recalculate follow-up rate
    const completedItems = aar.actionItems.filter(item => item.status === 'COMPLETED').length;
    aar.metrics.followUpRate = (completedItems / aar.actionItems.length) * 100;

    console.log(`📝 Action item updated: ${actionItem.title} → ${status}`);
  }

  generateAARReport(aarId: string): {
    summary: string;
    findings: AARFinding[];
    actionItems: AARActionItem[];
    metrics: AARMetrics;
    recommendations: string[];
  } {
    const aar = this.reviews.get(aarId);
    if (!aar) {
      throw new Error(`AAR ${aarId} not found`);
    }

    const summary = this.generateSummary(aar);
    const recommendations = this.generateRecommendations(aar);

    return {
      summary,
      findings: aar.findings,
      actionItems: aar.actionItems,
      metrics: aar.metrics,
      recommendations
    };
  }

  private generateSummary(aar: AfterActionReview): string {
    const { gameDay, metrics, findings, actionItems } = aar;
    
    return `
Game Day AAR Summary
===================

Game Day: ${gameDay.scenarioName}
Date: ${new Date(gameDay.date).toLocaleDateString()}
Duration: ${gameDay.duration} minutes
Participants: ${gameDay.participants.length}

Key Metrics:
- Participation Rate: ${metrics.participationRate.toFixed(1)}%
- Findings: ${findings.length} total (${metrics.findingsCount.success} successes, ${metrics.findingsCount.improvement} improvements)
- Action Items: ${actionItems.length} total (${actionItems.filter(a => a.priority === 'HIGH' || a.priority === 'URGENT').length} high priority)

Overall Assessment: ${this.getOverallAssessment(aar)}
    `.trim();
  }

  private generateRecommendations(aar: AfterActionReview): string[] {
    const recommendations: string[] = [];
    
    // Based on findings
    const riskFindings = aar.findings.filter(f => f.category === 'RISK');
    if (riskFindings.length > 0) {
      recommendations.push('Address identified risks before next Game Day');
    }

    const improvementFindings = aar.findings.filter(f => f.category === 'IMPROVEMENT');
    if (improvementFindings.length > 2) {
      recommendations.push('Focus on process improvements to reduce friction');
    }

    // Based on action items
    const urgentItems = aar.actionItems.filter(a => a.priority === 'URGENT');
    if (urgentItems.length > 0) {
      recommendations.push('Complete urgent action items within 72 hours');
    }

    // Based on metrics
    if (aar.metrics.participationRate < 80) {
      recommendations.push('Improve Game Day scheduling and communication');
    }

    return recommendations;
  }

  private getOverallAssessment(aar: AfterActionReview): string {
    const { findings, actionItems } = aar;
    
    const riskCount = findings.filter(f => f.category === 'RISK').length;
    const urgentItems = actionItems.filter(a => a.priority === 'URGENT').length;
    
    if (riskCount > 2 || urgentItems > 3) {
      return 'NEEDS_IMPROVEMENT';
    } else if (riskCount > 0 || urgentItems > 0) {
      return 'SATISFACTORY';
    } else {
      return 'EXCELLENT';
    }
  }
}

// Global instance
export const aarManager = new AfterActionReviewManager();

// Convenience functions
export const scheduleAAR = (gameDay: any, templateId: string = 'standard', facilitator: string, scheduledAt: number) =>
  aarManager.scheduleAAR(gameDay, templateId, facilitator, scheduledAt);

export const conductAAR = (aarId: string) =>
  aarManager.conductAAR(aarId);

export const getAARReport = (aarId: string) =>
  aarManager.generateAARReport(aarId);

export const updateActionItem = (aarId: string, actionItemId: string, status: AARActionItem['status']) =>
  aarManager.updateActionItemStatus(aarId, actionItemId, status);