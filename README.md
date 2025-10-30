# Huntaze - AI Platform for Content Creators
<!-- Deployment: 2025-08-27 -->

## Azure OpenAI (Configuration rapide)

Le service AI supporte Azure OpenAI nativement (endpoints Azure, en‑têtes `api-key`, version d’API, auto‑détection Azure vs OpenAI standard).

- Variables d’environnement utilisées (voir `.env.azure.example`):
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_OPENAI_ENDPOINT` (ex: `https://votre-ressource.openai.azure.com`)
  - `AZURE_OPENAI_API_VERSION` (défaut: `2024-02-15-preview`)
  - `DEFAULT_AI_MODEL` (nom du déploiement Azure, ex: `gpt-4o-mini`)
  - `DEFAULT_AI_PROVIDER` (souvent `openai`)

- Le service détecte automatiquement Azure si les variables ci‑dessus sont présentes; sinon, il bascule sur OpenAI standard.

Guides détaillés:
- `docs/AZURE_OPENAI_SETUP.md` — Guide complet d’utilisation
- `docs/AI_SERVICE_AZURE_MIGRATION.md` — Résumé technique des changements

Important: ne committez jamais vos clés API. Mettez vos vraies valeurs uniquement dans votre `.env` local.
