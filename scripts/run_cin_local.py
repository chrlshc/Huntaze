"""
Minimal runner to execute the CIN pipeline locally against your deployed Functions + Azure Agents.

Env required:
  FUNC_BASE               # e.g., https://<functions-app>.azurewebsites.net
  FUNC_KEY                # (optional) if your Functions use authLevel=function
  SERVICE_BUS_FQNS        # <namespace>.servicebus.windows.net
  AZURE_AI_PROJECT_ENDPOINT  # Azure AI Foundry Project endpoint (for AIProjectClient)
  (Auth) Use Managed Identity on Azure or set AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET

Run:
  python scripts/run_cin_local.py
"""

import os
from pprint import pprint

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

from aifoundry.agents.cin.orchestrator import CINAgentOrchestrator


def main():
    # Validate env
    for var in ["FUNC_BASE", "SERVICE_BUS_FQNS", "AZURE_AI_PROJECT_ENDPOINT"]:
        if not os.getenv(var):
            raise SystemExit(f"Missing required env: {var}")

    # Auth (MI or SP)
    cred = DefaultAzureCredential()
    client = AIProjectClient(endpoint=os.environ["AZURE_AI_PROJECT_ENDPOINT"], credential=cred)

    orch = CINAgentOrchestrator(client, model=os.getenv("CIN_MODEL", "gpt-4"))

    result = orch.process(
        trace_id=os.getenv("TRACE_ID", "trace-001"),
        message=os.getenv("TEST_MESSAGE", "J'ai été double facturé"),
        fan_id=os.getenv("TEST_FAN_ID", "fan123"),
        lang=os.getenv("TEST_LANG", "fr"),
    )

    print("=== Résultat CIN Pipeline ===")
    pprint(result)


if __name__ == "__main__":
    main()

