# Azure AI Migration Plan (AutoGen → Azure AI Foundry Agents)

This repo includes a scaffold to migrate the multi‑agent workflow from the custom AutoGen microservice to Azure AI Foundry Agents + Azure Functions.

## Target Architecture

- Agents: Azure AI Foundry Agent Service (Writer, Safeguard, Orchestrator)
- API: Azure Functions (HTTP endpoints `POST /api/draft`, `GET /api/sessions/{id}`)
- Storage: Azure Cosmos DB (sessions/messages) – to replace DynamoDB later
- Events: Azure Event Grid (review needed) – to replace custom HMAC webhooks
- Queueing: Azure Service Bus (FIFO via sessions) – to replace SQS
- Monitoring: Azure Monitor / App Insights

## 1) Provision Azure AI Foundry

Prereqs: `az login`, `az extension add --name ml`.

```bash
LOCATION=eastus RG=huntaze-ai HUB=huntaze-ai-hub PROJECT=huntaze-agents \
bash scripts/azure-setup.sh
```

Gather the project endpoint and set:

```
AZURE_AI_PROJECT_ENDPOINT=https://<project>.openai.azure.com/
```

## 2) Local Azure Functions (scaffold)

- Code: `aifoundry/functions/function_app.py`
- Config: `aifoundry/functions/host.json`, `aifoundry/functions/local.settings.json.example`
- Python deps: `aifoundry/functions/requirements.txt`

To run locally (requires Azure Functions Core Tools):

```bash
cd azure/functions
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp local.settings.json.example local.settings.json
# Fill AZURE_AI_PROJECT_ENDPOINT (+ Entra ID variables or managed identity)
func start
```

## 3) App wiring (Next.js)

- New env: `AGENTS_API_URL` – if set, Next.js proxies to Azure Functions instead of `AUTOGEN_SERVICE_URL`.
- Files updated:
  - `app/api/internal/autogen/draft/route.ts`
  - `app/api/internal/autogen/sessions/[sessionId]/route.ts`
  - `app/api/internal/autogen/sessions/[sessionId]/decision/route.ts`

Set in `.env.local` or hosting env:

```
AGENTS_API_URL=https://<your-azure-functions-host>/api
```

## 4) Agents (scaffold)

- Writer: `aifoundry/agents/writer_agent.py`
- Safeguard: `aifoundry/agents/safeguard_agent.py`
- Orchestrator: `aifoundry/agents/orchestrator.py`

These use `azure-ai-projects` SDK. The orchestrator assembles the loop Writer → Safeguard with up to 3 iterations and returns a structured `DraftResponse`.

## 5) Next Steps (optional)

- Replace SQS with Azure Service Bus in the app API (`@azure/service-bus`), gated by a new env `SERVICEBUS_CONNECTION_STRING`.
- Persist sessions/messages in Azure Cosmos DB (see `storage/cosmos_store.py` pattern in the migration plan).
- Publish events to Event Grid on `needs_review`.
- Wire App Insights by setting `APPLICATIONINSIGHTS_CONNECTION_STRING`.

## Environment Variables (added)

Check `.env.example` for:

- `AGENTS_API_URL`, `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_SUBSCRIPTION_ID`
- `COSMOS_ENDPOINT`, `COSMOS_KEY`
- `SERVICEBUS_CONNECTION_STRING`
- `EVENTGRID_ENDPOINT`, `EVENTGRID_KEY`
- `APPLICATIONINSIGHTS_CONNECTION_STRING`

## Rollout

1) Deploy Azure Functions (staging) and set `AGENTS_API_URL` in the web app.
2) Run A/B tests by routing a small percentage to Azure.
3) Scale to 100%, then decommission the AutoGen microservice.
