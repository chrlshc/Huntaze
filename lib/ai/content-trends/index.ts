/**
 * Content & Trends AI Engine
 * 
 * Main entry point for the Content & Trends AI module.
 * Provides intelligent routing, reasoning chain management,
 * video processing, and Azure AI Foundry integration.
 * 
 * @see .kiro/specs/content-trends-ai-engine/
 */

// Content Trends Engine (High-level API)
export { ContentTrendsEngine } from './content-trends-engine';

// Azure AI Foundry Configuration
export {
  type ModelEndpoint,
  type ModelParameters,
  type ModelCapability,
  type ContentTrendsModel,
  type ContentTrendsAIConfig,
  DEEPSEEK_R1_CONFIG,
  DEEPSEEK_V3_CONFIG,
  LLAMA_VISION_CONFIG,
  getContentTrendsAIConfig,
  getModelEndpoint,
  validateEndpointConfiguration,
  estimateCost,
} from './azure-foundry-config';

// Azure Inference Client (Direct MaaS calls)
export {
  AzureInferenceClient,
  getAzureInferenceClient,
  type ChatMessage,
  type ContentPart,
  type InferenceRequest,
  type InferenceResponse,
  type VisionTimelineEntry,
  type ViralAnalysisResult as AzureViralAnalysisResult,
  type ContentAssetsResult,
} from './azure-inference-client';

// AI Model Router
export {
  TaskComplexity,
  TaskModality,
  type TaskType,
  type AnalysisTask,
  type RoutingDecision,
  ContentTrendsAIRouter,
  getContentTrendsRouter,
  determineComplexity,
  selectModel,
  getOptimizedParameters,
} from './ai-router';

// Reasoning Chain Manager
export {
  type ReasoningStep,
  type ReasoningChain,
  type R1Response,
  type ConversationMessage,
  ReasoningChainManager,
  getReasoningChainManager,
} from './reasoning-chain-manager';

// Video Processor
export {
  VideoProcessor,
  createVideoProcessor,
  checkFFmpegAvailability,
  getSupportedVideoFormats,
  isValidVideoFormat,
  VideoProcessingError,
  type Keyframe,
  type KeyframePosition,
  type CompositeImage,
  type GridPosition,
  type VideoMetadata,
  type BlobUploadResult,
  type VideoProcessingResult,
  type VideoProcessorConfig,
  type AzureBlobConfig,
  type SceneChangeResult,
} from './video-processor';

// Llama Vision Service (Legacy - use Phi4MultimodalService instead)
export {
  LlamaVisionService,
  createLlamaVisionService,
  LlamaVisionError,
  type VisualAnalysisResult,
  type OCRResult,
  type TextBlock,
  type BoundingBox,
  type FacialExpressionResult,
  type EmotionType,
  type AgeRange,
  type FaceAttributes,
  type EditingDynamicsResult,
  type TransitionType,
  type TextOverlay,
  type VisualEffect,
  type PacingAnalysis,
  type ColorGradingAnalysis,
  type VisualElement,
  type LlamaVisionConfig,
  type AnalysisRequest,
  type AnalysisType,
} from './llama-vision-service';

// Phi-4 Multimodal Service (Replaces Llama Vision)
export {
  Phi4MultimodalService,
  getPhi4MultimodalService,
  type MultimodalAnalysisRequest,
  type MultimodalAnalysisResult,
  type MultimodalAnalysisType,
  type AudioTranscript,
  type TranscriptWord,
  type SpeakerSegment,
  type VideoMetadata as Phi4VideoMetadata,
  type ExtractedText,
  type FacialExpression,
  type EditingDynamics,
  type EditCut,
  type PatternInterrupt,
  type VisualElement as Phi4VisualElement,
  type DenseCaption,
  type TimelineAnalysis,
  type TimelineSegment,
  type EngagementPeak,
  type RetentionPrediction,
  type ViralHookAnalysis,
} from './phi4-multimodal-service';

// Azure Speech Batch Transcription Service
export {
  AudioTranscriptionService,
  getAudioTranscriptionService,
  type BatchTranscriptionJob,
  type TranscriptionJobStatus,
  type TranscriptionOptions,
  type AudioExtractionResult,
} from './audio-transcription-service';

// Queue Management (Phase 3)
export {
  // Types
  JobPriority,
  JobStatus,
  QueueName,
  type BaseJobData,
  type VideoProcessingJobData,
  type VisualAnalysisJobData,
  type TextAnalysisJobData,
  type ViralPredictionJobData,
  type ContentGenerationJobData,
  type WebhookProcessingJobData,
  type ContentTrendsJobData,
  type JobResult,
  type QueueConfig,
  type WorkerConfig,
  type QueueMetrics,
  type QueueEventType,
  type QueueEvent,
  // Queue Manager
  ContentTrendsQueueManager,
  getQueueManager,
  createQueueManager,
  // Workers
  BaseWorker,
  RateLimitError,
  ProcessingError,
  VideoProcessingWorker,
  createVideoProcessingWorker,
  VisualAnalysisWorker,
  createVisualAnalysisWorker,
  TextAnalysisWorker,
  createTextAnalysisWorker,
  type WorkerMetrics,
  type RateLimiterConfig,
  type VideoProcessingWorkerResult,
  type VisualAnalysisWorkerResult,
  type TextAnalysisWorkerResult,
  // Retry Service
  RetryService,
  getRetryService,
  createRetryService,
  withRetry,
  type RetryConfig,
  type RetryAttempt,
  type RetryResult,
  // Circuit Breaker
  CircuitBreaker,
  CircuitState,
  CircuitOpenError,
  CircuitBreakerRegistry,
  getCircuitBreakerRegistry,
  createCircuitBreaker,
  type CircuitBreakerConfig,
  type CircuitBreakerMetrics,
} from './queue';

// Apify Integration (Phase 4)
export {
  // Types
  type SocialPlatform,
  type ContentType,
  type ProxyType,
  type ActorConfig,
  type ActorInput,
  type ContentFilters,
  type ProxyConfig,
  type CustomProxy,
  type ProxyPool,
  type AntiDetectionConfig,
  type ActorRunStatus,
  type ActorRun,
  type ActorRunStats,
  type ScrapedDataBase,
  type TikTokScrapedData,
  type TikTokAuthor,
  type TikTokStats,
  type TikTokMusic,
  type InstagramScrapedData,
  type InstagramAuthor,
  type InstagramEngagement,
  type InstagramLocation,
  type YouTubeScrapedData,
  type YouTubeChannel,
  type YouTubeStats,
  type TwitterScrapedData,
  type TwitterAuthor,
  type TwitterStats,
  type ScrapedData,
  type WebhookEventType,
  type ApifyWebhookPayload,
  type WebhookValidationResult,
  type ValidationResult as ApifyValidationResult,
  type ValidationError as ApifyValidationError,
  type ValidationWarning as ApifyValidationWarning,
  type DuplicateReport as ApifyDuplicateReport,
  type DuplicateEntry as ApifyDuplicateEntry,
  type EnrichedData as ApifyEnrichedData,
  type ViralVelocity,
  type ScheduleConfig,
  type ScrapeTarget,
  type TrendAnalysisConfig,
  type RetryPolicy,
  type ScrapingHealthReport,
  type HealthIssue,
  type ScrapingMetrics,
  type IApifyActorManager,
  type ApifyClientConfig,
  type ActorManagerConfig,
  type TrendGap,
  type SoundArbitrageOpportunity,
  // Actor Configurations
  ACTOR_REGISTRY,
  getActorConfig,
  getPrimaryActor,
  getAllActorsForPlatform,
  buildActorInput,
  getRecommendedMemory,
  getRecommendedTimeout,
  DEFAULT_PROXY_CONFIG,
  DEFAULT_ANTI_DETECTION_CONFIG,
  // Apify Client
  ApifyClient,
  createApifyClient,
  ApifyClientError,
  // Actor Manager
  ApifyActorManager,
  createActorManager,
} from './apify';

// Webhook Security (Phase 4)
export {
  // Types
  type WebhookSecurityConfig,
  type SignatureValidationResult,
  type TimestampValidationResult,
  type IdempotencyConfig,
  type IdempotencyResult,
  type IdempotencyRecord,
  type RateLimitConfig,
  type RateLimitResult,
  type RateLimitInfo,
  type PayloadValidationConfig,
  type PayloadValidationResult,
  type PayloadValidationError,
  type PayloadValidationWarning,
  type PayloadErrorCode,
  type SecurityEventType,
  type SecurityEvent,
  type SecurityEventLogger,
  type WebhookProcessingResult,
  type WebhookProcessingError,
  type WebhookErrorCode,
  type IWebhookController,
  type WebhookHeaders,
  type WebhookControllerConfig,
  // Default configurations
  DEFAULT_SECURITY_CONFIG,
  DEFAULT_IDEMPOTENCY_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_PAYLOAD_VALIDATION_CONFIG,
  // Signature Validator
  SignatureValidator,
  createSignatureValidator,
  generateTestSignature,
  extractSignatureFromHeader,
  // Idempotency Service
  IdempotencyService,
  createIdempotencyService,
  createInMemoryIdempotencyService,
  type RedisClientInterface,
  // Rate Limiter
  WebhookRateLimiter,
  createWebhookRateLimiter,
  createInMemoryRateLimiter,
  RateLimitExceededError,
  type RateLimitRedisInterface,
  type RateLimitRedisMulti,
  // Payload Validator
  PayloadValidator,
  createPayloadValidator,
  extractEventId,
  isSuccessEvent,
  isFailureEvent,
  // Security Logger
  WebhookSecurityLogger,
  createSecurityLogger,
  getSecurityLogger,
  setSecurityLogger,
  type SecurityLoggerConfig,
  type SecurityEventStatistics,
  // Webhook Controller
  WebhookController,
  createWebhookController,
  createWebhookMiddleware,
} from './webhook';

// Viral Prediction (Phase 5)
export {
  // Types
  type ViralMechanismType,
  type EmotionalTriggerCategory,
  type VisualElementType,
  type ViralMechanism as ViralMechanismData,
  type DissonanceAnalysis,
  type EmotionalTrigger,
  type VisualElement as ViralVisualElement,
  type EngagementMetrics as ViralEngagementMetrics,
  type EngagementData,
  type ViralAnalysis,
  type ActionableInsight,
  type ReplicationRecommendation,
  type MultimodalContent,
  type ViralAnalysisConfig,
  type ReplicabilityScoreBreakdown,
  type ViralPotentialPrediction,
  // Mechanism Detector
  MechanismDetector,
  createMechanismDetector,
  // Emotional Analyzer
  EmotionalAnalyzer,
  createEmotionalAnalyzer,
  // Replicability Scorer
  ReplicabilityScorer,
  createReplicabilityScorer,
  // Insight Generator
  InsightGenerator,
  createInsightGenerator,
  // Viral Prediction Engine
  ViralPredictionEngine,
  getViralPredictionEngine,
  createViralPredictionEngine,
} from './viral-prediction';

// Data Quality (Phase 4)
export {
  // Types
  type ValidationSeverity,
  type DataValidationError,
  type DataValidationWarning,
  type ValidationResult,
  type ValidationRule,
  type ValidationRuleSet,
  type DuplicateMethod,
  type DuplicateEntry,
  type DuplicateReport,
  type QualityDimensions,
  type QualityMetrics,
  type QualityFlag,
  type QualityFlagType,
  type QualityFilterConfig,
  type LanguageDetection,
  type ContentCategory,
  type SentimentAnalysis,
  type ViralVelocityMetrics,
  type AdditionalMetadata,
  type ExtractedEntity,
  type EnrichedData,
  type IDataQualityValidator,
  type IDuplicateDetector,
  type IMetadataEnrichmentService,
  type IQualityFilter,
  type IDataQualityService,
  type ProcessingStats,
  type DuplicateDetectorConfig,
  type EnrichmentConfig,
  type DataQualityServiceConfig,
  // Default configurations
  DEFAULT_QUALITY_FILTER_CONFIG,
  DEFAULT_DUPLICATE_CONFIG,
  DEFAULT_ENRICHMENT_CONFIG,
  DEFAULT_SERVICE_CONFIG,
  // Validator
  DataQualityValidator,
  createDataQualityValidator,
  CORE_VALIDATION_RULES,
  TIKTOK_RULES,
  INSTAGRAM_RULES,
  YOUTUBE_RULES,
  // Duplicate Detector
  DuplicateDetector,
  createDuplicateDetector,
  // Enrichment Service
  MetadataEnrichmentService,
  createEnrichmentService,
  // Quality Filter
  QualityFilter,
  createQualityFilter,
  // Data Quality Service
  DataQualityService,
  createDataQualityService,
  getDataQualityService,
  setDataQualityService,
} from './data-quality';

// Trend Detection (Phase 5 - Task 5.2)
export {
  // Types
  type TrendPlatform,
  type TrendCategory,
  type TrendPhase,
  type TrendType,
  type TrendSignal,
  type TrendVelocity,
  type TrendMetrics,
  type CrossPlatformPresence,
  type TrendArbitrageOpportunity,
  type Trend,
  type TrendDetectionConfig,
  type TrendSnapshot,
  type TrendCorrelation,
  type EmergingTrendAlert,
  type TrendAnalysisResult,
  type MetaTrend,
  type TrendGap as TrendDetectionGap,
  // Velocity Calculator
  VelocityCalculator,
  type VelocityDataPoint,
  type VelocityCalculationResult,
  // Cross-Platform Correlator
  CrossPlatformCorrelator,
  type PlatformTrendData,
  type CorrelationConfig,
  // Trend Detector
  TrendDetector,
  type TrendDataInput,
} from './trend-detection';

// Content Recommendation (Phase 5 - Task 5.3)
export {
  // Types
  type ContentType as RecommendationContentType,
  type RecommendationPriority,
  type TimingStrategy,
  type BrandProfile,
  type AudienceProfile,
  type ContentGoal,
  type PlatformPreference,
  type ContentHistoryItem,
  type ContentPerformance,
  type ContentRecommendation,
  type TrendReference,
  type ViralMechanismSuggestion,
  type ContentBrief,
  type HookSuggestion,
  type NarrativeSuggestion,
  type CallToActionSuggestion,
  type VisualElementSuggestion,
  type AudioSuggestion,
  type TimingRecommendation,
  type RecommendationConfig,
  type RecommendationResult,
  type ContentGap,
  type OptimalTimingSlot,
  // Brand Alignment Scorer
  BrandAlignmentScorer,
  type AlignmentFactors,
  type AlignmentResult,
  // Timing Optimizer
  TimingOptimizer,
  type TimingFactors,
  type TimingConfig,
  // Recommendation Engine
  RecommendationEngine,
  type RecommendationInput,
} from './recommendation';

// Security (Phase 6 - Task 6.1)
export {
  // Types
  type EntraIdConfig,
  type UserIdentity,
  type UserRole,
  type Permission,
  type RBACPolicy,
  type PolicyCondition,
  type KeyVaultConfig,
  type SecretMetadata,
  type SecretRotationConfig,
  type AuditLogEntry,
  type AuditEventType,
  type ResourceType,
  type AuditAction,
  type AuditDetails,
  type DataClassification,
  type GDPRConfig,
  type AnonymizationRule,
  type AnonymizationMethod,
  type DataRetentionPolicy,
  type DataSubjectRequest,
  type PIIDetectionResult,
  type PIIType,
  type DataBoundaryConfig,
  type ExternalSharingPolicy,
  type DataClassificationResult,
  type SecurityEvent as SecurityEventData,
  type SecuritySeverity,
  type SecurityEventType as SecurityEventTypeEnum,
  type SecurityIndicator,
  type SecurityService,
  type KeyVaultService,
  type GDPRService,
  type SecurityContext,
  // RBAC Service
  RBACService,
  parsePermission,
  buildPermission,
  isReadPermission,
  isWritePermission,
  isDeletePermission,
  compareRoles,
  getHighestRole,
  // Entra ID Service
  EntraIdService,
  createEntraIdService,
  // Key Vault Service
  AzureKeyVaultService,
  createKeyVaultService,
  SECRET_NAMES,
  // Audit Logger
  AuditLogger,
  createAuditLogger,
  getAuditLogger,
  type AuditLoggerConfig,
  type AuditBackend,
  type AuditQueryFilters,
  // GDPR Service
  GDPRComplianceService,
  createGDPRService,
} from './security';

// Monitoring (Phase 6 - Task 6.2)
export {
  // Types
  type MetricValue,
  type MetricUnit,
  type MetricDefinition,
  type AggregationType,
  type AIModelMetrics,
  type ViralPredictionMetrics,
  type ContentGenerationMetrics,
  type AlertRule,
  type AlertSeverity,
  type AlertCondition,
  type ComparisonOperator,
  type AlertAction,
  type AlertActionType,
  type Alert,
  type AlertStatus,
  type Dashboard,
  type DashboardWidget,
  type WidgetType,
  type WidgetConfig,
  type WidgetThreshold,
  type TimeRange,
  type DashboardFilter,
  type PerformanceBaseline,
  type AnomalyDetectionResult,
  type AzureMonitorConfig,
  type CustomEvent,
  type Trace,
  type TraceSeverity,
  type MetricsCollector,
  type AlertingService,
  type DashboardService,
  // Metrics Collector
  ContentTrendsMetricsCollector,
  createMetricsCollector,
  createMetric,
  aggregateMetrics,
  // Azure Monitor Service
  AzureMonitorService,
  createAzureMonitorService,
  // Alerting Service
  ContentTrendsAlertingService,
  createAlertingService,
  // Dashboard Service
  ContentTrendsDashboardService,
  createDashboardService,
} from './monitoring';
