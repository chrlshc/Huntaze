// AI Learning Network - Système d'apprentissage collectif et évolution exponentielle
// Les IA apprennent les unes des autres et évoluent ensemble

import { EventEmitter } from 'events';

// TYPES DE CONNAISSANCES PARTAGÉES
export interface SharedKnowledge {
  id: string;
  type: 'pattern' | 'strategy' | 'risk' | 'optimization' | 'discovery';
  source: string; // Which AI discovered this
  category: string;
  confidence: number;
  data: any;
  usage: {
    successRate: number;
    usageCount: number;
    lastUsed: Date;
    feedback: Array<{ result: 'success' | 'failure'; context: any }>;
  };
  evolution: {
    version: number;
    improvements: string[];
    parentKnowledge?: string; // ID of knowledge this evolved from
  };
}

// RÉSEAU NEURONAL COLLECTIF
export class CollectiveIntelligenceNetwork extends EventEmitter {
  private knowledgeBase: Map<string, SharedKnowledge> = new Map();
  private connectionMatrix: Map<string, Set<string>> = new Map(); // AI connections
  private evolutionHistory: Array<{
    timestamp: Date;
    type: string;
    impact: number;
    description: string;
  }> = [];
  
  // PARTAGE DE CONNAISSANCES
  shareKnowledge(knowledge: SharedKnowledge) {
    const existing = this.knowledgeBase.get(knowledge.id);
    
    if (existing) {
      // Evolve existing knowledge
      const evolved = this.evolveKnowledge(existing, knowledge);
      this.knowledgeBase.set(knowledge.id, evolved);
      this.emit('knowledge_evolved', evolved);
    } else {
      // New knowledge
      this.knowledgeBase.set(knowledge.id, knowledge);
      this.emit('new_knowledge', knowledge);
    }
    
    // Propagate to connected AIs
    this.propagateKnowledge(knowledge);
    
    // Track evolution
    this.trackEvolution(knowledge);
  }
  
  // ÉVOLUTION DES CONNAISSANCES
  private evolveKnowledge(
    existing: SharedKnowledge, 
    newData: SharedKnowledge
  ): SharedKnowledge {
    // Combine insights
    const evolved: SharedKnowledge = {
      ...existing,
      confidence: (existing.confidence + newData.confidence) / 2,
      data: this.mergeData(existing.data, newData.data),
      usage: {
        ...existing.usage,
        usageCount: existing.usage.usageCount + 1,
        successRate: this.calculateNewSuccessRate(existing, newData)
      },
      evolution: {
        version: existing.evolution.version + 1,
        improvements: [
          ...existing.evolution.improvements,
          `Enhanced by ${newData.source} with confidence ${newData.confidence}`
        ],
        parentKnowledge: existing.id
      }
    };
    
    return evolved;
  }
  
  // FUSION DE DONNÉES
  private mergeData(existing: any, newData: any): any {
    // Intelligent merging based on data type
    if (typeof existing === 'object' && typeof newData === 'object') {
      return {
        ...existing,
        ...newData,
        _merged: true,
        _sources: [...(existing._sources || []), newData._source]
      };
    }
    return newData; // Simple replacement for now
  }
  
  private calculateNewSuccessRate(existing: SharedKnowledge, newData: any): number {
    const totalUsage = existing.usage.usageCount + 1;
    const successCount = existing.usage.successRate * existing.usage.usageCount;
    return successCount / totalUsage;
  }
  
  // PROPAGATION INTELLIGENTE
  private propagateKnowledge(knowledge: SharedKnowledge) {
    const connections = this.connectionMatrix.get(knowledge.source) || new Set();
    
    connections.forEach(aiId => {
      // Send relevant knowledge based on AI specialization
      if (this.isRelevantForAI(knowledge, aiId)) {
        this.emit(`knowledge_for_${aiId}`, knowledge);
      }
    });
  }
  
  private isRelevantForAI(knowledge: SharedKnowledge, aiId: string): boolean {
    // Logic to determine relevance based on AI role
    const aiSpecializations: Record<string, string[]> = {
      messaging_ai: ['conversation', 'engagement', 'personality'],
      analytics_ai: ['patterns', 'metrics', 'predictions'],
      sales_ai: ['conversion', 'pricing', 'tactics'],
      compliance_ai: ['rules', 'risks', 'safety']
    };
    
    const specs = aiSpecializations[aiId] || [];
    return specs.some(spec => 
      knowledge.category.toLowerCase().includes(spec) ||
      knowledge.type === 'risk' // All AIs should know about risks
    );
  }
  
  // RECHERCHE INTELLIGENTE
  searchKnowledge(query: {
    type?: string;
    category?: string;
    minConfidence?: number;
    source?: string;
  }): SharedKnowledge[] {
    const results: SharedKnowledge[] = [];
    
    this.knowledgeBase.forEach(knowledge => {
      let match = true;
      
      if (query.type && knowledge.type !== query.type) match = false;
      if (query.category && !knowledge.category.includes(query.category)) match = false;
      if (query.minConfidence && knowledge.confidence < query.minConfidence) match = false;
      if (query.source && knowledge.source !== query.source) match = false;
      
      if (match) results.push(knowledge);
    });
    
    // Sort by relevance (confidence * success rate)
    return results.sort((a, b) => {
      const scoreA = a.confidence * a.usage.successRate;
      const scoreB = b.confidence * b.usage.successRate;
      return scoreB - scoreA;
    });
  }
  
  // APPRENTISSAGE CROSS-AI
  crossLearn(aiId1: string, aiId2: string): Array<SharedKnowledge> {
    const knowledge1 = Array.from(this.knowledgeBase.values())
      .filter(k => k.source === aiId1);
    const knowledge2 = Array.from(this.knowledgeBase.values())
      .filter(k => k.source === aiId2);
    
    const crossLearnings: SharedKnowledge[] = [];
    
    // Find complementary knowledge
    knowledge1.forEach(k1 => {
      knowledge2.forEach(k2 => {
        if (this.areComplementary(k1, k2)) {
          const combined = this.combineKnowledge(k1, k2);
          crossLearnings.push(combined);
          this.shareKnowledge(combined);
        }
      });
    });
    
    return crossLearnings;
  }
  
  private areComplementary(k1: SharedKnowledge, k2: SharedKnowledge): boolean {
    // Knowledge is complementary if they address related areas
    return k1.category === k2.category && k1.type !== k2.type;
  }
  
  private combineKnowledge(
    k1: SharedKnowledge, 
    k2: SharedKnowledge
  ): SharedKnowledge {
    return {
      id: `combined_${k1.id}_${k2.id}`,
      type: 'discovery',
      source: `${k1.source}+${k2.source}`,
      category: k1.category,
      confidence: Math.min(k1.confidence, k2.confidence) * 0.9, // Slightly lower for combined
      data: {
        source1: k1.data,
        source2: k2.data,
        combination: 'cross-learning',
        potential: 'high'
      },
      usage: {
        successRate: 0,
        usageCount: 0,
        lastUsed: new Date(),
        feedback: []
      },
      evolution: {
        version: 1,
        improvements: ['Created through cross-learning'],
        parentKnowledge: `${k1.id},${k2.id}`
      }
    };
  }
  
  // TRACK EVOLUTION
  private trackEvolution(knowledge: SharedKnowledge) {
    this.evolutionHistory.push({
      timestamp: new Date(),
      type: knowledge.type,
      impact: knowledge.confidence,
      description: `${knowledge.source} discovered ${knowledge.category}`
    });
    
    // Trim history to last 1000 entries
    if (this.evolutionHistory.length > 1000) {
      this.evolutionHistory = this.evolutionHistory.slice(-1000);
    }
  }
  
  // MÉTRIQUES D'INTELLIGENCE COLLECTIVE
  getCollectiveMetrics(): {
    totalKnowledge: number;
    averageConfidence: number;
    evolutionRate: number;
    topPerformers: Array<{ source: string; count: number; avgSuccess: number }>;
    emergentPatterns: number;
  } {
    const knowledgeArray = Array.from(this.knowledgeBase.values());
    
    // Group by source
    const bySource = new Map<string, SharedKnowledge[]>();
    knowledgeArray.forEach(k => {
      const existing = bySource.get(k.source) || [];
      existing.push(k);
      bySource.set(k.source, existing);
    });
    
    // Calculate top performers
    const topPerformers = Array.from(bySource.entries())
      .map(([source, knowledge]) => {
        const avgSuccess = knowledge.reduce((sum, k) => 
          sum + k.usage.successRate, 0
        ) / knowledge.length;
        
        return {
          source,
          count: knowledge.length,
          avgSuccess
        };
      })
      .sort((a, b) => b.avgSuccess - a.avgSuccess);
    
    // Count emergent patterns (cross-learned knowledge)
    const emergentPatterns = knowledgeArray.filter(k => 
      k.source.includes('+') || k.type === 'discovery'
    ).length;
    
    return {
      totalKnowledge: knowledgeArray.length,
      averageConfidence: knowledgeArray.reduce((sum, k) => sum + k.confidence, 0) / knowledgeArray.length,
      evolutionRate: this.calculateEvolutionRate(),
      topPerformers,
      emergentPatterns
    };
  }
  
  private calculateEvolutionRate(): number {
    // Evolution rate based on recent activity
    const recentEvolutions = this.evolutionHistory.filter(e => {
      const hourAgo = new Date(Date.now() - 3600000);
      return e.timestamp > hourAgo;
    });
    
    return recentEvolutions.length / 60; // Evolutions per minute
  }
  
  // PRÉDICTION D'ÉVOLUTION
  predictNextEvolution(): {
    area: string;
    probability: number;
    timeframe: string;
    impact: 'low' | 'medium' | 'high';
  }[] {
    const predictions: any[] = [];
    
    // Analyze current trends
    const recentKnowledge = Array.from(this.knowledgeBase.values())
      .filter(k => {
        const dayAgo = new Date(Date.now() - 86400000);
        return k.usage.lastUsed > dayAgo;
      });
    
    // Find areas with high activity
    const categoryActivity = new Map<string, number>();
    recentKnowledge.forEach(k => {
      categoryActivity.set(
        k.category, 
        (categoryActivity.get(k.category) || 0) + 1
      );
    });
    
    // Predict based on activity
    categoryActivity.forEach((count, category) => {
      if (count > 5) {
        predictions.push({
          area: category,
          probability: Math.min(count / 10, 0.9),
          timeframe: '1-2 hours',
          impact: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
        });
      }
    });
    
    return predictions;
  }
}

// SINGLETON INSTANCE
export const aiLearningNetwork = new CollectiveIntelligenceNetwork();

// HELPER: Track AI Performance
export function trackAIPerformance(
  aiId: string,
  action: string,
  result: 'success' | 'failure',
  context: any
) {
  // Find related knowledge
  const relatedKnowledge = aiLearningNetwork.searchKnowledge({
    source: aiId,
    category: action
  });
  
  if (relatedKnowledge.length > 0) {
    // Update usage stats
    const knowledge = relatedKnowledge[0];
    knowledge.usage.feedback.push({ result, context });
    knowledge.usage.successRate = 
      knowledge.usage.feedback.filter(f => f.result === 'success').length /
      knowledge.usage.feedback.length;
    
    // Re-share updated knowledge
    aiLearningNetwork.shareKnowledge(knowledge);
  }
}

// USAGE EXAMPLE:
/*
// AI discovers new pattern
aiLearningNetwork.shareKnowledge({
  id: 'pattern_ppv_timing_001',
  type: 'pattern',
  source: 'analytics_ai',
  category: 'conversion_timing',
  confidence: 0.87,
  data: {
    pattern: 'PPV sent 2-3h after engagement spike',
    conversionIncrease: '34%',
    sampleSize: 450
  },
  usage: {
    successRate: 0,
    usageCount: 0,
    lastUsed: new Date(),
    feedback: []
  },
  evolution: {
    version: 1,
    improvements: [],
  }
});

// Another AI uses and improves it
trackAIPerformance(
  'sales_ai',
  'conversion_timing',
  'success',
  { conversionRate: 0.42 }
);

// Get collective metrics
const metrics = aiLearningNetwork.getCollectiveMetrics();
console.log(`Total knowledge: ${metrics.totalKnowledge}`);
console.log(`Evolution rate: ${metrics.evolutionRate}/min`);
*/