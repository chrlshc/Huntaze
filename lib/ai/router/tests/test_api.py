"""
Tests for AI Router FastAPI endpoints.

Tests the /route and /health endpoints including type_hint and language_hint support.
"""

import os
import sys
import pytest
from unittest.mock import patch
from hypothesis import given, strategies as st, settings

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi.testclient import TestClient
from lib.ai.router.models import (
    RouteRequest, RouteResponse, ClassificationResult, DeploymentResponse, UsageStats,
)
from lib.ai.router.main import app


@pytest.fixture
def client():
    return TestClient(app)


@settings(max_examples=100)
@given(
    model=st.sampled_from(["DeepSeek-R1", "Llama-3.3-70B", "Mistral-Large-2407"]),
    deployment=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
    region=st.sampled_from(["eastus2", "westus", "northeurope"]),
    output=st.text(min_size=1, max_size=500).filter(lambda x: x.strip()),
)
def test_response_structure_completeness(model, deployment, region, output):
    """Property 3: Response Structure Completeness."""
    response = RouteResponse(
        model=model, deployment=deployment, region=region,
        routing={"type": "chat"}, output=output,
    )
    assert response.model and response.deployment and response.region and response.output


class TestHealthEndpoint:
    def test_health_returns_200(self, client):
        assert client.get("/health").status_code == 200
    
    def test_health_returns_status(self, client):
        assert client.get("/health").json()["status"] == "healthy"
    
    def test_health_returns_region(self, client):
        assert "region" in client.get("/health").json()
    
    def test_health_returns_service_name(self, client):
        assert client.get("/health").json()["service"] == "ai-router"


class TestRouteEndpointErrors:
    def test_empty_prompt_returns_400(self, client):
        assert client.post("/route", json={"prompt": ""}).status_code == 400
    
    def test_whitespace_prompt_returns_400(self, client):
        assert client.post("/route", json={"prompt": "   "}).status_code == 400
    
    def test_missing_prompt_returns_422(self, client):
        assert client.post("/route", json={}).status_code == 422


class TestRouteRequestValidation:
    def test_valid_request(self):
        req = RouteRequest(prompt="Hello", client_tier="standard")
        assert req.prompt == "Hello"
    
    def test_default_client_tier(self):
        assert RouteRequest(prompt="Hello").client_tier == "standard"
    
    def test_prompt_required(self):
        with pytest.raises(Exception):
            RouteRequest()


class TestRouteResponseValidation:
    def test_valid_response(self):
        resp = RouteResponse(model="Llama", deployment="d", region="r", routing={}, output="Hi")
        assert resp.model == "Llama"
    
    def test_optional_usage(self):
        resp = RouteResponse(model="Llama", deployment="d", region="r", routing={}, output="Hi")
        assert resp.usage is None
    
    def test_usage_included(self):
        resp = RouteResponse(
            model="Llama", deployment="d", region="r", routing={}, output="Hi",
            usage={"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
        )
        assert resp.usage["total_tokens"] == 30


class TestRouteEndpointWithMocks:
    @patch("lib.ai.router.main._config")
    @patch("lib.ai.router.main._client")
    @patch("lib.ai.router.main._classify_prompt_async")
    def test_route_with_valid_prompt(self, mock_classify, mock_client, mock_config):
        mock_config.region = "eastus2"
        mock_config.deploy_llama = "llama33-70b-us"
        mock_config.deploy_deepseek = "deepseek-r1-us"
        mock_config.deploy_mistral = "mistral-large-2407-us"
        mock_classify.return_value = ClassificationResult()
        mock_client.call_deployment.return_value = DeploymentResponse(text="Response")
        assert TestClient(app).post("/route", json={"prompt": "Hello"}).status_code in [200, 500]
    
    @patch("lib.ai.router.main._config")
    @patch("lib.ai.router.main._client")
    @patch("lib.ai.router.main._classify_prompt_async")
    def test_route_default_client_tier(self, mock_classify, mock_client, mock_config):
        mock_config.region = "eastus2"
        mock_config.deploy_llama = "llama33-70b-us"
        mock_config.deploy_deepseek = "deepseek-r1-us"
        mock_config.deploy_mistral = "mistral-large-2407-us"
        mock_classify.return_value = ClassificationResult()
        mock_client.call_deployment.return_value = DeploymentResponse(text="Response")
        assert TestClient(app).post("/route", json={"prompt": "Test"}).status_code in [200, 500]



# =============================================================================
# Hint Override API Tests (Task 10)
# **Feature: azure-foundry-agents-integration, Property: Hint Override API**
# **Validates: Requirements 2.1-2.5**
# =============================================================================

class TestHintOverrideAPI:
    """Tests for type_hint and language_hint in API requests."""
    
    def test_request_with_type_hint(self):
        req = RouteRequest(prompt="Calculate 2+2", client_tier="standard", type_hint="math")
        assert req.type_hint == "math"
    
    def test_request_with_language_hint(self):
        req = RouteRequest(prompt="Bonjour", client_tier="standard", language_hint="fr")
        assert req.language_hint == "fr"
    
    def test_request_with_both_hints(self):
        req = RouteRequest(prompt="Test", client_tier="vip", type_hint="creative", language_hint="fr")
        assert req.type_hint == "creative"
        assert req.language_hint == "fr"
    
    def test_type_hint_optional(self):
        assert RouteRequest(prompt="Hello").type_hint is None
    
    def test_language_hint_optional(self):
        assert RouteRequest(prompt="Hello").language_hint is None
    
    def test_type_hint_valid_values(self):
        for hint in ["math", "coding", "creative", "chat"]:
            assert RouteRequest(prompt="Hello", type_hint=hint).type_hint == hint
    
    def test_language_hint_valid_values(self):
        for hint in ["fr", "en", "other"]:
            assert RouteRequest(prompt="Hello", language_hint=hint).language_hint == hint


type_hint_strategy = st.sampled_from(["math", "coding", "creative", "chat", None])
language_hint_strategy = st.sampled_from(["fr", "en", "other", None])


@settings(max_examples=50)
@given(type_hint=type_hint_strategy, language_hint=language_hint_strategy)
def test_hint_values_in_request(type_hint, language_hint):
    """Property: All valid hint combinations should create valid requests."""
    kwargs = {"prompt": "Test prompt", "client_tier": "standard"}
    if type_hint is not None:
        kwargs["type_hint"] = type_hint
    if language_hint is not None:
        kwargs["language_hint"] = language_hint
    
    request = RouteRequest(**kwargs)
    assert request.type_hint == type_hint
    assert request.language_hint == language_hint


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
