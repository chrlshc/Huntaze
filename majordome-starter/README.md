# Majordome Omniprésent — Starter (Azure OpenAI tools)

Ce starter met en place le *cerveau* (Orchestrator) + une *boîte à outils* (tools) + un *bouton flottant* (UI).

## 1) Dépendances
```bash
npm i openai
# Optionnel (typing Azure OpenAI / compat):
npm i @azure/openai
```

## 2) Variables d'environnement
Dans `.env.local`:
```bash
AZURE_OPENAI_ENDPOINT="https://<resource>.openai.azure.com"
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_API_VERSION="2024-10-21"
AZURE_OPENAI_DEPLOYMENT="YOUR_DEPLOYMENT_NAME"         # défaut
MAJORDOME_ORCHESTRATOR_DEPLOYMENT="YOUR_DEPLOYMENT_NAME" # optionnel (sinon fallback sur AZURE_OPENAI_DEPLOYMENT)
MAJORDOME_COPY_DEPLOYMENT="YOUR_DEPLOYMENT_NAME"         # optionnel (sinon fallback sur AZURE_OPENAI_DEPLOYMENT)
```

## 3) Backend
- `src/lib/ai/majordome.ts` : orchestrateur (tool calling loop, multi-tool, confirmation)
- `src/lib/ai/tools/index.ts` : registry des tools + handlers
- `src/lib/housekeepers/queue.ts` : abstraction de queue (à remplacer en prod)
- `src/app/api/majordome/route.ts` : endpoint Next.js (optionnel)

## 4) Frontend
- `src/components/MajordomeWidget.tsx` : bouton flottant + chat minimaliste

## 5) Tools inclus
- `tool_scrape_history`
- `tool_analyze_profile`
- `tool_draft_broadcast`
- `tool_configure_settings` (confirmation)
- `tool_whale_watch` (confirmation)
- `tool_clean_knowledge_base` (confirmation)
- `ingest_knowledge`
- `get_revenue_report`

## 6) Ajouter un nouveau Housekeeper (nouvelle fonctionnalité)
1. Ajouter une entrée dans `TOOL_REGISTRY` avec:
   - JSON schema `parameters`
   - handler qui enqueue un job ou appelle un service
2. C'est tout. L'UI ne change pas.

## 7) Confirmation
Les tools `requiresConfirmation: true` renvoient un `NEEDS_CONFIRMATION` et la UI propose de taper `CONFIRME`.
