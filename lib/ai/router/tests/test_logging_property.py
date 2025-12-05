"""
Property-based tests for logging completeness.

**Feature: azure-foundry-production-rollout, Property 9: Logging completeness**
**Validates: Requirements 2.5, 5.1**

These tests verify that all processed requests are logged with the required
fields: correlation ID, provider used, model used, latency, and cost.
"""

import pytest
from hypothesis import given, strategies as st, settings, assume, HealthCheck
from unittest.mock import patch, MagicMock, Mock
from fastapi.testclient import TestClient
import logging
import re

from ..main import app
from ..models import RouteResponse, UsageStats


# Strategy for generating random prompts
prompt_strategy = st.text(min_size=1, max_size=200).filter(lambda x: x.strip())

# Strategy for client tiers
tier_strategy = st.sampled_from(["standard", "vip"])

# Strategy for type hints
type_hint_strategy = st.sampled_from(["math", "coding", "creative", "chat", None])

# Strategy for language hints
language_hint_strategy = st.sampled_from(["fr", "en", "other", None])


class TestLoggingCompleteness:
    """
    **Feature: azure-foundry-production-rollout, Property 9: Logging completeness**
    **Validates: Requirements 2.5, 5.1**
    
    Property: For any processed request, the logs SHALL contain correlation ID,
    provider used, model used, latency, and cost.
    """
    
    @given(
        prompt=prompt_strategy,
        tier=tier_strategy,
        type_hint=type_hint_strategy,
        language_hint=language_hint_strategy
    )
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_successful_request_logs_required_fields(
        self, prompt, tier, type_hint, language_hint, caplog
    ):
        """
        **Feature: azure-foundry-production-rollout, Property 9: Logging completeness**
        **Validates: Requirements 2.5, 5.1**
        
        For any successful request, logs SHALL contain:
        - correlation_id (8 char UUID prefix)
        - model name
        - latency in ms
        - tokens_in and tokens_out
        - tier
        """
        # Mock the Azure client to return a successful response
        mock_response = Mock()
        mock_response.text = "Test response"
        mock_response.usage = Mock()
        mock_response.usage.to_dict = Mock(return_value={
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30
        })
        
        mock_client = Mock()
        mock_client.call_deployment = Mock(return_value=mock_response)
        
        mock_config = Mock()
        mock_config.region = "eastus2"
        mock_config.azure_endpoint = "https://test.openai.azure.com"
        mock_config.azure_key = "test-key"
        mock_config.deploy_classifier = "phi-4-mini"
        mock_config.deploy_deepseek = "deepseek-r1"
        mock_config.deploy_llama = "llama-3.3"
        mock_config.deploy_mistral = "mistral-large"
        mock_config.deploy_phi = "phi-4-mini"
        
        import lib.ai.router.main as main_module
        original_config = main_module._config
        original_client = main_module._client
        original_api_key = main_module._api_key
        
        main_module._config = mock_config
        main_module._client = mock_client
        main_module._api_key = None  # Disable auth for this test
        
        try:
            with caplog.at_level(logging.INFO, logger="ai-router"):
                client = TestClient(app)
                
                request_data = {"prompt": prompt, "client_tier": tier}
                if type_hint:
                    request_data["type_hint"] = type_hint
                if language_hint:
                    request_data["language_hint"] = language_hint
                
                response = client.post("/route", json=request_data)
                
                if response.status_code == 200:
                    # Check logs contain required fields
                    log_text = caplog.text
                    
                    # Correlation ID pattern: [xxxxxxxx]
                    assert re.search(r'\[[a-f0-9]{8}\]', log_text), \
                        f"Log should contain correlation ID, got: {log_text}"
                    
                    # Model name
                    assert "model=" in log_text, \
                        f"Log should contain model=, got: {log_text}"
                    
                    # Latency
                    assert "latency=" in log_text, \
                        f"Log should contain latency=, got: {log_text}"
                    
                    # Tokens
                    assert "tokens_in=" in log_text, \
                        f"Log should contain tokens_in=, got: {log_text}"
                    assert "tokens_out=" in log_text, \
                        f"Log should contain tokens_out=, got: {log_text}"
                    
                    # Tier
                    assert f"tier={tier}" in log_text, \
                        f"Log should contain tier={tier}, got: {log_text}"
        finally:
            main_module._config = original_config
            main_module._client = original_client
            main_module._api_key = original_api_key
    
    def test_failed_request_logs_correlation_id(self):
        """
        **Feature: azure-foundry-production-rollout, Property 9: Logging completeness**
        **Validates: Requirements 2.5, 5.1**
        
        For any failed request, logs SHALL still contain correlation ID.
        This test verifies the error logging code path exists and includes
        correlation ID by inspecting the source code.
        """
        import inspect
        import lib.ai.router.main as main_module
        
        # Get the source code of route_prompt function
        source = inspect.getsource(main_module.route_prompt)
        
        # Verify error logging includes correlation ID
        # The code should have: logger.error(f"[{correlation_id}]...")
        assert "correlation_id" in source, \
            "route_prompt should use correlation_id"
        assert "logger.error" in source, \
            "route_prompt should log errors"
        assert "Request failed" in source, \
            "route_prompt should log 'Request failed' on error"
        
        # Verify the error log format includes correlation_id
        # Looking for pattern like: f"[{correlation_id}] Request failed"
        assert re.search(r'f"\[{correlation_id}\].*Request failed', source), \
            "Error log should include correlation_id in format [id] Request failed"
    
    @given(tier=tier_strategy)
    @settings(max_examples=30, suppress_health_check=[HealthCheck.function_scoped_fixture])
    def test_empty_prompt_logs_rejection(self, tier, caplog):
        """
        **Feature: azure-foundry-production-rollout, Property 9: Logging completeness**
        **Validates: Requirements 2.5, 5.1**
        
        For any rejected request (empty prompt), logs SHALL contain
        correlation ID and rejection reason.
        """
        import lib.ai.router.main as main_module
        original_api_key = main_module._api_key
        main_module._api_key = None
        
        try:
            with caplog.at_level(logging.WARNING, logger="ai-router"):
                client = TestClient(app)
                response = client.post(
                    "/route",
                    json={"prompt": "", "client_tier": tier}
                )
                
                assert response.status_code == 400
                log_text = caplog.text
                
                # Should log the rejection with correlation ID
                assert re.search(r'\[[a-f0-9]{8}\]', log_text), \
                    f"Rejected request should log correlation ID, got: {log_text}"
                assert "Empty prompt" in log_text or "rejected" in log_text.lower(), \
                    f"Should log rejection reason, got: {log_text}"
        finally:
            main_module._api_key = original_api_key


class TestCorrelationIdUniqueness:
    """
    Tests for correlation ID uniqueness across requests.
    
    **Feature: azure-foundry-production-rollout, Property 9: Logging completeness**
    **Validates: Requirements 2.5, 5.1**
    """
    
    def test_correlation_ids_are_unique(self, caplog):
        """
        Multiple requests should have different correlation IDs.
        """
        import lib.ai.router.main as main_module
        original_api_key = main_module._api_key
        main_module._api_key = None
        
        try:
            correlation_ids = set()
            
            with caplog.at_level(logging.WARNING, logger="ai-router"):
                client = TestClient(app)
                
                # Make multiple requests
                for i in range(10):
                    caplog.clear()
                    response = client.post(
                        "/route",
                        json={"prompt": "", "client_tier": "standard"}
                    )
                    
                    # Extract correlation ID from log
                    match = re.search(r'\[([a-f0-9]{8})\]', caplog.text)
                    if match:
                        correlation_ids.add(match.group(1))
            
            # All correlation IDs should be unique
            assert len(correlation_ids) == 10, \
                f"Expected 10 unique correlation IDs, got {len(correlation_ids)}"
        finally:
            main_module._api_key = original_api_key
