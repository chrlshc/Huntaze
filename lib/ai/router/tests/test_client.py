"""
Property-based tests for Azure AI client factory.

Uses Hypothesis for property-based testing to verify correctness properties.
"""

import os
import sys
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import with absolute paths after path modification
from lib.ai.router.client import AzureClientFactory
from lib.ai.router.config import RouterConfig
from lib.ai.router.models import DeploymentResponse, UsageStats


# =============================================================================
# Hypothesis Strategies (Generators)
# =============================================================================

# Strategy for deployment names (alphanumeric with dashes)
deployment_name = st.text(
    alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd'), whitelist_characters='-_'),
    min_size=1,
    max_size=50
).filter(lambda x: len(x.strip()) > 0)

# Strategy for prompts
prompt_text = st.text(min_size=1, max_size=500)

# Strategy for valid endpoint URLs
endpoint_url = st.sampled_from([
    "https://huntaze-ai.eastus2.inference.ml.azure.com",
    "https://test-endpoint.azure.com",
    "https://my-ai-service.inference.azure.com/v1",
])

# Strategy for API keys
api_key = st.text(
    alphabet=st.characters(whitelist_categories=('Ll', 'Lu', 'Nd')),
    min_size=10,
    max_size=64
)


# =============================================================================
# Property 5: Azure Header Inclusion
# **Feature: ai-router-azure-us, Property 5: Azure Header Inclusion**
# **Validates: Requirements 3.1, 3.2**
# =============================================================================

@settings(max_examples=100)
@given(deployment_name=deployment_name)
def test_azure_header_inclusion(deployment_name: str):
    """
    Property 5: Azure Header Inclusion
    
    For any deployment call, the HTTP request SHALL include the 
    azureml-model-deployment header with the correct deployment name.
    
    **Feature: ai-router-azure-us, Property 5: Azure Header Inclusion**
    **Validates: Requirements 3.1, 3.2**
    """
    # Create config with valid endpoint and key
    config = RouterConfig(
        azure_endpoint="https://test.azure.com",
        azure_key="test-api-key-12345"
    )
    
    # Create client factory
    factory = AzureClientFactory(config)
    
    # Build headers for the deployment
    headers = factory._build_headers(deployment_name)
    
    # Verify the azureml-model-deployment header is present and correct
    assert "azureml-model-deployment" in headers
    assert headers["azureml-model-deployment"] == deployment_name


@settings(max_examples=50)
@given(
    deployment=deployment_name,
    system_prompt=prompt_text,
    user_prompt=prompt_text,
)
def test_request_body_structure(deployment: str, system_prompt: str, user_prompt: str):
    """
    Test that request body is correctly structured for any prompts.
    
    **Feature: ai-router-azure-us, Property 5: Azure Header Inclusion**
    **Validates: Requirements 3.1, 3.2**
    """
    config = RouterConfig(
        azure_endpoint="https://test.azure.com",
        azure_key="test-api-key-12345"
    )
    
    factory = AzureClientFactory(config)
    
    # Build request body
    body = factory._build_request_body(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )
    
    # Verify structure
    assert "messages" in body
    assert len(body["messages"]) == 2
    assert body["messages"][0]["role"] == "system"
    assert body["messages"][0]["content"] == system_prompt
    assert body["messages"][1]["role"] == "user"
    assert body["messages"][1]["content"] == user_prompt
    assert "max_tokens" in body
    assert "temperature" in body


# =============================================================================
# Unit Tests for Response Extraction (Task 3.3)
# =============================================================================

class TestResponseExtraction:
    """Unit tests for response extraction from Azure API responses."""
    
    def test_extract_text_from_valid_response(self):
        """Should extract text content from valid response."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        response_data = {
            "choices": [
                {
                    "message": {
                        "content": "Hello, world!"
                    }
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15
            }
        }
        
        result = factory._extract_response(response_data)
        
        assert result.text == "Hello, world!"
        assert result.usage is not None
        assert result.usage.prompt_tokens == 10
        assert result.usage.completion_tokens == 5
        assert result.usage.total_tokens == 15
    
    def test_extract_empty_text_from_empty_choices(self):
        """Should return empty text when choices is empty."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        response_data = {"choices": []}
        
        result = factory._extract_response(response_data)
        
        assert result.text == ""
        assert result.usage is None
    
    def test_extract_handles_missing_usage(self):
        """Should handle missing usage statistics."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        response_data = {
            "choices": [
                {"message": {"content": "Test response"}}
            ]
        }
        
        result = factory._extract_response(response_data)
        
        assert result.text == "Test response"
        assert result.usage is None
    
    def test_extract_handles_missing_content(self):
        """Should handle missing content in message."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        response_data = {
            "choices": [
                {"message": {}}
            ]
        }
        
        result = factory._extract_response(response_data)
        
        assert result.text == ""
    
    def test_raw_response_preserved(self):
        """Should preserve raw response data."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        response_data = {
            "id": "test-id",
            "model": "test-model",
            "choices": [{"message": {"content": "Test"}}],
            "custom_field": "custom_value"
        }
        
        result = factory._extract_response(response_data)
        
        assert result.raw == response_data
        assert result.raw["id"] == "test-id"
        assert result.raw["custom_field"] == "custom_value"


class TestClientFactoryInitialization:
    """Unit tests for AzureClientFactory initialization."""
    
    def test_raises_on_missing_endpoint(self):
        """Should raise RuntimeError when endpoint is missing."""
        config = RouterConfig(
            azure_endpoint="",
            azure_key="test-key"
        )
        
        with pytest.raises(RuntimeError) as exc_info:
            AzureClientFactory(config)
        
        assert "AZURE_AI_CHAT_ENDPOINT" in str(exc_info.value)
    
    def test_raises_on_missing_key(self):
        """Should raise RuntimeError when API key is missing."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key=""
        )
        
        with pytest.raises(RuntimeError) as exc_info:
            AzureClientFactory(config)
        
        assert "AZURE_AI_CHAT_KEY" in str(exc_info.value)
    
    def test_successful_initialization(self):
        """Should initialize successfully with valid config."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        
        factory = AzureClientFactory(config)
        
        assert factory.config == config


class TestBuildHeaders:
    """Unit tests for header building."""
    
    def test_includes_deployment_header(self):
        """Should include azureml-model-deployment header."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        headers = factory._build_headers("my-deployment")
        
        assert headers["azureml-model-deployment"] == "my-deployment"
    
    def test_different_deployments_different_headers(self):
        """Different deployments should produce different headers."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        headers1 = factory._build_headers("deployment-a")
        headers2 = factory._build_headers("deployment-b")
        
        assert headers1["azureml-model-deployment"] != headers2["azureml-model-deployment"]


class TestBuildRequestBody:
    """Unit tests for request body building."""
    
    def test_default_parameters(self):
        """Should use default max_tokens and temperature."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        body = factory._build_request_body("System", "User")
        
        assert body["max_tokens"] == 2048
        assert body["temperature"] == 0.7
    
    def test_custom_parameters(self):
        """Should use custom max_tokens and temperature."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        body = factory._build_request_body(
            "System",
            "User",
            max_tokens=1000,
            temperature=0.5
        )
        
        assert body["max_tokens"] == 1000
        assert body["temperature"] == 0.5
    
    def test_messages_structure(self):
        """Should create correct messages structure."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        factory = AzureClientFactory(config)
        
        body = factory._build_request_body("Be helpful", "Hello!")
        
        messages = body["messages"]
        assert len(messages) == 2
        assert messages[0] == {"role": "system", "content": "Be helpful"}
        assert messages[1] == {"role": "user", "content": "Hello!"}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
