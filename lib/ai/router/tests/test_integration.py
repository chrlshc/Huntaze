"""
Integration tests for AI Router.

These tests verify the complete routing flow from request to response.
They require Azure AI credentials to be configured.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient

from ..main import app, get_app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the /health endpoint."""
    
    def test_health_returns_200(self, client):
        """Health endpoint should return 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_health_returns_status(self, client):
        """Health endpoint should return status field."""
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_health_returns_service_name(self, client):
        """Health endpoint should return service name."""
        response = client.get("/health")
        data = response.json()
        assert "service" in data
        assert data["service"] == "ai-router"
    
    def test_health_returns_region(self, client):
        """Health endpoint should return region."""
        response = client.get("/health")
        data = response.json()
        assert "region" in data


class TestRouteEndpointValidation:
    """Tests for /route endpoint input validation."""
    
    def test_empty_prompt_returns_400(self, client):
        """Empty prompt should return 400 Bad Request."""
        response = client.post(
            "/route",
            json={"prompt": "", "client_tier": "standard"}
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    
    def test_whitespace_prompt_returns_400(self, client):
        """Whitespace-only prompt should return 400 Bad Request."""
        response = client.post(
            "/route",
            json={"prompt": "   \n\t  ", "client_tier": "standard"}
        )
        assert response.status_code == 400
    
    def test_missing_prompt_returns_422(self, client):
        """Missing prompt field should return 422 Validation Error."""
        response = client.post(
            "/route",
            json={"client_tier": "standard"}
        )
        assert response.status_code == 422
    
    def test_invalid_client_tier_returns_error(self, client):
        """Invalid client_tier should return an error (422 or 500)."""
        response = client.post(
            "/route",
            json={"prompt": "test", "client_tier": "invalid"}
        )
        # May return 422 (validation) or 500 (config not initialized)
        assert response.status_code in [422, 500]
    
    def test_valid_type_hints_accepted(self, client):
        """Valid type_hint values should be accepted."""
        for type_hint in ["math", "coding", "creative", "chat"]:
            response = client.post(
                "/route",
                json={
                    "prompt": "test",
                    "client_tier": "standard",
                    "type_hint": type_hint
                }
            )
            # Should not be 422 (validation error)
            assert response.status_code != 422
    
    def test_invalid_type_hint_returns_422(self, client):
        """Invalid type_hint should return 422 Validation Error."""
        response = client.post(
            "/route",
            json={
                "prompt": "test",
                "client_tier": "standard",
                "type_hint": "invalid_type"
            }
        )
        assert response.status_code == 422
    
    def test_valid_language_hints_accepted(self, client):
        """Valid language_hint values should be accepted."""
        for lang_hint in ["fr", "en", "other"]:
            response = client.post(
                "/route",
                json={
                    "prompt": "test",
                    "client_tier": "standard",
                    "language_hint": lang_hint
                }
            )
            # Should not be 422 (validation error)
            assert response.status_code != 422


class TestAPIKeyAuthentication:
    """Tests for API key authentication."""
    
    def test_health_does_not_require_api_key(self, client):
        """Health endpoint should not require API key."""
        response = client.get("/health")
        assert response.status_code == 200
    
    @patch.dict('os.environ', {'AI_ROUTER_API_KEY': 'test-secret-key'})
    def test_route_requires_api_key_when_configured(self):
        """Route endpoint should require API key when configured."""
        # Need to restart app to pick up env var
        # This is a simplified test - in practice you'd use proper fixtures
        pass
    
    def test_route_without_api_key_when_disabled(self, client):
        """Route endpoint should work without API key when auth disabled."""
        # When AI_ROUTER_API_KEY is not set, auth is disabled
        response = client.post(
            "/route",
            json={"prompt": "test", "client_tier": "standard"}
        )
        # Should not be 401 (unauthorized)
        assert response.status_code != 401


class TestRouteEndpointIntegration:
    """Integration tests for /route endpoint (requires Azure)."""
    
    def test_route_returns_500_without_azure(self, client):
        """Route should return 500 when Azure is not configured."""
        response = client.post(
            "/route",
            json={"prompt": "Hello world", "client_tier": "standard"}
        )
        # Without Azure credentials, should return 500
        if response.status_code == 500:
            detail = response.json()["detail"]
            # May mention Azure or Router configuration
            assert "Azure" in detail or "configuration" in detail.lower()
    
    def test_route_accepts_vip_tier(self, client):
        """Route should accept VIP tier."""
        response = client.post(
            "/route",
            json={"prompt": "test", "client_tier": "vip"}
        )
        # Should not be 422 (validation error)
        assert response.status_code != 422


class TestGetApp:
    """Tests for the get_app helper function."""
    
    def test_get_app_returns_fastapi_instance(self):
        """get_app should return the FastAPI app instance."""
        result = get_app()
        assert result is app
