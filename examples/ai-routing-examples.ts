/**
 * Exemples pratiques d'utilisation du système de routage AI
 */

import { aiService } from '../lib/services/ai-service-optimized';
import { routeAIRequest, estimateMonthlyCost } from '../lib/services/ai-router';

// ============================================
// Exemple 1: Chatbot Support Client
// ============================================
export async function handleFanMessage(fanMessage: string, creatorId: string) {
  const response = await aiService.processRequest({
    taskType: 'chatbot',
    prompt: fanMessage,
    context: {
      creatorId,
      conversationHistory: [], // Derniers messages
    },
    options: {
      stream: true, // Streaming pour meilleure UX
      maxTokens: 150,
      temperature: 0.7,
    },
  });

  // Utilisera gpt-4o-mini automatiquement
  // Coût: ~$0.002 par requête
  return response.content;
}

// ============================================
// Exemple 2: Modération de Contenu
// ============================================
export async function moderateContent(content: string, imageUrl?: string) {
  const response = await aiService.processRequest({
    taskType: 'moderation',
    prompt: `Analyser ce contenu pour NSFW et compliance:\n${content}`,
    context: {
      imageUrl,
      guidelines: 'OnlyFans ToS',
    },
    options: {
      maxTokens: 100,
      temperature: 0.3, // Plus déterministe pour modération
    },
  });

  // Utilisera gpt-4o-mini
  // Coût: ~$0.001 par requête
  return JSON.parse(response.content) as {
    isNSFW: boolean;
    isCompliant: boolean;
    reason: string;
  };
}

// ============================================
// Exemple 3: Génération de Contenu Marketing
// ============================================
export async function generateInstagramCaption(params: {
  topic: string;
  tone: 'casual' | 'professional' | 'playful';
  hashtags: number;
}) {
  const response = await aiService.processRequest({
    taskType: 'marketing_template',
    prompt: `Créer une caption Instagram sur: ${params.topic}`,
    context: {
      tone: params.tone,
      hashtagCount: params.hashtags,
      platform: 'instagram',
    },
    options: {
      maxTokens: 200,
      temperature: 0.8, // Plus créatif
    },
  });

  // Utilisera gpt-4o-mini
  // Coût: ~$0.002 par requête
  return response.content;
}

// ============================================
// Exemple 4: Analytics Basiques
// ============================================
export async function analyzeEngagement(metrics: {
  likes: number;
  comments: number;
  shares: number;
  views: number;
}) {
  const response = await aiService.processRequest({
    taskType: 'basic_analytics',
    prompt: 'Analyser ces métriques d\'engagement',
    context: metrics,
    options: {
      maxTokens: 300,
    },
  });

  // Utilisera gpt-4o-mini
  // Coût: ~$0.002 par requête
  return response.content;
}

// ============================================
// Exemple 5: Stratégie Marketing (GPT-4o)
// ============================================
export async function createMarketingStrategy(params: {
  budget: number;
  duration: string;
  goals: string[];
  audience: string;
}) {
  const response = await aiService.processRequest({
    taskType: 'strategy',
    prompt: 'Créer une stratégie marketing complète',
    context: params,
    options: {
      maxTokens: 1500, // Long output
      temperature: 0.7,
    },
  });

  // Utilisera gpt-4o automatiquement (tâche complexe)
  // Coût: ~$0.05 par requête
  return response.content;
}

// ============================================
// Exemple 6: Analyse Avancée (GPT-4o)
// ============================================
export async function predictRevenue(historicalData: {
  months: Array<{ month: string; revenue: number; subscribers: number }>;
  seasonality: string[];
}) {
  const response = await aiService.processRequest({
    taskType: 'advanced_analytics',
    prompt: 'Prédire les revenus des 3 prochains mois',
    context: historicalData,
    options: {
      maxTokens: 800,
      temperature: 0.5,
    },
  });

  // Utilisera gpt-4o (analyse complexe)
  // Coût: ~$0.03 par requête
  return JSON.parse(response.content) as {
    predictions: Array<{ month: string; revenue: number; confidence: number }>;
    insights: string[];
  };
}

// ============================================
// Exemple 7: Compliance Check (GPT-4o)
// ============================================
export async function checkCompliance(content: string, contentType: string) {
  const response = await aiService.processRequest({
    taskType: 'compliance',
    prompt: `Vérifier la conformité légale de ce contenu ${contentType}`,
    context: {
      content,
      regulations: ['OnlyFans ToS', 'DMCA', 'GDPR'],
    },
    options: {
      maxTokens: 500,
      temperature: 0.2, // Très déterministe
    },
  });

  // Utilisera TOUJOURS gpt-4o (critique)
  // Coût: ~$0.02 par requête
  return JSON.parse(response.content) as {
    isCompliant: boolean;
    violations: string[];
    recommendations: string[];
  };
}

// ============================================
// Exemple 8: Routage Manuel
// ============================================
export function demonstrateManualRouting() {
  // Vérifier quel modèle serait utilisé sans faire l'appel
  const decision1 = routeAIRequest({
    taskType: 'chatbot',
    complexityScore: 3,
    isCritical: false,
  });
  console.log('Chatbot:', decision1.model, '-', decision1.reason);

  const decision2 = routeAIRequest({
    taskType: 'strategy',
    complexityScore: 8,
    isCritical: false,
    requiresReasoning: true,
  });
  console.log('Strategy:', decision2.model, '-', decision2.reason);

  const decision3 = routeAIRequest({
    taskType: 'compliance',
    complexityScore: 5,
    isCritical: true,
  });
  console.log('Compliance:', decision3.model, '-', decision3.reason);
}

// ============================================
// Exemple 9: Estimation des Coûts
// ============================================
export function estimateHuntazeCosts() {
  // Scénario: 100k requêtes/mois
  const scenario1 = estimateMonthlyCost({
    requestsPerDay: 3333,
    avgInputTokens: 500,
    avgOutputTokens: 200,
    miniPercentage: 90, // 90% mini, 10% full
  });

  console.log('Scénario 90% mini:');
  console.log('  Mini cost:', `$${scenario1.miniCost}`);
  console.log('  Full cost:', `$${scenario1.fullCost}`);
  console.log('  Total:', `$${scenario1.totalCost}`);
  console.log('  Savings:', `$${scenario1.savings}`);

  // Scénario: Plus de tâches complexes
  const scenario2 = estimateMonthlyCost({
    requestsPerDay: 3333,
    avgInputTokens: 500,
    avgOutputTokens: 200,
    miniPercentage: 70, // 70% mini, 30% full
  });

  console.log('\nScénario 70% mini:');
  console.log('  Total:', `$${scenario2.totalCost}`);
  console.log('  Savings:', `$${scenario2.savings}`);
}

// ============================================
// Exemple 10: Monitoring et Stats
// ============================================
export async function monitorUsage() {
  // Faire quelques requêtes
  await handleFanMessage('Hi!', 'creator123');
  await generateInstagramCaption({ topic: 'fitness', tone: 'casual', hashtags: 5 });
  await createMarketingStrategy({
    budget: 5000,
    duration: '3 months',
    goals: ['increase engagement'],
    audience: 'premium fans',
  });

  // Voir les stats
  const stats = aiService.getStats();
  console.log('\nUsage Statistics:');
  console.log('  Total requests:', stats.totalRequests);
  console.log('  Mini percentage:', `${stats.miniPercentage}%`);
  console.log('  Cache hit rate:', `${stats.cacheHitRate}%`);
  console.log('  Total cost:', `$${stats.totalCost.toFixed(4)}`);
}
