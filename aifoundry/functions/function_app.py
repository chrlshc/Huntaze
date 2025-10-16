import json
import os
import sys
import azure.functions as func
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential

# Ensure repo root is on sys.path so `aifoundry.*` imports resolve when running from the functions folder
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from aifoundry.agents.orchestrator import HuntazeAgentOrchestrator, DraftRequest as SDKDraftRequest
from aifoundry.agents.rest_orchestrator import RestOrchestrator, DraftRequest as RestDraftRequest


app = func.FunctionApp()
AGENTS_STUB = os.getenv("AGENTS_STUB", "false").lower() == "true"
AGENTS_USE_REST = os.getenv("AGENTS_USE_REST", "true").lower() == "true"


def _client() -> AIProjectClient:
    endpoint = os.getenv("AZURE_AI_PROJECT_ENDPOINT")
    if not endpoint:
        raise RuntimeError("Missing AZURE_AI_PROJECT_ENDPOINT")

    # Support both Entra ID (DefaultAzureCredential) and API key (AzureKeyCredential)
    # Prefer connection string if provided (format: host;subscriptionId;resourceGroup;projectName)
    conn = os.getenv("AZURE_AI_PROJECT_CONNECTION_STRING")
    api_key = os.getenv("AZURE_AI_PROJECT_API_KEY")
    if api_key:
        cred = AzureKeyCredential(api_key)
    else:
        cred = DefaultAzureCredential()

    # Connection string path (if available)
    if conn:
        try:
            return AIProjectClient.from_connection_string(conn, credential=cred)  # type: ignore[attr-defined]
        except Exception:
            # Fallback: parse 'host;sub;rg;project'
            try:
                host, sub_id, rg, proj = conn.split(";")
                return AIProjectClient(
                    endpoint=f"https://{host}" if not host.startswith("http") else host,
                    credential=cred,
                    subscription_id=sub_id,
                    resource_group_name=rg,
                    project_name=proj,
                )
            except Exception:
                pass

    sub_id = os.getenv("AZURE_SUBSCRIPTION_ID")
    rg = os.getenv("AZURE_RESOURCE_GROUP", "huntaze-ai")
    proj = os.getenv("AZURE_PROJECT_NAME", "huntaze-agents")
    if sub_id:
        return AIProjectClient(
            endpoint=endpoint,
            credential=cred,
            subscription_id=sub_id,
            resource_group_name=rg,
            project_name=proj,
        )
    return AIProjectClient(endpoint=endpoint, credential=cred)


_orchestrator = None


def _orch() -> HuntazeAgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        client = _client()
        cse = os.getenv("AZURE_CONTENT_SAFETY_ENDPOINT")
        _orchestrator = HuntazeAgentOrchestrator(client, content_safety_endpoint=cse)
    return _orchestrator


@app.route(route="draft", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
async def draft_message(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
        if AGENTS_STUB:
            stub = {
                "status": "ok",
                "session_id": "stub-session",
                "draft": "Hello from stub orchestrator (set AGENTS_STUB=false to call Azure)",
                "risk": {"label": "green", "score": 95, "infractions": [], "recommendations": []},
                "iterations": 1,
            }
            return func.HttpResponse(body=json.dumps(stub), mimetype="application/json", status_code=200)
        # Choose REST path by default for better compatibility
        if AGENTS_USE_REST:
            ro = RestOrchestrator(os.getenv("AZURE_AI_PROJECT_ENDPOINT", ""))
            rreq = RestDraftRequest(
                trace_id=body.get("trace_id", "local"),
                fan_context=body.get("fan_context", {}),
                objectives=body.get("objectives", {}),
            )
            resp = ro.process_message_request(rreq)
            return func.HttpResponse(body=json.dumps(resp.__dict__), mimetype="application/json", status_code=200)
        # Fallback to SDK client
        dr = SDKDraftRequest(
            trace_id=body.get("trace_id", "local"),
            fan_context=body.get("fan_context", {}),
            objectives=body.get("objectives", {}),
        )
        resp = await _orch().process_message_request(dr)
        return func.HttpResponse(
            body=json.dumps(resp.__dict__),
            mimetype="application/json",
            status_code=200,
        )
    except Exception as e:  # noqa: BLE001
        if AGENTS_STUB:
            stub = {
                "status": "ok",
                "session_id": "stub-session",
                "draft": "Hello from stub orchestrator (fallback)",
                "risk": {"label": "yellow", "score": 50, "infractions": [], "recommendations": [str(e)]},
                "iterations": 1,
            }
            return func.HttpResponse(body=json.dumps(stub), mimetype="application/json", status_code=200)
        return func.HttpResponse(body=json.dumps({"error": str(e)}), status_code=500)


@app.route(route="sessions/{sessionId}", methods=["GET"], auth_level=func.AuthLevel.FUNCTION)
def get_session(req: func.HttpRequest) -> func.HttpResponse:
    session_id = req.route_params.get("sessionId")
    client = _client()
    thread = client.agents.get_thread(thread_id=session_id)
    messages = client.agents.list_messages(thread_id=session_id)
    out = {
        "session_id": session_id,
        "metadata": getattr(thread, "metadata", {}),
        "message_count": len(getattr(messages, "data", [])),
    }
    return func.HttpResponse(body=json.dumps(out), mimetype="application/json", status_code=200)
