# Content Trends AI Engine - Integration Specification

## Introduction

Cette spécification définit l'intégration du Content Trends AI Engine avec votre système AI existant (AI Coordinator, Router Client, Python Router). L'objectif est d'étendre votre architecture actuelle pour supporter l'analyse de contenu viral sans perturber les services existants.

## Architecture Existante Analysée

### Composants Identifiés
- **AI Coordinator** (`lib/ai/coordinator.ts`) - Orchestrateur central avec support Foundry/Legacy
- **Router Client** (`lib/ai/foundry/router-client.ts`) - Client TypeScript pour routage
- **Python Router** (`lib/ai/router/main.py`) - Service FastAPI de routage intelligent
- **Agent Registry** - Système d'agents spécialisés (messaging, analytics, sales, c