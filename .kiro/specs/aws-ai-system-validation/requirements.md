# Requirements Document

## Introduction

Ce document définit les exigences pour la validation complète du système AI Huntaze et de ses killer features sur l'infrastructure AWS. L'objectif est de vérifier que tous les composants AI sont correctement configurés, déployés et fonctionnels en production.

## Glossary

- **AI Router**: Service Python déployé sur AWS ECS qui route les requêtes vers les modèles Azure AI Foundry appropriés
- **Killer Features**: Fonctionnalités AI différenciantes (Insights, Campaign Generator, Fan Segmentation)
- **Azure AI Foundry**: Plateforme Azure hébergeant les modèles AI (DeepSeek R1, Mistral Large, Phi-4, Llama)
- **ECS Fargate**: Service AWS pour exécuter des conteneurs sans gérer de serveurs
- **Health Check**: Endpoint de vérification de santé d'un service
- **Circuit Breaker**: Pattern de résilience qui coupe les appels vers un service défaillant
- **Canary Deployment**: Déploiement progressif avec pourcentage de trafic contrôlé

## Requirements

### Requirement 1: AI Router Health Verification

**User Story:** As a DevOps engineer, I want to verify that the AI Router is healthy and accessible, so that I can ensure AI features are available to users.

#### Acceptance Criteria

1. WHEN a health check request is sent to the AI Router THEN the system SHALL respond within 1 second with status "healthy"
2. WHEN the AI Router is deployed on AWS ECS THEN the system SHALL return the correct region (eastus2) in the health response
3. WHEN the AI Router container starts THEN the system SHALL log successful initialization to CloudWatch
4. IF the AI Router fails to respond within 5 seconds THEN the system SHALL trigger an alert notification

### Requirement 2: Killer Feature - AI Insights Validation

**User Story:** As a creator, I want to receive AI-generated insights from my metrics, so that I can understand my performance and make data-driven decisions.

#### Acceptance Criteria

1. WHEN metrics data is submitted to the Insights service THEN the system SHALL generate relevant insights within 10 seconds
2. WHEN generating insights THEN the system SHALL use Mistral Large model via the AI Router
3. WHEN insights are generated THEN the system SHALL return structured data with type, severity, and actionable recommendations
4. WHEN the Insights API is called THEN the system SHALL track token usage and cost for billing purposes

### Requirement 3: Killer Feature - Campaign Generator Validation

**User Story:** As a creator, I want to generate marketing campaigns using AI, so that I can efficiently create engaging content for my audience.

#### Acceptance Criteria

1. WHEN a campaign generation request is submitted THEN the system SHALL return a complete campaign within 15 seconds
2. WHEN generating campaigns THEN the system SHALL produce subject lines, body content, and A/B variations
3. WHEN optimizing subject lines THEN the system SHALL provide multiple alternatives with predicted engagement scores
4. WHEN the Campaign Generator API is called THEN the system SHALL log the request with correlation ID for tracing

### Requirement 4: Killer Feature - Fan Segmentation Validation

**User Story:** As a creator, I want to segment my fans using AI analysis, so that I can personalize my engagement strategy.

#### Acceptance Criteria

1. WHEN fan data is submitted for segmentation THEN the system SHALL categorize fans into segments (Whales, Regulars, At-risk, New, Dormant)
2. WHEN segmenting fans THEN the system SHALL use DeepSeek R1 model for complex reasoning
3. WHEN predicting churn THEN the system SHALL return a probability score between 0 and 1 with confidence level
4. WHEN segmentation is complete THEN the system SHALL provide personalized recommendations for each segment

### Requirement 5: AWS Infrastructure Connectivity

**User Story:** As a system administrator, I want to verify all AWS services are properly connected, so that the AI system operates reliably.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL verify connectivity to RDS PostgreSQL database
2. WHEN the AI Router is deployed THEN the system SHALL be accessible via the configured AI_ROUTER_URL
3. WHEN secrets are needed THEN the system SHALL retrieve them from AWS Secrets Manager successfully
4. WHEN logs are generated THEN the system SHALL write them to CloudWatch log groups

### Requirement 6: AI Provider Fallback Mechanism

**User Story:** As a user, I want the AI system to gracefully handle failures, so that I can continue using AI features even when issues occur.

#### Acceptance Criteria

1. WHEN the primary AI provider (Foundry) fails THEN the system SHALL fallback to legacy provider within 5 seconds
2. WHEN a fallback occurs THEN the system SHALL log the failure reason and fallback action
3. WHEN the circuit breaker opens THEN the system SHALL prevent further requests to the failing service for 30 seconds
4. WHEN fallback is disabled THEN the system SHALL return an error response with clear error message

### Requirement 7: Cost Tracking and Monitoring

**User Story:** As a business owner, I want to track AI usage costs, so that I can manage expenses and optimize usage.

#### Acceptance Criteria

1. WHEN an AI request is processed THEN the system SHALL calculate and record the cost based on token usage
2. WHEN costs are tracked THEN the system SHALL include model name, input tokens, output tokens, and total cost in USD
3. WHEN the admin dashboard is accessed THEN the system SHALL display aggregated AI costs by feature and time period
4. WHEN cost thresholds are exceeded THEN the system SHALL trigger alert notifications

### Requirement 8: End-to-End AI Flow Validation

**User Story:** As a QA engineer, I want to validate the complete AI flow from request to response, so that I can ensure the system works correctly in production.

#### Acceptance Criteria

1. WHEN a chat request is sent through the AI Service THEN the system SHALL route it through the AI Router and return a valid response
2. WHEN the response is received THEN the system SHALL include model metadata (model name, deployment, region)
3. WHEN multiple request types are sent (chat, math, coding, creative) THEN the system SHALL route each to the appropriate model
4. WHEN the AI Coordinator processes a request THEN the system SHALL orchestrate multiple agents and combine their responses
