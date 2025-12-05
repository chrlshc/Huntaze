/**
 * Huntaze AI Killer Features - Export Hub
 * 
 * All the 🔴 priority features ready to ship:
 * 
 * 1. AI Insights (Mistral Large)
 *    - Auto-generated insights from metrics
 *    - Narrative reports
 * 
 * 2. Campaign Generator (Mistral Large)
 *    - Full campaign generation
 *    - Subject line optimization
 *    - A/B variations
 * 
 * 3. Fan Segmentation (DeepSeek R1)
 *    - Whales / Regulars / At-risk / New / Dormant
 *    - Churn prediction
 *    - Personalized recommendations
 * 
 * Already implemented elsewhere:
 * - Captions Optimisées: lib/ai/azure/azure-vision.service.ts
 * - A/B Variations: azure-vision.service.ts (alternativeCaptions)
 * - Flow Builder AI: lib/ai/automation-builder.service.ts
 * - Churn Service: lib/services/revenue/churn-service.ts
 * - Pattern Detection: lib/ai/agents/analytics.azure.ts
 */

// ============================================
// AI Insights
// ============================================
export {
  AIInsightsService,
  getAIInsightsService,
  generateInsights,
  generateNarrativeReport,
  type Insight,
  type InsightType,
  type InsightSeverity,
  type MetricsData,
  type GenerateInsightsRequest,
  type GenerateInsightsResponse,
  type NarrativeReportRequest,
  type NarrativeReportResponse,
} from './insights.service';

// ============================================
// Campaign Generator
// ============================================
export {
  AICampaignGeneratorService,
  getAICampaignGeneratorService,
  generateCampaign,
  optimizeSubjectLine,
  type CampaignType,
  type CampaignChannel,
  type GenerateCampaignRequest,
  type GeneratedCampaign,
  type OptimizeSubjectRequest,
  type OptimizeSubjectResponse,
} from './campaign-generator.service';

// ============================================
// Fan Segmentation
// ============================================
export {
  AIFanSegmentationService,
  getAIFanSegmentationService,
  segmentFans,
  predictChurn,
  type FanSegment,
  type Fan,
  type SegmentedFan,
  type SegmentationResult,
  type SegmentFansRequest,
  type PredictChurnRequest,
  type ChurnPrediction,
} from './fan-segmentation.service';

// ============================================
// Re-export existing services
// ============================================
export {
  AutomationBuilderService,
  getAutomationBuilderService,
  buildAutomationFlow,
  generateResponseTemplate,
} from './automation-builder.service';
