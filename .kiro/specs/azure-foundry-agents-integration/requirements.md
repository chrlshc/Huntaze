# Requirements Document

## Introduction

This feature integrates the existing TypeScript AI agents (Messaging, Analytics, Sales, Compliance) with the new Azure AI Foundry router system. The current agents use a stubbed Azure OpenAI router that throws errors. This migration connects them to the Python-based AI Router that intelligently routes requests to the appropriate Azure AI Foundry models (Phi-4-mini, DeepSeek-R1, Llama-3.3-70B, Mistral-Large-2407).

## Glossary

- **AI Agent**: A TypeScript class that processes specific types of AI requests (messaging, analytics, sales, compliance)
- **AI Router**: Python FastAPI service that classifies prompts and routes to appropriate Azure AI Foundry deployments
- **Azure AI Foundry**: Microsoft's platform for deploying and managing AI models
- **Phi-4-mini**: Small classifier model used for prompt classification
- **DeepSeek-R1**: Model optimized for math and coding tasks
- **Llama-3.3-70B**: Large model for creative and chat tasks
- **Mistral-Large-2411**: Model optimized for French language (replaces deprecated 2407)
- **Knowledge Network**: Shared memory system for AI agents to exchange insights
- **Client Tier**: User subscription level (standard, vip) affecting model selection

## Requirements

### Requirement 1

**User Story:** As a developer, I want the TypeScript agents to call the Python AI Router, so that prompts are intelligently routed to the appropriate Azure AI Foundry model.

#### Acceptance Criteria

1. WHEN a TypeScript agent processes a request THEN the system SHALL call the Python AI Router `/route` endpoint with the prompt and client tier
2. WHEN the AI Router returns a response THEN the system SHALL extract the model output, usage statistics, and routing metadata
3. IF the AI Router is unavailable THEN the system SHALL return a graceful error with retry guidance
4. WHEN building the request THEN the system SHALL include the agent's system prompt as context in the user prompt

### Requirement 2

**User Story:** As a system architect, I want each agent type mapped to appropriate model selection hints, so that the router can make optimal routing decisions.

#### Acceptance Criteria

1. WHEN the MessagingAgent sends a request THEN the system SHALL hint the router with type "chat" for fan interactions
2. WHEN the AnalyticsAgent sends a request THEN the system SHALL hint the router with type "math" for data analysis requiring reasoning
3. WHEN the SalesAgent sends a request THEN the system SHALL hint the router with type "creative" for persuasive message generation
4. WHEN the ComplianceAgent sends a request THEN the system SHALL hint the router with type "chat" for content policy checking
5. WHEN the request contains French content THEN the system SHALL include language hint "fr" for Mistral routing

### Requirement 3

**User Story:** As a platform operator, I want user subscription tiers mapped to router client tiers, so that VIP users get access to premium models.

#### Acceptance Criteria

1. WHEN a user has plan "enterprise" or "scale" THEN the system SHALL send client_tier "vip" to the router
2. WHEN a user has plan "pro" or "starter" THEN the system SHALL send client_tier "standard" to the router
3. WHEN no plan is specified THEN the system SHALL default to client_tier "standard"

### Requirement 4

**User Story:** As a developer, I want a TypeScript client for the AI Router, so that agents can easily call the routing service.

#### Acceptance Criteria

1. WHEN creating the router client THEN the system SHALL read the router URL from environment variable `AI_ROUTER_URL`
2. WHEN the router client makes a request THEN the system SHALL include proper timeout handling with 60 second default
3. WHEN the router returns usage statistics THEN the system SHALL convert them to the existing cost tracking format
4. WHEN the router client is instantiated THEN the system SHALL support AWS deployment endpoints (ECS/Lambda URL or API Gateway)
5. WHEN deployed on AWS THEN the system SHALL use the internal AWS service URL or public API Gateway endpoint

### Requirement 5

**User Story:** As a developer, I want the existing agent interfaces preserved, so that calling code does not need to change.

#### Acceptance Criteria

1. WHEN an agent's processRequest method is called THEN the system SHALL maintain the same input/output interface
2. WHEN an agent returns a response THEN the system SHALL include usage statistics in the existing format (model, inputTokens, outputTokens, costUsd)
3. WHEN an agent is initialized THEN the system SHALL continue to accept the Knowledge Network for insight sharing
4. WHEN an agent stores insights THEN the system SHALL include the actual model used (from router response) in the insight metadata

### Requirement 6

**User Story:** As a developer, I want optimized system prompts for each agent, so that they leverage the new models effectively.

#### Acceptance Criteria

1. WHEN the MessagingAgent builds a prompt THEN the system SHALL use an optimized English prompt that instructs the model to generate warm, engaging fan responses with personality matching and upsell suggestions
2. WHEN the AnalyticsAgent builds a prompt THEN the system SHALL use an optimized English prompt that instructs the model to analyze data patterns, generate predictions with confidence scores, and provide actionable recommendations in JSON format
3. WHEN the SalesAgent builds a prompt THEN the system SHALL use an optimized English prompt with few-shot examples for crafting persuasive upsell messages, PPV suggestions, and tip requests
4. WHEN the ComplianceAgent builds a prompt THEN the system SHALL use an optimized English prompt that instructs the model to detect policy violations, assess severity, and suggest compliant alternatives
5. WHEN any agent builds a prompt THEN the system SHALL ensure all instructions are in English for optimal model performance
6. WHEN the MessagingAgent generates a response THEN the system SHALL instruct the model to output JSON with fields: response, confidence, suggestedUpsell, reasoning
7. WHEN the AnalyticsAgent generates a response THEN the system SHALL instruct the model to output JSON with fields: insights[], predictions[], recommendations[], summary, confidence
8. WHEN the SalesAgent generates a response THEN the system SHALL instruct the model to output JSON with fields: optimizedMessage, suggestedPrice, confidence, reasoning, expectedConversionRate, alternativeApproaches[]
9. WHEN the ComplianceAgent generates a response THEN the system SHALL instruct the model to output JSON with fields: is_compliant, violations[], compliant_alternative, confidence

### Requirement 7

**User Story:** As a platform operator, I want cost tracking to work with the new router, so that usage can be monitored and billed.

#### Acceptance Criteria

1. WHEN the router returns usage statistics THEN the system SHALL log them to the existing cost tracking service
2. WHEN calculating costs THEN the system SHALL use the model name from the router response to determine pricing
3. WHEN logging usage THEN the system SHALL include the deployment name and region from the router response

### Requirement 8

**User Story:** As a developer, I want the router client to handle errors gracefully, so that the system remains stable.

#### Acceptance Criteria

1. IF the router returns HTTP 400 THEN the system SHALL throw a validation error with the detail message
2. IF the router returns HTTP 500 THEN the system SHALL throw a service error and suggest retry
3. IF the router connection times out THEN the system SHALL throw a timeout error with the configured timeout value
4. IF the router is unreachable THEN the system SHALL throw a connection error with the endpoint URL



### Requirement 9

**User Story:** As a developer, I want each agent to have a dedicated optimized prompt template, so that the new models produce high-quality outputs.

#### Acceptance Criteria

1. WHEN defining the MessagingAgent prompt THEN the system SHALL include: role definition as OnlyFans creator assistant, personality matching instructions, fan preference consideration, upsell opportunity detection, professional boundary maintenance
2. WHEN defining the AnalyticsAgent prompt THEN the system SHALL include: role definition as performance analyst, pattern recognition instructions, prediction methodology, benchmark comparison, anomaly detection guidance
3. WHEN defining the SalesAgent prompt THEN the system SHALL include: role definition as monetization specialist, persuasion techniques, pricing optimization, conversion rate awareness, relationship preservation
4. WHEN defining the ComplianceAgent prompt THEN the system SHALL include: role definition as content compliance specialist, platform-specific rules (OnlyFans, Instagram, Twitter, TikTok), severity assessment criteria, constructive feedback guidance
5. WHEN any prompt is defined THEN the system SHALL keep it under 2000 tokens to leave room for context and response

### Requirement 10

**User Story:** As a developer, I want the router client to support streaming responses, so that long responses can be displayed progressively.

#### Acceptance Criteria

1. WHEN the router supports streaming THEN the system SHALL provide an optional streaming method in the client
2. WHEN streaming is not available THEN the system SHALL fall back to standard request/response
3. WHEN streaming is used THEN the system SHALL yield text chunks as they arrive
