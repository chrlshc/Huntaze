# Requirements Document

## Introduction

Ce document spécifie les exigences pour le routeur AI Huntaze, un système intelligent de routage de requêtes vers différents modèles d'IA déployés sur Azure AI Foundry dans la région East US 2. Le routeur utilise un classifieur (Phi-4-mini) pour analyser les prompts entrants et les diriger vers le modèle le plus approprié (DeepSeek-R1, Llama 3.3 70B, ou Mistral Large 2407) en fonction du type de tâche, de la complexité et du tier client.

## Glossary

- **AI_Router**: Service FastAPI qui reçoit les requêtes utilisateur, les classifie et les route vers le modèle AI approprié
- **Classifier**: Modèle Phi-4-mini utilisé pour analyser et catégoriser les prompts entrants
- **Deployment**: Instance d'un modèle AI déployé sur Azure AI Foundry avec un nom unique
- **Azure_AI_Foundry**: Plateforme Azure hébergeant les modèles AI et fournissant l'endpoint d'inférence unifié
- **Client_Tier**: Niveau d'abonnement de l'utilisateur (standard ou vip) influençant le routage
- **Classification_Result**: Objet JSON contenant le type, la complexité et la langue détectés d'un prompt
- **Model_Inference_Endpoint**: URL unique Azure pour accéder à tous les modèles déployés via le header azureml-model-deployment

## Requirements

### Requirement 1

**User Story:** As a developer, I want to classify incoming prompts automatically, so that the system can route them to the most appropriate AI model.

#### Acceptance Criteria

1. WHEN the AI_Router receives a user prompt THEN the AI_Router SHALL send the prompt to the Classifier (Phi-4-mini) for analysis
2. WHEN the Classifier analyzes a prompt THEN the Classifier SHALL return a valid JSON object containing type (math|coding|creative|chat), complexity (high|low), and language (fr|en|other)
3. IF the Classifier returns invalid JSON THEN the AI_Router SHALL parse the response to extract JSON between curly braces
4. IF the Classifier fails to return parseable JSON THEN the AI_Router SHALL use default classification values (type: chat, complexity: low, language: other)
5. WHEN serializing a Classification_Result THEN the AI_Router SHALL produce valid JSON, and WHEN deserializing that JSON THEN the AI_Router SHALL reconstruct an equivalent Classification_Result

### Requirement 2

**User Story:** As a system architect, I want the router to select the optimal model based on classification results, so that each request is handled by the most suitable AI model.

#### Acceptance Criteria

1. WHEN the Classification_Result indicates type is math or coding AND complexity is high THEN the AI_Router SHALL route to DeepSeek-R1 deployment
2. WHEN the Classification_Result indicates type is creative OR Client_Tier is vip THEN the AI_Router SHALL route to Llama 3.3 70B deployment
3. WHEN the Classification_Result indicates type is chat THEN the AI_Router SHALL route to Llama 3.3 70B deployment
4. WHEN the Classification_Result indicates language is fr AND no higher priority rule applies THEN the AI_Router SHALL route to Mistral Large 2407 deployment
5. WHEN no specific routing rule matches THEN the AI_Router SHALL route to Llama 3.3 70B deployment as fallback

### Requirement 3

**User Story:** As a developer, I want to call Azure AI models through a unified interface, so that I can easily switch between models without changing the integration code.

#### Acceptance Criteria

1. WHEN the AI_Router calls any deployed model THEN the AI_Router SHALL use the single Model_Inference_Endpoint with the azureml-model-deployment header
2. WHEN the AI_Router creates a request to a Deployment THEN the AI_Router SHALL include the deployment name in the azureml-model-deployment HTTP header
3. WHEN the AI_Router receives a response from a Deployment THEN the AI_Router SHALL extract the text content, usage statistics, and raw response
4. IF the Model_Inference_Endpoint or API key is not configured THEN the AI_Router SHALL raise a RuntimeError with a descriptive message

### Requirement 4

**User Story:** As an API consumer, I want to receive consistent response formats, so that I can reliably parse and use the AI responses.

#### Acceptance Criteria

1. WHEN the AI_Router completes a routing request THEN the AI_Router SHALL return a response containing model, deployment, region, routing classification, output text, and usage statistics
2. WHEN the AI_Router returns usage statistics THEN the AI_Router SHALL include prompt_tokens, completion_tokens, and total_tokens fields
3. IF the user submits an empty prompt THEN the AI_Router SHALL return HTTP 400 with detail "prompt vide"
4. IF an internal error occurs during processing THEN the AI_Router SHALL return HTTP 500 with the error description

### Requirement 5

**User Story:** As a DevOps engineer, I want to monitor the router health, so that I can ensure the service is running correctly.

#### Acceptance Criteria

1. WHEN a client calls the /health endpoint THEN the AI_Router SHALL return status "ok" and region "eastus2"
2. WHEN the AI_Router starts THEN the AI_Router SHALL be accessible on the configured host and port

### Requirement 6

**User Story:** As a system administrator, I want to configure deployments via environment variables, so that I can change model mappings without code changes.

#### Acceptance Criteria

1. WHEN the AI_Router initializes THEN the AI_Router SHALL read AZURE_AI_CHAT_ENDPOINT and AZURE_AI_CHAT_KEY from environment variables
2. WHEN the AI_Router initializes THEN the AI_Router SHALL read deployment names from DEPLOY_DEEPSEEK, DEPLOY_LLAMA, DEPLOY_MISTRAL, and DEPLOY_PHI_CLASSIFIER environment variables
3. WHEN a deployment environment variable is not set THEN the AI_Router SHALL use the default deployment name (deepseek-r1-us, llama33-70b-us, mistral-large-2407-us, phi4mini-classifier-us)
