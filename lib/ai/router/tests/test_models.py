"""
Property-based tests for AI Router data models.

Uses Hypothesis for property-based testing to verify correctness properties.
"""

import os
import pytest
from hypothesis import given, strategies as st, settings

# Add parent directory to path for imports
import sys
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import with absolute paths
from lib.ai.router.models import ClassificationResult
from lib.ai.router.config import RouterConfig


# =============================================================================
# Hypothesis Strategies (Generators)
# =============================================================================

classification_type = st.sampled_from(["math", "coding", "creative", "chat"])
complexity_level = st.sampled_from(["high", "low"])
language_code = st.sampled_from(["fr", "en", "other"])

classification_result = st.builds(
    ClassificationResult,
    type=classification_type,
    complexity=complexity_level,
    language=language_code,
)

# Strategy for arbitrary strings (for invalid values testing)
arbitrary_string = st.text(min_size=0, max_size=50)

# Strategy for environment-safe strings (no null bytes, no surrogates)
# Environment variables must be valid UTF-8, so we exclude surrogates
env_safe_string = st.text(
    alphabet=st.characters(
        blacklist_characters='\x00',
        blacklist_categories=('Cs',)  # Exclude surrogate characters
    ),
    min_size=0,
    max_size=100
)

env_safe_string_nonempty = st.text(
    alphabet=st.characters(
        blacklist_characters='\x00',
        blacklist_categories=('Cs',)  # Exclude surrogate characters
    ),
    min_size=1,
    max_size=100
)


# =============================================================================
# Property 1: Classification Result Round-Trip
# **Feature: ai-router-azure-us, Property 1: Classification Result Round-Trip**
# **Validates: Requirements 1.5**
# =============================================================================

@settings(max_examples=100)
@given(classification_result)
def test_classification_result_round_trip(result: ClassificationResult):
    """
    Property 1: Classification Result Round-Trip
    
    For any valid ClassificationResult object, serializing it to JSON and then
    deserializing that JSON SHALL produce an equivalent ClassificationResult object.
    
    **Feature: ai-router-azure-us, Property 1: Classification Result Round-Trip**
    **Validates: Requirements 1.5**
    """
    # Serialize to JSON
    json_data = result.to_json()
    
    # Deserialize from JSON
    reconstructed = ClassificationResult.from_json(json_data)
    
    # Verify equivalence
    assert reconstructed.type == result.type
    assert reconstructed.complexity == result.complexity
    assert reconstructed.language == result.language


# =============================================================================
# Property 7: Configuration Loading with Defaults
# **Feature: ai-router-azure-us, Property 7: Configuration Loading with Defaults**
# **Validates: Requirements 6.1, 6.2, 6.3**
# =============================================================================

# Strategy for optional environment variable values (no null bytes)
optional_env_value = st.one_of(st.none(), env_safe_string_nonempty)

@settings(max_examples=100)
@given(
    endpoint=env_safe_string,
    key=env_safe_string,
    deploy_deepseek=optional_env_value,
    deploy_llama=optional_env_value,
    deploy_mistral=optional_env_value,
    deploy_classifier=optional_env_value,
)
def test_config_loading_with_defaults(
    endpoint: str,
    key: str,
    deploy_deepseek,
    deploy_llama,
    deploy_mistral,
    deploy_classifier,
):
    """
    Property 7: Configuration Loading with Defaults
    
    For any set of environment variables (including missing ones), the RouterConfig
    SHALL load with valid values, using defaults for any missing deployment names.
    
    **Feature: ai-router-azure-us, Property 7: Configuration Loading with Defaults**
    **Validates: Requirements 6.1, 6.2, 6.3**
    """
    # Set up environment variables
    env_backup = {}
    env_vars = {
        "AZURE_AI_CHAT_ENDPOINT": endpoint,
        "AZURE_AI_CHAT_KEY": key,
        "DEPLOY_DEEPSEEK": deploy_deepseek,
        "DEPLOY_LLAMA": deploy_llama,
        "DEPLOY_MISTRAL": deploy_mistral,
        "DEPLOY_PHI_CLASSIFIER": deploy_classifier,
    }
    
    # Backup and set environment
    for var, value in env_vars.items():
        env_backup[var] = os.environ.get(var)
        if value is not None:
            os.environ[var] = value
        elif var in os.environ:
            del os.environ[var]
    
    try:
        # Load configuration
        config = RouterConfig.from_env()
        
        # Verify endpoint and key are loaded (may be empty)
        assert config.azure_endpoint == endpoint
        assert config.azure_key == key
        
        # Verify deployment names use defaults when not set
        expected_deepseek = deploy_deepseek if deploy_deepseek else "deepseek-r1-us"
        expected_llama = deploy_llama if deploy_llama else "llama33-70b-us"
        expected_mistral = deploy_mistral if deploy_mistral else "mistral-large-2411-us"
        expected_classifier = deploy_classifier if deploy_classifier else "phi4mini-classifier-us"
        
        assert config.deploy_deepseek == expected_deepseek
        assert config.deploy_llama == expected_llama
        assert config.deploy_mistral == expected_mistral
        assert config.deploy_classifier == expected_classifier
        
        # Verify all deployment names are non-empty strings
        assert isinstance(config.deploy_deepseek, str) and len(config.deploy_deepseek) > 0
        assert isinstance(config.deploy_llama, str) and len(config.deploy_llama) > 0
        assert isinstance(config.deploy_mistral, str) and len(config.deploy_mistral) > 0
        assert isinstance(config.deploy_classifier, str) and len(config.deploy_classifier) > 0
        
    finally:
        # Restore environment
        for var, value in env_backup.items():
            if value is not None:
                os.environ[var] = value
            elif var in os.environ:
                del os.environ[var]


# =============================================================================
# Additional Unit Tests for Edge Cases
# =============================================================================

class TestClassificationResultFromJson:
    """Unit tests for ClassificationResult.from_json edge cases."""
    
    def test_empty_dict_uses_defaults(self):
        """Empty dict should use all defaults."""
        result = ClassificationResult.from_json({})
        assert result.type == "chat"
        assert result.complexity == "low"
        assert result.language == "other"
    
    def test_invalid_type_uses_default(self):
        """Invalid type value should fall back to 'chat'."""
        result = ClassificationResult.from_json({"type": "invalid"})
        assert result.type == "chat"
    
    def test_invalid_complexity_uses_default(self):
        """Invalid complexity value should fall back to 'low'."""
        result = ClassificationResult.from_json({"complexity": "medium"})
        assert result.complexity == "low"
    
    def test_invalid_language_uses_default(self):
        """Invalid language value should fall back to 'other'."""
        result = ClassificationResult.from_json({"language": "de"})
        assert result.language == "other"
    
    def test_partial_data_fills_defaults(self):
        """Partial data should fill missing fields with defaults."""
        result = ClassificationResult.from_json({"type": "math"})
        assert result.type == "math"
        assert result.complexity == "low"
        assert result.language == "other"


class TestRouterConfigValidation:
    """Unit tests for RouterConfig validation."""
    
    def test_validate_raises_on_missing_endpoint(self):
        """Should raise RuntimeError when endpoint is empty."""
        config = RouterConfig(azure_endpoint="", azure_key="test-key")
        with pytest.raises(RuntimeError) as exc_info:
            config.validate()
        assert "AZURE_AI_CHAT_ENDPOINT" in str(exc_info.value)
    
    def test_validate_raises_on_missing_key(self):
        """Should raise RuntimeError when API key is empty."""
        config = RouterConfig(azure_endpoint="https://test.azure.com", azure_key="")
        with pytest.raises(RuntimeError) as exc_info:
            config.validate()
        assert "AZURE_AI_CHAT_KEY" in str(exc_info.value)
    
    def test_validate_passes_with_valid_config(self):
        """Should not raise when both endpoint and key are set."""
        config = RouterConfig(
            azure_endpoint="https://test.azure.com",
            azure_key="test-key"
        )
        # Should not raise
        config.validate()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
