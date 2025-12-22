# Requirements Document

## Introduction

Le module "Machine de Guerre v2.0" (Content & Trends) représente un pivot stratégique vers la dominance cognitive dans l'écosystème de création de contenu numérique. Face à la commoditisation de la production vidéo par IA, ce système se concentre sur l'architecture cognitive qui sous-tend la viralité : l'identification des tendances, la construction psychologique des "hooks" et la structuration narrative.

Ce système exploite Azure AI Foundry avec une architecture quadrimodale:
- **DeepSeek R1** pour le raisonnement cognitif avancé ($0.00135/1K input, $0.0054/1K output)
- **DeepSeek V3** pour la génération créative rapide ($0.00114/1K input, $0.00456/1K output)
- **Phi-4-multimodal-instruct** (Azure Foundry Partners & Community) pour l'analyse multimodale unifiée (texte + images + audio) avec contexte 128K
- **Azure Speech Batch Transcription** pour la transcription audio à coût optimisé ($0.18/heure)

L'objectif est de construire un pipeline automatisé qui ingère des signaux sociaux bruts, déconstruit les mécanismes de viralité grâce à un raisonnement basé sur l'apprentissage par renforcement, et produit des scripts et briefs créatifs d'une précision chirurgicale. Le système permet une analyse "timeline seconde par seconde" des shorts pour identifier les moments clés de rétention.

La thèse centrale est que le raisonnement est le goulot d'étranglement, non la génération. En utilisant DeepSeek R1 sur Azure, nous transformons la 'Machine de Guerre' d'une usine de contenu en une unité de renseignement stratégique capable de faire de l'ingénierie inverse sur la viralité en temps réel.

## Glossary

- **Azure_AI_Foundry**: Plateforme cloud Microsoft pour le déploiement et la gestion de modèles d'IA
- **DeepSeek_R1**: Modèle de raisonnement (Reasoning Model) utilisant l'apprentissage par renforcement avec chaîne de pensée explicite, optimisé pour l'analyse causale et stratégique ($0.00135/1K input, $0.0054/1K output)
- **DeepSeek_V3**: Modèle Mixture-of-Experts (MoE) avec 671B paramètres totaux dont 37B activés par token, optimisé pour la génération créative rapide ($0.00114/1K input, $0.00456/1K output)
- **Phi-4-multimodal-instruct**: Modèle multimodal Azure Foundry Partners & Community pour l'analyse unifiée texte + images + audio via Chat Completions, contexte 128K tokens
- **Azure_Speech_Batch_Transcription**: Service Azure de transcription audio en batch à $0.18/heure, optimisé pour le traitement de volumes importants
- **BullMQ**: Système de files d'attente basé sur Redis pour l'orchestration asynchrone
- **Apify**: Service de web scraping pour l'ingestion de données des plateformes sociales
- **MaaS**: Model-as-a-Service, paradigme serverless pour l'utilisation de modèles d'IA
- **Keyframes**: Images clés extraites d'une vidéo pour l'analyse visuelle
- **Chain_of_Thought**: Processus de raisonnement étape par étape généré par DeepSeek R1, capturé mais jamais réinjecté dans l'historique
- **Viral_Prediction_Engine**: Algorithme de prédiction de viralité basé sur l'analyse multimodale
- **Hook_Retain_Reward**: Framework théorique d'analyse virale (0-3s accroche, 3s-fin rétention, gain final récompense)
- **Pointed_Truth**: Type de hook basé sur une vérité directe et confrontante qui interrompt le pattern de pensée
- **Micro_Scenario**: Type de hook utilisant un scénario miniature pour capturer l'attention immédiatement
- **Emotional_Driver**: Moteur émotionnel à haute activation (Colère, Émerveillement, Anxiété, Joie) propulsant le partage viral
- **Cognitive_Dissonance**: Mécanisme psychologique créant une tension mentale exploitée pour la viralité
- **Viral_Velocity**: Métrique de vitesse de propagation (vues/heure, partages/heure) pour détecter les tendances émergentes
- **Sound_Arbitrage**: Exploitation de l'écart temporel entre tendances audio TikTok et Instagram Reels (1-2 semaines)
- **UGC_Brief**: Document structuré pour créateurs contenant one-liner, do's/don'ts, shot list et variations de hooks
- **Trend_Gap**: Opportunité d'arbitrage identifiée quand un son a une vélocité élevée mais un nombre total de vidéos faible
- **Timeline_Analysis**: Analyse seconde par seconde des shorts pour identifier les moments clés de rétention et d'engagement

## Requirements

### Requirement 1: Infrastructure Azure AI Foundry avec Architecture Quadrimodale

**User Story:** En tant qu'architecte système, je veux déployer l'infrastructure sur Azure AI Foundry avec une architecture quadrimodale (DeepSeek R1/V3, Phi-4-multimodal, Azure Speech), afin de bénéficier d'une plateforme serverless optimisée pour le raisonnement cognitif, la génération créative, et l'analyse multimodale unifiée.

#### Acceptance Criteria

1. THE Azure_AI_Foundry SHALL be configured with Model-as-a-Service (MaaS) endpoints for DeepSeek R1 (reasoning), DeepSeek V3 (generation), and Phi-4-multimodal-instruct (multimodal analysis)
2. THE DeepSeek_R1 SHALL be deployed with apprentissage par renforcement (RL) configuration without preliminary supervised fine-tuning (SFT), pricing at $0.00135/1K input and $0.0054/1K output
3. THE DeepSeek_V3 SHALL be configured as Mixture-of-Experts (MoE) with 671B total parameters and 37B activated per token, pricing at $0.00114/1K input and $0.00456/1K output
4. THE Phi-4-multimodal-instruct SHALL be deployed from Azure Foundry Partners & Community catalog with 128K context window for unified text + images + audio analysis via Chat Completions API
5. THE Azure_Speech_Batch_Transcription SHALL be configured for audio transcription at $0.18/hour for cost-efficient processing of video audio tracks
6. WHEN the system experiences load spikes, THE Azure_AI_Foundry SHALL scale automatically from 100 to 100,000 requests per day without DevOps intervention
7. THE system SHALL use Azure AI Inference SDK with OpenAI API compatibility for seamless model switching and fallback capabilities
8. THE deployment SHALL be configured in the same Azure region as AI models to minimize network latency and ensure 99.9% availability
9. THE system SHALL implement data boundary protection ensuring scraped competitor data remains within Azure trust boundary and is not used for public model training

### Requirement 2: Architecture Bimodale DeepSeek R1/V3 avec Prompt Engineering Avancé

**User Story:** En tant que système d'analyse cognitive, je veux utiliser DeepSeek R1 pour le raisonnement stratégique et DeepSeek V3 pour la génération créative, afin d'optimiser la qualité analytique et l'efficacité économique selon leurs spécialisations respectives.

#### Acceptance Criteria

1. THE DeepSeek_R1 SHALL be used exclusively for cognitive analysis, viral deconstruction, and strategic reasoning with explicit Chain-of-Thought generation
2. THE DeepSeek_V3 SHALL be used exclusively for creative writing, script generation, and content formatting with direct fluent generation
3. THE DeepSeek_R1 SHALL implement "No-System-Prompt" protocol with minimal or null system instructions to preserve reinforcement learning pathways
4. THE DeepSeek_R1 SHALL use temperature of 0.6 (recommended range 0.5-0.7) to balance analytical flexibility and logical coherence
5. THE system SHALL capture reasoning tokens from DeepSeek R1 but never reinject them into conversation history to prevent contamination
6. THE DeepSeek_V3 SHALL support traditional system prompts for persona definition (e.g., "Tu es un directeur créatif senior") to control tone and brand voice
7. THE system SHALL implement pre-fill injection of &lt;think&gt; tags to force DeepSeek R1 into Chain-of-Thought mode when reasoning is skipped
8. THE DeepSeek_V3 SHALL leverage its 128k context window to maintain narrative continuity across long-term campaigns and extensive brand guidelines

### Requirement 3: Analyse Multimodale Unifiée avec Phi-4 et Azure Speech

**User Story:** En tant qu'analyste de contenu viral, je veux analyser les éléments visuels et audio des vidéos avec Phi-4-multimodal-instruct et Azure Speech Batch Transcription, afin de comprendre les signaux visuels, les expressions faciales, les dynamiques de montage, et le contenu audio qui contribuent à la viralité, avec une analyse "timeline seconde par seconde".

#### Acceptance Criteria

1. WHEN a video is received, THE system SHALL extract keyframes using FFmpeg scene change detection at strategic points (beginning, 25%, 50%, 75%, end)
2. THE Phi-4-multimodal-instruct SHALL receive keyframes assembled in composite grid images (2x2 or 3x3 layout) to preserve temporal context and editing rhythm
3. THE system SHALL resize composite grids to maximum 2048x2048 pixels to optimize token consumption while maintaining visual fidelity
4. THE system SHALL host composite images on Azure Blob Storage with short-lived SAS tokens instead of Base64 encoding to reduce API payload size
5. THE Phi-4-multimodal-instruct SHALL perform comprehensive analysis including OCR on embedded text, facial expression detection, editing dynamics analysis, and object identification via a single Chat Completions multimodal call
6. THE Azure_Speech_Batch_Transcription SHALL extract audio from videos and transcribe at $0.18/hour with speaker diarization and timestamp alignment
7. THE system SHALL generate dense captions noting objects, facial expressions, editing dynamics, on-screen text, audio content, and visual storytelling elements
8. THE visual analysis SHALL identify pattern interrupts, visual hooks, and retention mechanisms used in the first 3 seconds of content
9. THE system SHALL perform "timeline seconde par seconde" analysis for shorts, correlating visual keyframes with audio transcription timestamps to identify engagement peaks
10. THE Phi-4-multimodal-instruct SHALL leverage its 128K context window to process multiple keyframes, audio transcription, and analysis context in a single unified call

### Requirement 4: Architecture Backend Asynchrone avec BullMQ et Gestion de Latence

**User Story:** En tant qu'utilisateur, je veux que le système reste réactif pendant les analyses longues de raisonnement DeepSeek R1, afin de ne pas bloquer l'interface utilisateur lors des analyses cognitives complexes qui peuvent prendre 10-30 secondes.

#### Acceptance Criteria

1. THE NestJS_Backend SHALL implement asynchronous processing using BullMQ queues with Redis persistence for task durability
2. THE system SHALL implement task queue architecture (Celery, RabbitMQ, or Azure Functions) where users receive notifications when analysis is ready instead of real-time waiting
3. THE BullMQ SHALL support job prioritization for premium users over routine background tasks with configurable priority levels
4. THE system SHALL manage DeepSeek R1 latency (10-30 seconds for complex analysis) through asynchronous processing without user interface blocking
5. THE system SHALL limit concurrent workers to respect Azure API rate limits and prevent 429 throttling errors
6. THE system SHALL implement exponential backoff retry strategy for failed API calls with jitter to prevent thundering herd effects
7. THE BullMQ processors SHALL run in sandboxed Node.js processes to isolate CPU-intensive tasks and prevent memory leaks

### Requirement 5: Ingestion Sécurisée via Apify avec Scrapers Spécialisés

**User Story:** En tant qu'administrateur système, je veux sécuriser l'ingestion de données depuis les scrapers Apify spécialisés (TikTok Sound Scraper, Instagram Reel Scraper), afin de prévenir les attaques et garantir la qualité des données de tendances sociales.

#### Acceptance Criteria

1. THE system SHALL integrate TikTok Trends Scraper (clockworks/tiktok-trends-scraper) for audio IDs, hashtag velocity, and trending sound detection
2. THE system SHALL integrate TikTok Sound Scraper (clockworks/tiktok-sound-scraper) for sound usage metrics, BPM correlation, and viral audio arbitrage opportunities
3. THE system SHALL integrate Instagram Reel Scraper (apify/instagram-reel-scraper) for cross-platform trend migration analysis and sentiment extraction from comments
4. WHEN Apify sends webhook notifications, THE system SHALL verify cryptographic signatures using timing-safe comparison to prevent spoofing
5. THE webhook_endpoint SHALL implement idempotency using Redis with 24-48 hour TTL to prevent duplicate processing of viral content
6. THE system SHALL validate payload structure and filter out promoted content (is_promoted or ad_status) to focus on organic viral mechanisms
7. THE system SHALL implement data normalization middleware to clean JSON, cluster content by sound_id or hashtag, and anonymize PII while preserving performance metadata
8. THE system SHALL detect "Trend Gaps" where sounds have high velocity but low total video count, indicating arbitrage opportunities

### Requirement 6: Résilience et Circuit Breaker avec Gestion des Coûts

**User Story:** En tant que système de production, je veux maintenir la disponibilité même lors de pannes partielles des services externes, afin d'assurer la continuité de service tout en optimisant les coûts d'inférence IA.

#### Acceptance Criteria

1. WHEN Azure AI services return 429 or 503 errors, THE system SHALL implement exponential backoff retry with jitter (2s, 4s, 8s, 16s) up to maximum attempts
2. THE system SHALL monitor DeepSeek V3 cost efficiency (approximately $1.14 USD per million input tokens, $4.56 USD per million output tokens) and implement budget controls
3. THE system SHALL enable generation of 50 script variations for under $0.50 marginal cost, demonstrating the economic advantage over video generation
4. IF error rate exceeds threshold, THE system SHALL activate circuit breaker to prevent cascading failures and preserve API quota
5. THE BullMQ_Processors SHALL run in sandboxed Node.js processes to isolate CPU-intensive tasks and prevent memory exhaustion
6. WHEN circuit breaker is active, THE system SHALL queue requests for later processing instead of failing immediately, preserving user work
7. THE system SHALL monitor and alert on API quota consumption via Azure Monitor with predictive alerting before quota exhaustion

### Requirement 7: Pipeline d'Analyse Virale avec Framework Hook-Retain-Reward

**User Story:** En tant qu'analyste marketing, je veux comprendre les mécanismes viraux selon le framework Hook-Retain-Reward d'Alex Hormozi, afin de reproduire scientifiquement ces mécanismes pour mes clients avec une précision chirurgicale.

#### Acceptance Criteria

1. THE DeepSeek_R1 SHALL analyze content using Hook-Retain-Reward framework, deconstructing videos into temporal phases: Hook (0-3s interruption), Retention (3s-end engagement), Reward (final gain)
2. THE system SHALL identify specific hook types including Pointed Truth (confrontational reality), Micro-Scenario (miniature story), Fast Reward (immediate gratification), and Constraint Negative (what to stop doing)
3. THE DeepSeek_R1 SHALL extract emotional drivers from 500+ comments to identify primary triggers: Status Seeking (tagging friends), Relatability (identification), Outrage (indignation), or Validation (emotional support)
4. THE system SHALL perform Gap Analysis by identifying questions in comments that videos didn't answer, revealing Knowledge Gaps for competitive advantage
5. THE Viral_Prediction_Engine SHALL combine visual analysis from Llama Vision with engagement velocity metrics (views/hour, shares/hour) to calculate replicability scores
6. THE system SHALL detect cognitive dissonance mechanisms and pattern interrupts that create mental tension exploited for viral sharing
7. THE analysis SHALL generate structured JSON containing viral mechanisms, emotional triggers, replicability scores, and actionable strategic recommendations
8. THE system SHALL identify Sound Arbitrage opportunities by detecting trending audio on TikTok that is under-utilized on Instagram Reels (1-2 week migration lag)

### Requirement 8: Génération de Contenu Adaptatif avec Briefs UGC Structurés

**User Story:** En tant que créateur de contenu, je veux générer des scripts adaptés à ma marque basés sur les mécanismes viraux identifiés, afin de créer du contenu viral personnalisé avec des briefs UGC complets pour l'exécution.

#### Acceptance Criteria

1. THE DeepSeek_V3 SHALL generate exactly 3 script variations per identified viral mechanism, adapted to client brand context while preserving core viral triggers
2. THE content_generation SHALL use persona prompting to match target brand tone and voice, transforming social media trends into relevant B2B metaphors when appropriate
3. THE system SHALL generate structured JSON scripts containing title, concept_logic (R1 reasoning summary), hook_variant type, visual_cues for creators, script_body with timestamps, and SEO-optimized captions
4. THE system SHALL create comprehensive UGC Briefs including One-Liner (mood description), Do's and Don'ts (derived from competitor failure analysis), Shot List (chronological B-roll requirements), and 3 distinct hook variations for A/B testing
5. THE DeepSeek_V3 SHALL leverage its MoE architecture for dynamic tone modulation, adapting the same viral logic across different brand voices (professional, casual, humorous, authoritative)
6. THE system SHALL maintain "Institutional Memory" by feeding V3 the complete history of brand transcriptions via its 128k context window to prevent repetition of previous ideas
7. THE generated content SHALL include hooks, narrative structure, call-to-action recommendations, and viral element preservation strategies
8. THE system SHALL enable bulk UGC brief generation for influencer campaigns, creating 50+ unique briefs with different hook angles from a single viral mechanism analysis

### Requirement 9: Sécurité et Conformité avec Architecture Zero Trust

**User Story:** En tant qu'administrateur sécurité, je veux garantir que le système respecte les standards de sécurité enterprise avec protection des données concurrentielles, afin de protéger les stratégies propriétaires et la propriété intellectuelle des analyses virales.

#### Acceptance Criteria

1. THE system SHALL implement Zero Trust architecture using Microsoft Entra ID with role-based access control for sensitive viral intelligence
2. THE system SHALL ensure that competitor transcriptions, internal strategies, and viral analysis remain within Azure trust boundary and are never used for public model training
3. THE application SHALL use RBAC permissions with principle of least privilege, restricting access to viral mechanisms and competitive intelligence based on user roles
4. WHEN storing sensitive data, THE system SHALL use Azure Key Vault for API keys, webhook secrets, and cryptographic signatures with automatic rotation
5. THE system SHALL implement audit logging for all AI model interactions, viral analysis results, and competitive intelligence access with immutable log storage
6. THE system SHALL comply with GDPR and data retention policies for scraped social media content while preserving analytical value
7. THE system SHALL implement data minimization by removing PII from scraped content while retaining performance metadata essential for viral analysis

### Requirement 10: Monitoring et Observabilité avec Métriques de Performance Virale

**User Story:** En tant qu'ingénieur DevOps, je veux surveiller les performances du système et la qualité des analyses virales, afin de détecter et résoudre proactivement les problèmes tout en optimisant la précision des prédictions de viralité.

#### Acceptance Criteria

1. THE system SHALL integrate with Azure Monitor for comprehensive telemetry collection including DeepSeek R1 reasoning chain quality and V3 generation fluency metrics
2. THE monitoring SHALL track token consumption costs (DeepSeek V3: ~$1.14 input, ~$4.56 output per million tokens), latency (R1: 10-30s, V3: <5s), and success rates across all AI model interactions
3. THE system SHALL maintain custom dashboards for viral prediction accuracy, content generation quality scores, and replicability score validation against actual performance
4. THE monitoring SHALL track Sound Arbitrage success rates, Hook-Retain-Reward framework accuracy, and emotional trigger identification precision
5. WHEN anomalies are detected in viral prediction accuracy or content generation quality, THE system SHALL trigger automated alerts to operations teams with diagnostic context
6. THE system SHALL maintain performance baselines for reasoning chain depth, content generation creativity scores, and SLA compliance metrics for continuous optimization
7. THE system SHALL implement predictive alerting for API quota consumption to prevent service interruption during high-volume trend analysis periods
8. THE monitoring SHALL track the economic efficiency of the "No-Video" strategy by measuring cost per viral insight versus traditional video generation approaches

### Requirement 11: Flux de Travail Opérationnels Automatisés

**User Story:** En tant qu'équipe marketing, je veux des flux de travail automatisés pour le briefing quotidien de tendances et la contre-attaque concurrentielle, afin de maintenir un avantage stratégique constant dans l'écosystème de contenu viral.

#### Acceptance Criteria

1. THE system SHALL execute daily automated "Briefing de Tendance" at 6:00 AM, scraping top 50 trending sounds in client niche and generating strategic analysis
2. THE DeepSeek_R1 SHALL identify "Méta-Tendances" (e.g., shift from 10-step routines to 'Skin Cycling') and generate 3 script variations: Educational (step-by-step), Controversial (debunking), and Visual (texture focus)
3. THE system SHALL deliver daily digest via Slack channel or Notion dashboard with viral insights, script recommendations, and competitive intelligence
4. THE system SHALL implement "Competitor Counter-Strike" by detecting viral competitor content (views > 100k in < 24h) and automatically generating response scripts that acknowledge trends while pivoting to client USP
5. THE system SHALL generate bulk UGC briefs for influencer campaigns, creating 50+ unique briefs from single product URL and 5 competitor videos, each with different hook angles
6. THE system SHALL implement Prompt Chain architecture: Ingest (Apify) → Normalize (Python) → Reason (R1) → Critic (R1 self-correction) → Generate (V3) → Format (PDF Brief)
7. THE system SHALL maintain "Institutional Memory" by tracking previously generated content to prevent repetition and ensure creative evolution
8. THE system SHALL support real-time trend monitoring with configurable alerts for sudden viral spikes in relevant niches or competitor activities