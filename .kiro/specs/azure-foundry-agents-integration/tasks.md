# Implementation Plan

- [x] 1. Create RouterClient TypeScript module ✅
  - [x] 1.1 Create router client with HTTP request handling ✅
    - Create `lib/ai/foundry/router-client.ts`
    - Implement RouterRequest and RouterResponse interfaces
    - Add HTTP POST to `/route` endpoint with timeout handling (60s default)
    - Read `AI_ROUTER_URL` from environment variable
    - Support AWS deployment (ECS service URL, Lambda URL, or API Gateway endpoint)
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 1.2 Write property test for router request validation ✅
    - **Property 1: Router request contains required fields**
    - **Validates: Requirements 1.1, 1.4**

  - [x] 1.3 Implement error handling for RouterClient ✅
    - Create RouterError class with error codes
    - Handle HTTP 400 → ValidationError
    - Handle HTTP 500 → ServiceError
    - Handle timeout → TimeoutError
    - Handle connection failure → ConnectionError
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.4 Write unit tests for error handling ✅
    - Test each error type with mocked responses
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 1.5 Implement streaming support in RouterClient ✅
    - Add `routeStream()` method returning AsyncGenerator<string>
    - Handle `/route/stream` endpoint when available
    - Fallback to standard request if streaming unavailable
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Implement plan-to-tier and agent-type mapping utilities ✅
  - [x] 2.1 Create mapping utility functions ✅
    - Create `lib/ai/foundry/mapping.ts`
    - Implement `planToTier()`: enterprise/scale→vip, pro/starter/undefined→standard
    - Implement `agentTypeHint()`: mapping for each agent type
    - Implement `detectFrenchLanguage()`: detect French content for language hint
    - _Requirements: 2.1-2.5, 3.1-3.3_

  - [x] 2.2 Write property test for plan-to-tier mapping ✅
    - **Property 4: Plan to tier mapping**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 2.3 Write property test for agent type hint mapping ✅
    - **Property 3: Agent type hint mapping**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.4 Write property test for French language detection ✅
    - **Property 9: French language detection**
    - **Validates: Requirements 2.5**

- [x] 3. Checkpoint - Ensure all tests pass ✅
  - Ensure all tests pass, ask the user if questions arise.
  - **51 tests passing** (3 test files)

- [x] 4. Update MessagingAgent to use RouterClient ✅
  - [x] 4.1 Refactor MessagingAgent to call RouterClient ✅
    - Import RouterClient and mapping utilities
    - Replace azureOpenAIRouter.chat() with routerClient.route()
    - Add typeHint: 'chat' to agent class
    - Map user plan to client_tier using planToTier()
    - Include language_hint when French detected
    - Created `lib/ai/agents/messaging.foundry.ts`
    - _Requirements: 1.1, 2.1, 3.1-3.3_

  - [x] 4.2 Update MessagingAgent system prompt ✅
    - Optimize prompt for Llama-3.3-70B model
    - Ensure all instructions in English
    - Include JSON output format with required fields
    - Keep prompt under 2000 tokens
    - _Requirements: 6.1, 6.6, 9.1_

  - [x] 4.3 Update MessagingAgent response parsing and cost tracking ✅
    - Extract model, deployment, region from router response
    - Convert usage statistics to existing format
    - Calculate cost using MODEL_PRICING with actual model name
    - Update insight metadata with model/deployment/region
    - _Requirements: 1.2, 5.2, 5.4, 7.1-7.3_

  - [x] 4.4 Write property test for MessagingAgent response format ✅
    - **Property 6: Interface compatibility**
    - **Validates: Requirements 5.1, 5.2**
    - Created `tests/unit/ai/foundry/messaging-agent.property.test.ts`
    - **3 tests passing**

- [x] 5. Update AnalyticsAgent to use RouterClient ✅
  - [x] 5.1 Refactor AnalyticsAgent to call RouterClient ✅
    - Import RouterClient and mapping utilities
    - Replace azureOpenAIRouter.chat() with routerClient.route()
    - Add typeHint: 'math' to agent class
    - Map user plan to client_tier
    - Created `lib/ai/agents/analytics.foundry.ts`
    - _Requirements: 1.1, 2.2, 3.1-3.3_

  - [x] 5.2 Update AnalyticsAgent system prompt ✅
    - Optimize prompt for DeepSeek-R1 model (math/reasoning)
    - Ensure all instructions in English
    - Include JSON output format with insights/predictions/recommendations
    - Keep prompt under 2000 tokens
    - _Requirements: 6.2, 6.7, 9.2_

  - [x] 5.3 Update AnalyticsAgent response parsing and cost tracking ✅
    - Extract model, deployment, region from router response
    - Convert usage statistics to existing format
    - Calculate cost using MODEL_PRICING
    - Update insight metadata
    - _Requirements: 1.2, 5.2, 5.4, 7.1-7.3_

- [x] 6. Update SalesAgent to use RouterClient ✅
  - [x] 6.1 Refactor SalesAgent to call RouterClient ✅
    - Import RouterClient and mapping utilities
    - Replace azureOpenAIRouter.chat() with routerClient.route()
    - Add typeHint: 'creative' to agent class
    - Map user plan to client_tier
    - Created `lib/ai/agents/sales.foundry.ts`
    - _Requirements: 1.1, 2.3, 3.1-3.3_

  - [x] 6.2 Update SalesAgent system prompt ✅
    - Optimize prompt for Llama-3.3-70B model (creative)
    - Ensure all instructions in English
    - Include few-shot examples for each optimization type (upsell, ppv_suggestion, tip_request, subscription_renewal)
    - Include JSON output format with required fields
    - Keep prompt under 2000 tokens
    - _Requirements: 6.3, 6.8, 9.3_

  - [x] 6.3 Update SalesAgent response parsing and cost tracking ✅
    - Extract model, deployment, region from router response
    - Convert usage statistics to existing format
    - Calculate cost using MODEL_PRICING
    - Update insight metadata with model/deployment/region/provider
    - _Requirements: 1.2, 5.2, 5.4, 7.1-7.3_

- [x] 7. Checkpoint - Ensure all tests pass ✅
  - Ensure all tests pass, ask the user if questions arise.
  - **54 tests passing** (4 test files)
  - Fixed property test generators to exclude whitespace-only strings

- [x] 8. Update ComplianceAgent to use RouterClient ✅
  - [x] 8.1 Refactor ComplianceAgent to call RouterClient ✅
    - Import RouterClient and mapping utilities
    - Replace azureOpenAIRouter.chat() with routerClient.route()
    - Add typeHint: 'chat' to agent class
    - Map user plan to client_tier
    - Created `lib/ai/agents/compliance.foundry.ts`
    - _Requirements: 1.1, 2.4, 3.1-3.3_

  - [x] 8.2 Update ComplianceAgent system prompt ✅
    - Optimize prompt for Llama-3.3-70B model
    - Ensure all instructions in English
    - Include platform-specific rules (OnlyFans, Instagram, Twitter, TikTok)
    - Include JSON output format with is_compliant, violations, compliant_alternative, confidence
    - Keep prompt under 2000 tokens
    - _Requirements: 6.4, 6.9, 9.4_

  - [x] 8.3 Update ComplianceAgent response parsing and cost tracking ✅
    - Extract model, deployment, region from router response
    - Convert usage statistics to existing format
    - Calculate cost using MODEL_PRICING
    - Update insight metadata with model/deployment/region/provider
    - _Requirements: 1.2, 5.2, 5.4, 7.1-7.3_

- [x] 9. Implement cost tracking integration ✅
  - [x] 9.1 Create cost calculation utility ✅
    - Created `lib/ai/foundry/cost-calculator.ts`
    - Implemented MODEL_PRICING constant with all models (DeepSeek-R1, Llama-3.3-70B, Mistral-Large-2411, Phi-4-mini)
    - Added calculateCost(), calculateCostSimple(), calculateCostBreakdown() functions
    - Added convertRouterUsage() for router response conversion
    - Added getModelPricing(), isModelSupported(), getSupportedModels() utilities
    - Added note about syncing with official Azure pricing
    - Exported all types and functions in lib/ai/foundry/index.ts
    - _Requirements: 7.2_

  - [x] 9.2 Write property test for usage statistics conversion ✅
    - **Property 5: Usage statistics conversion**
    - **Validates: Requirements 4.3, 7.1, 7.2, 7.3**
    - Created `tests/unit/ai/foundry/cost-calculator.property.test.ts`
    - 16 property tests covering usage conversion, cost calculation, model pricing

  - [x] 9.3 Update cost tracking service integration ✅
    - Updated all 4 agents to use centralized cost-calculator.ts
    - MessagingAgent, AnalyticsAgent, SalesAgent, ComplianceAgent now use calculateCostSimple()
    - Removed duplicate MODEL_PRICING from each agent
    - logUsage() receives model, deployment, region from router response
    - Cost calculation uses correct model pricing from centralized module
    - _Requirements: 7.1, 7.3_

- [x] 10. Update Python router to support type_hint and language_hint ✅
  - [x] 10.1 Add type_hint and language_hint to RouteRequest ✅
    - Updated `lib/ai/router/models.py` RouteRequest model
    - Added optional type_hint field (ClassificationType)
    - Added optional language_hint field (LanguageCode)
    - _Requirements: 2.1-2.5_

  - [x] 10.2 Update routing logic to use hints ✅
    - Modified `lib/ai/router/routing.py` select_deployment()
    - Added apply_hints() function to override classification
    - type_hint overrides classifier type when provided
    - language_hint overrides classifier language when provided
    - Classifier serves as fallback when hints not provided
    - Updated main.py to pass hints to select_deployment()
    - Response includes type_hint_applied and language_hint_applied flags
    - _Requirements: 2.1-2.5_

  - [x] 10.3 Write unit tests for hint override logic ✅
    - Added TestApplyHints class (4 tests)
    - Added TestSelectDeploymentWithHints class (7 tests)
    - Added test_hint_override_property property test (100 iterations)
    - Added TestHintOverrideAPI class (7 tests)
    - Added test_hint_values_in_request property test (50 iterations)
    - **121 Python tests passing**
    - _Requirements: 2.1-2.5_

- [x] 11. Update agent types interface ✅
  - [x] 11.1 Update AITeamMember interface ✅
    - Added typeHint property to AITeamMember interface
    - Updated AIResponse to include deployment and region fields
    - Added InsightMetadata interface with model, deployment, region, provider, timestamp
    - Updated `lib/ai/agents/types.ts`
    - _Requirements: 5.1, 5.2_

  - [x] 11.2 Write property test for response extraction ✅
    - **Property 2: Response extraction completeness**
    - **Validates: Requirements 1.2, 5.2**
    - Created `tests/unit/ai/foundry/agent-types.property.test.ts`
    - 3 tests for response extraction

  - [x] 11.3 Write property test for JSON output format in prompts ✅
    - **Property 7: JSON output format in prompts**
    - **Validates: Requirements 6.6, 6.7, 6.8, 6.9**
    - 5 tests for JSON output format validation

  - [x] 11.4 Write property test for insight metadata ✅
    - **Property 8: Insight metadata completeness**
    - **Validates: Requirements 5.4, 7.3**
    - 6 tests for insight metadata completeness
    - 3 tests for AIResponse interface validation
    - **17 new tests total, 87 TypeScript tests passing**

- [x] 12. Final Checkpoint - Ensure all tests pass ✅
  - Ensure all tests pass, ask the user if questions arise.
  - **87 TypeScript tests passing** (6 test files)
  - **121 Python tests passing** (5 test files)
  - **Total: 208 tests passing**

- [x] 13. Update environment configuration ✅
  - [x] 13.1 Add AI_ROUTER_URL to environment files ✅
    - Updated `.env.example` with AI_ROUTER_URL and Azure AI Foundry config
    - Updated `.env.production` with AI_ROUTER_URL placeholder
    - Updated `.env.amplify.template.json` with AI_ROUTER_URL, AZURE_AI_CHAT_ENDPOINT, AZURE_AI_CHAT_KEY
    - Documented AWS deployment options (ECS, Lambda, API Gateway)
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 13.2 Update Python router deployment names ✅
    - Updated `lib/ai/router/config.py` with Mistral-Large-2411
    - Updated `lib/ai/router/.env.example` with mistral-large-2411-us
    - Updated `lib/ai/router/routing.py` model name to Mistral-Large-2411
    - Updated `lib/ai/router/docker-compose.yml` with new deployment name
    - Updated all Python tests (test_models.py, test_integration.py, test_routing.py, test_api.py)
    - **121 Python tests passing**
    - **87 TypeScript tests passing**
    - _Requirements: 4.1_

## 🎉 SPEC COMPLETE

All 13 tasks completed successfully:
- **208 total tests passing** (87 TypeScript + 121 Python)
- 4 Foundry agents created (Messaging, Analytics, Sales, Compliance)
- RouterClient with streaming support
- Cost calculator with MODEL_PRICING
- Python router with type_hint and language_hint support
- Environment configuration updated for AWS deployment
