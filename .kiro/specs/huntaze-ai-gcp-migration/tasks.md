# Implementation Plan - Migration du Système IA Huntaze vers GCP

## Status: In Progress

This implementation plan guides the migration from OpenAI/Anthropic to Google Cloud Platform (GCP) with Vertex AI and Gemini models. The plan is structured to enable incremental progress with feature flags for safe rollout.

**Current State Analysis:**
- ✅ Gemini SDK already installed (`@google/generative-ai`)
- ✅ Basic GeminiService implemented (`lib/ai/gemini.service.ts`)
- ✅ LLM Router exists (`src/lib/ai/llm-router.ts`) using OpenAI/Anthropic
- ✅ Memory Service exists (`lib/of-memory/services/user-memory-service.ts`)
- ❌ No Vertex AI SDK installed yet
- ❌ No AI agents (MessagingAI, AnalyticsAI, SalesAI, ComplianceAI) implemented
- ❌ No Vector Search integration
- ❌ No GCP infrastructure configured

---

## Phase 1: Infrastructure Setup and Core Services

- [ ] 1. Set up GCP project and Vertex AI configuration
  - Create GCP project with Vertex AI APIs enabled
  - Configure Workload Identity Federation for authentication
  - Set up Cloud KMS for encryption keys
  - Configure Cloud Monitoring dashboards and alerts
  - Set up Cloud Logging with structured logging
  - Document GCP project ID and region in environment variables
  - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.4_

- [ ] 2. Install Vertex AI SDK and dependencies
  - Add `@google-cloud/vertexai` package to dependencies
  - Add `@google-cloud/logging` for Cloud Logging integration
  - Add `@google-cloud/monitoring` for metrics
  - Add `@google-cloud/trace` for distributed tracing
  - Add `google-auth-library` for authentication
  - Update TypeScript types and configurations
  - Add environment variables: GCP_PROJECT_ID, GCP_REGION, GCP_CREDENTIALS_PATH
  - _Requirements: 1.1, 11.1, 11.3_

- [ ] 3. Implement VertexAIService core functionality
  - Create `lib/ai/vertex/vertex-ai.service.ts` with generateText, chat, and streaming methods
  - Implement token counting with Vertex AI API
  - Add model selection (gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro)
  - Configure generation parameters (temperature, maxTokens, topP, topK)
  - Add safety settings configuration
  - Implement proper error handling and type definitions
  - Add JSDoc documentation for all public methods
  - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - _Note: Leverage existing GeminiService patterns from lib/ai/gemini.service.ts_

- [ ]* 3.1 Write property test for VertexAIService model selection
  - **Property 1: Premium Tier Routing Consistency**
  - Test that premium tier always uses gemini-1.5-pro
  - Use fast-check with 100+ iterations
  - _Validates: Requirements 1.1_

- [ ]* 3.2 Write property test for streaming
  - **Property 5: Streaming Token Delivery**
  - Test that tokens arrive progressively without waiting for completion
  - _Validates: Requirements 1.5_

- [ ] 4. Implement error handling and retry logic
  - Create `lib/ai/vertex/error-handler.ts` with error classification
  - Implement exponential backoff retry logic with configurable parameters
  - Add circuit breaker pattern for resilience (reuse existing pattern from memory service)
  - Configure fallback strategies for different error types (rate limit, timeout, auth, quota)
  - Add comprehensive error logging with correlation IDs
  - _Requirements: 1.4, 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Note: Reference existing circuit breaker in lib/of-memory/utils/circuit-breaker_

- [ ]* 4.1 Write property test for exponential backoff
  - **Property 4: Fallback Exponential Backoff**
  - Test that delays increase exponentially with backoff factor
  - Verify max delay is respected
  - _Validates: Requirements 1.4_

- [ ]* 4.2 Write property test for circuit breaker
  - **Property 24: Circuit Breaker Opening Threshold**
  - **Property 25: Circuit Breaker Fallback Behavior**
  - **Property 26: Circuit Breaker Half-Open Testing**
  - **Property 27: Circuit Breaker Recovery**
  - **Property 28: Circuit Breaker Independence**
  - Test all circuit breaker state transitions
  - _Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5_

---

## Phase 2: LLM Router Migration

- [ ] 5. Implement VertexAIRouter with tier-based routing
  - Create `lib/ai/vertex/vertex-ai-router.ts` with tier selection logic
  - Implement fallback chains for premium, standard, and economy tiers
  - Define model configurations: premium (gemini-1.5-pro), standard (gemini-1.5-flash), economy (gemini-1.5-flash with reduced tokens)
  - Add feature flag ENABLE_VERTEX_AI (default: false) for gradual rollout
  - Preserve existing OpenAI/Anthropic fallback during migration
  - Add timeout handling and abort signal support
  - Implement cost logging for each request
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Note: Follow patterns from src/lib/ai/llm-router.ts_

- [ ]* 5.1 Write property test for tier routing
  - **Property 1: Premium Tier Routing Consistency**
  - **Property 2: Standard Tier Routing Consistency**
  - **Property 3: Economy Tier Token Limit Enforcement**
  - Test that each tier uses correct model and token limits
  - _Validates: Requirements 1.1, 1.2, 1.3_

- [ ] 6. Implement cost tracking for Vertex AI
  - Create `lib/ai/vertex/cost-tracker.ts` with token usage logging
  - Define pricing constants for gemini-1.5-pro and gemini-1.5-flash
  - Log costs to Cloud Logging with structured format (timestamp, model, tokens, cost, creator)
  - Implement cost aggregation by creator, model, and operation
  - Add budget threshold alerts (warning at $500/day, critical at $1000/day)
  - Create cost optimization recommendation engine
  - Store cost logs in database for historical analysis
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - _Note: Follow patterns from src/lib/ai/cost-logger.ts_

- [ ]* 6.1 Write property test for cost tracking
  - **Property 20: Cost Logging Completeness**
  - **Property 21: Cost Report Aggregation**
  - **Property 22: Rate Limit Quota Enforcement**
  - Test that all requests log costs correctly
  - Test aggregation accuracy
  - _Validates: Requirements 5.1, 5.3, 5.4_

- [ ] 7. Update existing LLM router to support Vertex AI
  - Modify `src/lib/ai/llm-router.ts` to add Vertex AI as provider option
  - Add feature flag check ENABLE_VERTEX_AI for Vertex AI routing
  - Implement dual-write pattern for migration period (log to both systems)
  - Add Vertex AI to fallback chains when feature flag is enabled
  - Ensure backward compatibility with existing code
  - Update type definitions to include 'vertexai' provider
  - _Requirements: 15.1, 15.5_

- [ ]* 7.1 Write integration test for router migration
  - Test feature flag toggling (enabled/disabled)
  - Test fallback to OpenAI/Anthropic when Vertex AI fails
  - Test dual-write consistency during migration
  - Test that existing code continues to work
  - _Requirements: 13.1, 13.2, 15.1_

---

## Phase 3: Vector Search and Memory Service

- [ ] 8. Implement VertexAIVectorService for embeddings
  - Create `lib/ai/vertex/vertex-vector.service.ts` with embedding generation
  - Use text-embedding-004 model for embeddings (768 dimensions)
  - Implement batch embedding generation for efficiency (up to 100 texts per batch)
  - Add embedding caching to reduce costs (Redis cache with 24h TTL)
  - Implement error handling and retry logic
  - Add token counting for cost tracking
  - _Requirements: 3.1, 3.4_

- [ ]* 8.1 Write property test for embeddings
  - **Property 11: Embedding Model Consistency**
  - Test that all embeddings use text-embedding-004
  - Test embedding dimensions are always 768
  - _Validates: Requirements 3.1_

- [ ] 9. Integrate Vertex AI Vector Search
  - Set up Vertex AI Vector Search index in GCP (cosine similarity, 768 dimensions)
  - Create index deployment with auto-scaling configuration
  - Implement semantic search with similarity scoring
  - Add filtering by creator and fan IDs using metadata
  - Optimize for <100ms p95 latency with proper index configuration
  - Implement GDPR-compliant deletion (remove vectors by fan ID)
  - Add monitoring for search latency and accuracy
  - _Requirements: 3.2, 3.3, 3.5_

- [ ]* 9.1 Write property test for vector search
  - **Property 12: Semantic Search Relevance**
  - **Property 13: Vector Search Latency**
  - **Property 14: GDPR Embedding Deletion**
  - Test that search returns relevant results
  - Test latency is under 100ms for 95% of requests
  - Test that deletion removes all fan vectors
  - _Validates: Requirements 3.2, 3.3, 3.5_

- [ ] 10. Migrate Memory Service to use Vertex AI embeddings
  - Update `lib/of-memory/services/user-memory-service.ts` to use VertexAIVectorService
  - Replace existing embedding logic with Vertex AI
  - Add feature flag ENABLE_VERTEX_EMBEDDINGS for gradual rollout
  - Implement migration script for existing embeddings (batch process)
  - Maintain backward compatibility during migration
  - Update getMemoryContext to use vector search for semantic retrieval
  - _Requirements: 3.1, 3.2_

- [ ]* 10.1 Write integration test for memory service migration
  - Test embedding generation and storage
  - Test semantic search accuracy with known relevant interactions
  - Test GDPR deletion compliance
  - Test feature flag toggling
  - _Requirements: 13.4_

---

## Phase 4: AI Agents Migration

- [ ] 11. Create MessagingAgent (Emma) with Vertex AI
  - Create `lib/ai/agents/messaging-ai.ts` implementing VertexAIAgent interface
  - Configure Gemini 1.5 Pro for high-quality messaging (not Flash as per design)
  - Implement personality-aware prompt construction with fan context
  - Enable JSON mode for structured output (suggestions array)
  - Integrate with AIKnowledgeNetwork for insight sharing
  - Add confidence scoring for suggestions
  - Test with various fan profiles and message contexts
  - _Requirements: 2.1, 10.1, 10.2_
  - _Note: This is a new implementation, no existing agent to migrate_

- [ ]* 11.1 Write property test for MessagingAgent
  - **Property 6: MessagingAI Model Selection**
  - **Property 38: JSON Mode Activation**
  - Test that MessagingAI always uses Gemini 1.5 Pro
  - Test that JSON mode is enabled for structured output
  - _Validates: Requirements 2.1, 10.2_

- [ ] 12. Create AnalyticsAgent (Alex) with Vertex AI
  - Create `lib/ai/agents/analytics-ai.ts` implementing VertexAIAgent interface
  - Configure Gemini 1.5 Pro for complex analysis
  - Implement structured output parsing for insights (JSON mode)
  - Add confidence scoring for predictions
  - Integrate with AIKnowledgeNetwork
  - Test with various analytics scenarios (revenue, engagement, patterns)
  - _Requirements: 2.2, 10.2_

- [ ]* 12.1 Write property test for AnalyticsAgent
  - **Property 7: AnalyticsAI Structured Output**
  - Test that output is valid JSON with insights, predictions, recommendations
  - _Validates: Requirements 2.2_

- [ ] 13. Create SalesAgent (Sarah) with Vertex AI
  - Create `lib/ai/agents/sales-ai.ts` implementing VertexAIAgent interface
  - Configure Gemini 1.5 Flash for cost optimization
  - Optimize prompts for sales message generation and upsell suggestions
  - Integrate with AIKnowledgeNetwork
  - Test upsell suggestion accuracy with various fan profiles
  - _Requirements: 2.3, 10.1_

- [ ]* 13.1 Write property test for SalesAgent
  - **Property 8: SalesAI Cost Optimization**
  - Test that SalesAI always uses Gemini 1.5 Flash (not Pro)
  - _Validates: Requirements 2.3_

- [ ] 14. Create ComplianceAgent (Claire) with Vertex AI
  - Create `lib/ai/agents/compliance-ai.ts` implementing VertexAIAgent interface
  - Configure Gemini 1.5 Flash with strict safety settings (BLOCK_LOW_AND_ABOVE)
  - Implement content moderation checks (hate speech, illegal content, personal info)
  - Add platform-specific compliance rules (OnlyFans, Instagram, TikTok)
  - Integrate with AIKnowledgeNetwork
  - Test with various content types and edge cases
  - _Requirements: 2.4_

- [ ]* 14.1 Write property test for ComplianceAgent
  - **Property 9: ComplianceAI Safety Configuration**
  - Test that safety settings are configured to BLOCK_LOW_AND_ABOVE
  - _Validates: Requirements 2.4_

- [ ] 15. Create AIKnowledgeNetwork event system
  - Create `lib/ai/knowledge-network.ts` for insight broadcasting
  - Implement event-based communication between agents
  - Add insight types: pattern, prediction, optimization, compliance
  - Implement insight storage and retrieval
  - Add confidence-based filtering (only share high-confidence insights)
  - _Requirements: 2.5_

- [ ] 16. Create VertexAITeamCoordinator
  - Create `lib/ai/vertex/vertex-team-coordinator.ts` orchestrating all agents
  - Implement handleFanMessage flow (compliance → messaging → sales → analytics)
  - Implement generateContent flow for content creation
  - Implement analyzePerformance flow for analytics
  - Integrate with VertexAIVectorService for memory context
  - Add feature flag ENABLE_VERTEX_AGENTS for gradual rollout
  - _Requirements: 2.5_

- [ ]* 16.1 Write property test for Knowledge Network
  - **Property 10: Knowledge Network Broadcasting**
  - Test that insights are broadcast to all agents
  - _Validates: Requirements 2.5_

- [ ] 17. Checkpoint - Ensure all agent tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: Personality and Emotion Services

- [ ] 18. Create PersonalityCalibrator with Vertex AI
  - Create `lib/of-memory/services/personality-calibrator.ts` using VertexAIService
  - Generate personality profiles with confidence scores (0-1 range)
  - Analyze tone, emoji frequency, message length, punctuation style
  - Implement tone adaptation based on learned preferences
  - Integrate with Memory Service for profile storage
  - Add feature flag ENABLE_VERTEX_PERSONALITY
  - _Requirements: 4.1, 4.3_
  - _Note: This is a new service, not a migration_

- [ ]* 18.1 Write property test for PersonalityCalibrator
  - **Property 15: Personality Profile Confidence**
  - **Property 17: Tone Adaptation Based on Preferences**
  - Test that profiles always include confidence score 0-1
  - Test that tone adapts based on preferences
  - _Validates: Requirements 4.1, 4.3_

- [ ] 19. Create EmotionAnalyzer with Vertex AI
  - Create `lib/of-memory/services/emotion-analyzer.ts` using VertexAIService
  - Implement multi-dimensional emotion detection (sentiment, intensity, valence)
  - Add dominant emotion prioritization (highest confidence)
  - Update Memory Service with emotional context
  - Integrate with PersonalityCalibrator for holistic analysis
  - Add feature flag ENABLE_VERTEX_EMOTION
  - _Requirements: 4.2, 4.4, 4.5_

- [ ]* 19.1 Write property test for EmotionAnalyzer
  - **Property 16: Multi-Dimensional Emotion Detection**
  - **Property 18: Emotional State Memory Update**
  - **Property 19: Dominant Emotion Prioritization**
  - Test multi-dimensional output
  - Test memory service updates
  - Test dominant emotion selection
  - _Validates: Requirements 4.2, 4.4, 4.5_

---

## Phase 6: Content Generation and Multimodal

- [ ] 20. Implement multimodal content generation
  - Create `lib/ai/vertex/multimodal.service.ts` for image analysis
  - Use Gemini 1.5 Pro Vision for image understanding
  - Generate captions from images with visual context
  - Extract hashtags from visual themes
  - Support multiple images in single request (up to 10)
  - Add video frame extraction and analysis
  - Implement proper error handling for unsupported formats
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ]* 20.1 Write property test for multimodal generation
  - **Property 29: Visual Hashtag Relevance**
  - **Property 30: Multimodal Context Integration**
  - **Property 31: Multi-Image Caption Cohesion**
  - Test hashtag relevance to visual content
  - Test that captions reference all images
  - _Validates: Requirements 7.2, 7.3, 7.5_

- [ ] 21. Update content generation endpoints
  - Update `app/api/ai/generate-caption/route.ts` to use Vertex AI
  - Add feature flag ENABLE_VERTEX_CONTENT for gradual rollout
  - Add image upload and analysis support
  - Implement video frame extraction and analysis
  - Test with various content types (images, videos, text)
  - Maintain backward compatibility with existing API
  - _Requirements: 7.1, 7.4_

---

## Phase 7: Monitoring and Observability

- [ ] 22. Implement Cloud Monitoring integration
  - Create `lib/ai/vertex/monitoring.service.ts` for metrics emission
  - Emit latency, token usage, and cost metrics to Cloud Monitoring
  - Configure alert policies for SLA violations (error rate >5%, latency >5s, cost >$1000/day)
  - Create dashboards for AI operations (Vertex AI Overview, AI Agents, Cost Optimization)
  - Add metric types: vertex_ai_latency_ms, vertex_ai_tokens_input, vertex_ai_tokens_output, vertex_ai_cost_usd
  - _Requirements: 11.1, 11.2_

- [ ]* 22.1 Write property test for monitoring
  - **Property 42: Metrics Emission on Request**
  - Test that every request emits metrics
  - _Validates: Requirements 11.1_

- [ ] 23. Implement Cloud Trace integration
  - Add distributed tracing to all Vertex AI calls using @google-cloud/trace
  - Propagate trace context across service boundaries
  - Add correlation IDs to all log entries (use crypto.randomUUID())
  - Create trace analysis dashboards in Cloud Console
  - Add trace spans for: router, agents, vector search, embeddings
  - _Requirements: 11.3, 11.4_

- [ ]* 23.1 Write property test for tracing
  - **Property 43: Distributed Tracing Propagation**
  - **Property 44: Correlation ID in Logs**
  - Test trace propagation across services
  - Test correlation IDs in logs
  - _Validates: Requirements 11.3, 11.4_

- [ ] 24. Implement PII redaction for logs
  - Create `lib/ai/vertex/pii-redactor.ts` with pattern matching
  - Redact email, phone, SSN, credit card numbers using regex patterns
  - Apply redaction before writing to Cloud Logging
  - Test with various PII patterns and edge cases
  - Integrate with all logging points (cost tracker, error handler, monitoring)
  - _Requirements: 9.4_

- [ ]* 24.1 Write property test for PII redaction
  - **Property 35: PII Redaction in Logs**
  - Test that PII is redacted in all log entries
  - _Validates: Requirements 9.4_

---

## Phase 8: Security and Compliance

- [ ] 25. Configure Workload Identity Federation
  - Set up GCP service account with minimal permissions (Vertex AI User, Cloud Logging Writer)
  - Configure Workload Identity for Vertex AI access from Vercel/application
  - Create authentication helper in `lib/ai/vertex/vertex-auth.ts`
  - Test authentication from application environment
  - Document security configuration in README
  - _Requirements: 9.3_

- [ ] 26. Implement encryption at rest and in transit
  - Configure Cloud KMS for embedding encryption (create encryption key)
  - Ensure TLS 1.3 for all Vertex AI connections (verify SDK configuration)
  - Test encryption/decryption flows for vector embeddings
  - Document encryption keys and rotation policy
  - _Requirements: 9.1, 9.2_

- [ ] 27. Implement audit logging
  - Create `lib/ai/vertex/audit-logger.ts` for immutable logs
  - Log all AI operations with PII redaction (input, output, model, cost, user)
  - Implement GDPR-compliant audit trails (immutable flag in Cloud Logging)
  - Test log immutability (verify logs cannot be modified)
  - Add audit log retention policy (7 years for compliance)
  - _Requirements: 9.5_

- [ ]* 27.1 Write property test for audit logging
  - **Property 36: Immutable Audit Logs**
  - Test that audit logs are immutable
  - _Validates: Requirements 9.5_

---

## Phase 9: Prompt Optimization

- [ ] 27. Optimize prompts for Gemini
  - Update all prompt templates to use Gemini-specific formatting
  - Implement prompt caching for repeated context
  - Add intelligent truncation for long prompts
  - Include few-shot examples where needed
  - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [ ]* 27.1 Write property test for prompt optimization
  - **Property 37: Gemini Prompt Format Compliance**
  - **Property 39: Prompt Caching Token Reduction**
  - **Property 40: Context-Preserving Truncation**
  - **Property 41: Few-Shot Example Inclusion**
  - **Validates: Requirements 10.1, 10.3, 10.4, 10.5**

---

## Phase 10: Testing and Validation

- [ ] 28. Create integration test suite
  - Test all AI agent responses against expected outputs
  - Test fallback logic with simulated failures
  - Validate cost tracking accuracy
  - Test memory retrieval relevance
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ]* 28.1 Write property test for fallback testing
  - **Property 45: Fallback Testing Graceful Degradation**
  - **Property 46: Cost Tracking Accuracy**
  - **Property 47: Semantic Search Test Relevance**
  - **Validates: Requirements 13.2, 13.3, 13.4**

- [ ] 29. Perform load testing
  - Test with 1000 concurrent users
  - Measure latency percentiles (p50, p95, p99)
  - Verify auto-scaling behavior
  - Test regional failover
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 30. Validate performance regression
  - Compare Vertex AI performance vs OpenAI/Anthropic
  - Ensure no degradation in response quality
  - Verify cost savings
  - Test with production-like data
  - _Requirements: 13.5_

---

## Phase 11: Rollback and Disaster Recovery

- [ ] 31. Implement rollback mechanism
  - Add instant rollback to OpenAI/Anthropic via feature flag
  - Test rollback procedure in staging
  - Ensure data preservation during rollback
  - Document rollback steps
  - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 31.1 Write property test for rollback
  - **Property 48: Instant Rollback Capability**
  - **Property 49: Rollback Data Preservation**
  - **Validates: Requirements 15.1, 15.2**

- [ ] 32. Test disaster recovery
  - Simulate complete Vertex AI outage
  - Verify service restoration within 15 minutes
  - Test dual-write consistency during migration
  - _Requirements: 15.4, 15.5_

- [ ]* 32.1 Write property test for disaster recovery
  - **Property 50: Disaster Recovery Time**
  - **Property 51: Dual-Write Consistency**
  - **Validates: Requirements 15.4, 15.5**

---

## Phase 12: Gradual Rollout

- [ ] 33. Deploy to staging with 0% traffic
  - Deploy all Vertex AI services to staging
  - Verify all services are healthy
  - Run smoke tests
  - _Requirements: All_

- [ ] 34. Enable 1% traffic rollout
  - Update feature flag to route 1% of traffic to Vertex AI
  - Monitor error rates and latency
  - Compare costs with baseline
  - Collect user feedback
  - _Requirements: All_

- [ ] 35. Increase to 10% traffic
  - Update feature flag to 10% if 1% is stable
  - Continue monitoring metrics
  - Validate cost savings
  - _Requirements: All_

- [ ] 36. Increase to 50% traffic
  - Update feature flag to 50% if 10% is stable
  - Monitor for any issues at scale
  - Verify auto-scaling works correctly
  - _Requirements: All_

- [ ] 37. Increase to 100% traffic
  - Update feature flag to 100% if 50% is stable
  - Monitor for 48 hours
  - Confirm migration success
  - _Requirements: All_

---

## Phase 13: Cleanup and Documentation

- [ ] 38. Remove old OpenAI/Anthropic code
  - Remove OpenAI and Anthropic provider code
  - Remove feature flags
  - Clean up unused dependencies
  - Update configuration files
  - _Requirements: 14.1_

- [ ] 39. Update documentation
  - Document Vertex AI architecture
  - Create setup guides for local development
  - Write runbooks for troubleshooting
  - Document cost optimization strategies
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 40. Conduct team training
  - Train team on GCP AI services
  - Share knowledge about Vertex AI best practices
  - Document lessons learned
  - Conduct retrospective
  - _Requirements: 14.5_

- [ ] 41. Final checkpoint - Verify migration complete
  - Ensure all tests pass
  - Verify all documentation is updated
  - Confirm cost savings achieved
  - Celebrate successful migration! 🎉

---

## Notes

- **Feature Flags**: All Vertex AI functionality should be behind feature flags for safe rollout
- **Backward Compatibility**: Maintain OpenAI/Anthropic fallback during migration period
- **Monitoring**: Continuously monitor metrics during rollout to catch issues early
- **Cost Tracking**: Track costs closely to ensure migration achieves cost savings goals
- **Testing**: Run comprehensive tests at each phase before proceeding
- **Rollback**: Be prepared to rollback instantly if critical issues arise

## Success Criteria

- ✅ All AI agents successfully migrated to Vertex AI
- ✅ Cost reduction of at least 30% compared to OpenAI/Anthropic
- ✅ Latency p95 < 2 seconds for all AI operations
- ✅ Error rate < 1% for all Vertex AI calls
- ✅ 100% of traffic successfully routed to Vertex AI
- ✅ Zero data loss during migration
- ✅ All tests passing
- ✅ Team trained and documentation complete
