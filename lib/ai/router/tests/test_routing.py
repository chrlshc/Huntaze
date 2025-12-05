"""
Property-based tests for AI Router routing engine.

Uses Hypothesis for property-based testing to verify routing rules consistency.
"""

import os
import sys
import pytest
from hypothesis import given, strategies as st, settings, assume

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from lib.ai.router.models import ClassificationResult
from lib.ai.router.config import RouterConfig
from lib.ai.router.routing import select_deployment, get_deployment_for_model


# =============================================================================
# Hypothesis Strategies (Generators)
# =============================================================================

classification_type = st.sampled_from(["math", "coding", "creative", "chat"])
complexity_level = st.sampled_from(["high", "low"])
language_code = st.sampled_from(["fr", "en", "other"])
client_tier = st.sampled_from(["standard", "vip"])

classification_result = st.builds(
    ClassificationResult,
    type=classification_type,
    complexity=complexity_level,
    language=language_code,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def test_config() -> RouterConfig:
    """Create a test configuration with known deployment names."""
    return RouterConfig(
        azure_endpoint="https://test.azure.com",
        azure_key="test-key",
        deploy_deepseek="deepseek-r1-us",
        deploy_llama="llama33-70b-us",
        deploy_mistral="mistral-large-2411-us",
        deploy_classifier="phi4mini-classifier-us",
    )


# =============================================================================
# Property 4: Routing Rules Consistency
# **Feature: ai-router-azure-us, Property 4: Routing Rules Consistency**
# **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
# =============================================================================

@settings(max_examples=100)
@given(classification=classification_result, tier=client_tier)
def test_routing_rules_consistency(classification: ClassificationResult, tier: str):
    """
    Property 4: Routing Rules Consistency
    
    For any ClassificationResult and client_tier combination, the routing engine
    SHALL return exactly one deployment name, and that deployment SHALL match
    the highest-priority applicable rule:
    - Rule 1: math/coding + high complexity → DeepSeek-R1
    - Rule 2: creative OR vip tier → Llama 3.3 70B
    - Rule 3: chat type → Llama 3.3 70B
    - Rule 4: fr language (no higher rule) → Mistral Large 2407
    - Rule 5: fallback → Llama 3.3 70B
    
    **Feature: ai-router-azure-us, Property 4: Routing Rules Consistency**
    **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    """
    config = RouterConfig(
        azure_endpoint="https://test.azure.com",
        azure_key="test-key",
        deploy_deepseek="deepseek-r1-us",
        deploy_llama="llama33-70b-us",
        deploy_mistral="mistral-large-2411-us",
        deploy_classifier="phi4mini-classifier-us",
    )
    
    # Call the routing function
    model_name, deployment = select_deployment(classification, tier, config)
    
    # Verify exactly one result is returned
    assert model_name is not None
    assert deployment is not None
    assert isinstance(model_name, str)
    assert isinstance(deployment, str)
    
    # Determine expected deployment based on priority rules
    expected_model = None
    expected_deployment = None
    
    # Rule 1: Math/coding with high complexity → DeepSeek-R1
    if classification.type in ("math", "coding") and classification.complexity == "high":
        expected_model = "DeepSeek-R1"
        expected_deployment = config.deploy_deepseek
    # Rule 2: Creative type OR VIP tier → Llama 3.3 70B
    elif classification.type == "creative" or tier == "vip":
        expected_model = "Llama-3.3-70B"
        expected_deployment = config.deploy_llama
    # Rule 3: Chat type → Llama 3.3 70B
    elif classification.type == "chat":
        expected_model = "Llama-3.3-70B"
        expected_deployment = config.deploy_llama
    # Rule 4: French language → Mistral Large 2407
    elif classification.language == "fr":
        expected_model = "Mistral-Large-2411"
        expected_deployment = config.deploy_mistral
    # Rule 5: Fallback → Llama 3.3 70B
    else:
        expected_model = "Llama-3.3-70B"
        expected_deployment = config.deploy_llama
    
    # Verify the routing matches expected
    assert model_name == expected_model, (
        f"Expected model {expected_model} but got {model_name} "
        f"for classification={classification}, tier={tier}"
    )
    assert deployment == expected_deployment, (
        f"Expected deployment {expected_deployment} but got {deployment} "
        f"for classification={classification}, tier={tier}"
    )


# =============================================================================
# Unit Tests for Specific Routing Rules
# =============================================================================

class TestRoutingRulesMathCoding:
    """Unit tests for Rule 1: Math/coding with high complexity → DeepSeek-R1."""
    
    def test_math_high_complexity_routes_to_deepseek(self, test_config):
        """Math + high complexity should route to DeepSeek-R1."""
        classification = ClassificationResult(type="math", complexity="high", language="en")
        model, deployment = select_deployment(classification, "standard", test_config)
        assert model == "DeepSeek-R1"
        assert deployment == test_config.deploy_deepseek
    
    def test_coding_high_complexity_routes_to_deepseek(self, test_config):
        """Coding + high complexity should route to DeepSeek-R1."""
        classification = ClassificationResult(type="coding", complexity="high", language="en")
        model, deployment = select_deployment(classification, "standard", test_config)
        assert model == "DeepSeek-R1"
        assert deployment == test_config.deploy_deepseek
    
    def test_math_low_complexity_does_not_route_to_deepseek(self, test_config):
        """Math + low complexity should NOT route to DeepSeek-R1."""
        classification = ClassificationResult(type="math", complexity="low", language="en")
        model, deployment = select_deployment(classification, "standard", test_config)
        # Should fall through to other rules (not DeepSeek)
        assert model != "DeepSeek-R1"


class TestRoutingRulesCreativeVip:
    """Unit tests for Rule 2: Creative type OR VIP tier → Llama 3.3 70B."""
    
    def test_creative_routes_to_llama(self, test_config):
        """Creative type should route to Llama."""
        classification = ClassificationResult(type="creative", complexity="low", language="en")
        model, deployment = select_deployment(classification, "standard", test_config)
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_vip_tier_routes_to_llama(self, test_config):
        """VIP tier should route to Llama regardless of type."""
        classification = ClassificationResult(type="math", complexity="low", language="en")
        model, deployment = select_deployment(classification, "vip", test_config)
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_vip_with_high_complexity_math_routes_to_deepseek(self, test_config):
        """VIP + math + high complexity should still route to DeepSeek (Rule 1 priority)."""
        classification = ClassificationResult(type="math", complexity="high", language="en")
        model, deployment = select_deployment(classification, "vip", test_config)
        # Rule 1 has higher priority than Rule 2
        assert model == "DeepSeek-R1"
        assert deployment == test_config.deploy_deepseek


class TestRoutingRulesChat:
    """Unit tests for Rule 3: Chat type → Llama 3.3 70B."""
    
    def test_chat_routes_to_llama(self, test_config):
        """Chat type should route to Llama."""
        classification = ClassificationResult(type="chat", complexity="low", language="en")
        model, deployment = select_deployment(classification, "standard", test_config)
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_chat_french_routes_to_llama_not_mistral(self, test_config):
        """Chat + French should route to Llama (Rule 3 before Rule 4)."""
        classification = ClassificationResult(type="chat", complexity="low", language="fr")
        model, deployment = select_deployment(classification, "standard", test_config)
        # Rule 3 has higher priority than Rule 4
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama


class TestRoutingRulesFrench:
    """Unit tests for Rule 4: French language → Mistral Large 2407."""
    
    def test_french_math_low_routes_to_mistral(self, test_config):
        """French + math + low complexity should route to Mistral."""
        classification = ClassificationResult(type="math", complexity="low", language="fr")
        model, deployment = select_deployment(classification, "standard", test_config)
        # Not Rule 1 (low complexity), not Rule 2 (not creative/vip), not Rule 3 (not chat)
        # → Rule 4 applies
        assert model == "Mistral-Large-2411"
        assert deployment == test_config.deploy_mistral
    
    def test_french_coding_low_routes_to_mistral(self, test_config):
        """French + coding + low complexity should route to Mistral."""
        classification = ClassificationResult(type="coding", complexity="low", language="fr")
        model, deployment = select_deployment(classification, "standard", test_config)
        assert model == "Mistral-Large-2411"
        assert deployment == test_config.deploy_mistral


class TestRoutingRulesFallback:
    """Unit tests for Rule 5: Fallback → Llama 3.3 70B."""
    
    def test_english_math_low_routes_to_llama_fallback(self, test_config):
        """English + math + low complexity should fallback to Llama."""
        classification = ClassificationResult(type="math", complexity="low", language="en")
        model, deployment = select_deployment(classification, "standard", test_config)
        # Not Rule 1-4, so fallback
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_other_language_coding_low_routes_to_llama_fallback(self, test_config):
        """Other language + coding + low complexity should fallback to Llama."""
        classification = ClassificationResult(type="coding", complexity="low", language="other")
        model, deployment = select_deployment(classification, "standard", test_config)
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama


class TestGetDeploymentForModel:
    """Unit tests for get_deployment_for_model helper function."""
    
    def test_deepseek_model_returns_correct_deployment(self, test_config):
        """DeepSeek-R1 should return deepseek deployment."""
        deployment = get_deployment_for_model("DeepSeek-R1", test_config)
        assert deployment == test_config.deploy_deepseek
    
    def test_llama_model_returns_correct_deployment(self, test_config):
        """Llama-3.3-70B should return llama deployment."""
        deployment = get_deployment_for_model("Llama-3.3-70B", test_config)
        assert deployment == test_config.deploy_llama
    
    def test_mistral_model_returns_correct_deployment(self, test_config):
        """Mistral-Large-2411 should return mistral deployment."""
        deployment = get_deployment_for_model("Mistral-Large-2411", test_config)
        assert deployment == test_config.deploy_mistral
    
    def test_phi_model_returns_correct_deployment(self, test_config):
        """Phi-4-mini should return classifier deployment."""
        deployment = get_deployment_for_model("Phi-4-mini", test_config)
        assert deployment == test_config.deploy_classifier
    
    def test_unknown_model_returns_llama_fallback(self, test_config):
        """Unknown model should fallback to llama deployment."""
        deployment = get_deployment_for_model("Unknown-Model", test_config)
        assert deployment == test_config.deploy_llama


# =============================================================================
# Tests for Hint Override Logic (Task 10)
# **Feature: azure-foundry-agents-integration, Property: Hint Override**
# **Validates: Requirements 2.1-2.5**
# =============================================================================

from lib.ai.router.routing import apply_hints

type_hint_strategy = st.sampled_from(["math", "coding", "creative", "chat", None])
language_hint_strategy = st.sampled_from(["fr", "en", "other", None])


class TestApplyHints:
    """Unit tests for apply_hints function."""
    
    def test_no_hints_preserves_classification(self, test_config):
        """When no hints provided, classification should be unchanged."""
        classification = ClassificationResult(type="math", complexity="high", language="fr")
        result = apply_hints(classification, type_hint=None, language_hint=None)
        assert result.type == "math"
        assert result.complexity == "high"
        assert result.language == "fr"
    
    def test_type_hint_overrides_type(self, test_config):
        """type_hint should override classifier type."""
        classification = ClassificationResult(type="math", complexity="high", language="en")
        result = apply_hints(classification, type_hint="creative", language_hint=None)
        assert result.type == "creative"
        assert result.complexity == "high"  # Unchanged
        assert result.language == "en"  # Unchanged
    
    def test_language_hint_overrides_language(self, test_config):
        """language_hint should override classifier language."""
        classification = ClassificationResult(type="chat", complexity="low", language="en")
        result = apply_hints(classification, type_hint=None, language_hint="fr")
        assert result.type == "chat"  # Unchanged
        assert result.complexity == "low"  # Unchanged
        assert result.language == "fr"
    
    def test_both_hints_override_both(self, test_config):
        """Both hints should override both type and language."""
        classification = ClassificationResult(type="math", complexity="high", language="en")
        result = apply_hints(classification, type_hint="chat", language_hint="fr")
        assert result.type == "chat"
        assert result.complexity == "high"  # Unchanged
        assert result.language == "fr"


class TestSelectDeploymentWithHints:
    """Unit tests for select_deployment with type_hint and language_hint."""
    
    def test_type_hint_chat_routes_to_llama(self, test_config):
        """type_hint='chat' should route to Llama regardless of classifier."""
        # Classifier says math/high, but hint says chat
        classification = ClassificationResult(type="math", complexity="high", language="en")
        model, deployment = select_deployment(
            classification, "standard", test_config,
            type_hint="chat", language_hint=None
        )
        # type_hint overrides to chat, so Rule 3 applies
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_type_hint_creative_routes_to_llama(self, test_config):
        """type_hint='creative' should route to Llama."""
        classification = ClassificationResult(type="math", complexity="low", language="en")
        model, deployment = select_deployment(
            classification, "standard", test_config,
            type_hint="creative", language_hint=None
        )
        # type_hint overrides to creative, so Rule 2 applies
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_type_hint_math_with_high_complexity_routes_to_deepseek(self, test_config):
        """type_hint='math' with high complexity should route to DeepSeek."""
        classification = ClassificationResult(type="chat", complexity="high", language="en")
        model, deployment = select_deployment(
            classification, "standard", test_config,
            type_hint="math", language_hint=None
        )
        # type_hint overrides to math, complexity is high, so Rule 1 applies
        assert model == "DeepSeek-R1"
        assert deployment == test_config.deploy_deepseek
    
    def test_language_hint_fr_routes_to_mistral(self, test_config):
        """language_hint='fr' should route to Mistral when no higher rule applies."""
        # math + low complexity + standard tier → no Rule 1-3
        classification = ClassificationResult(type="math", complexity="low", language="en")
        model, deployment = select_deployment(
            classification, "standard", test_config,
            type_hint=None, language_hint="fr"
        )
        # language_hint overrides to fr, so Rule 4 applies
        assert model == "Mistral-Large-2411"
        assert deployment == test_config.deploy_mistral
    
    def test_language_hint_fr_does_not_override_higher_rules(self, test_config):
        """language_hint='fr' should not override higher priority rules."""
        # chat type → Rule 3 applies before Rule 4
        classification = ClassificationResult(type="chat", complexity="low", language="en")
        model, deployment = select_deployment(
            classification, "standard", test_config,
            type_hint=None, language_hint="fr"
        )
        # Rule 3 (chat) has higher priority than Rule 4 (French)
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama
    
    def test_type_hint_overrides_classifier_for_vip(self, test_config):
        """type_hint should work correctly with VIP tier."""
        # VIP tier normally routes to Llama, but math+high should go to DeepSeek
        classification = ClassificationResult(type="chat", complexity="high", language="en")
        model, deployment = select_deployment(
            classification, "vip", test_config,
            type_hint="math", language_hint=None
        )
        # type_hint=math + high complexity → Rule 1 (DeepSeek) beats Rule 2 (VIP)
        assert model == "DeepSeek-R1"
        assert deployment == test_config.deploy_deepseek
    
    def test_no_hints_uses_classifier_result(self, test_config):
        """Without hints, classifier result should be used."""
        classification = ClassificationResult(type="creative", complexity="low", language="en")
        model, deployment = select_deployment(
            classification, "standard", test_config,
            type_hint=None, language_hint=None
        )
        # No hints, classifier says creative → Rule 2 applies
        assert model == "Llama-3.3-70B"
        assert deployment == test_config.deploy_llama


@settings(max_examples=100)
@given(
    classification=classification_result,
    tier=client_tier,
    type_hint=type_hint_strategy,
    language_hint=language_hint_strategy,
)
def test_hint_override_property(
    classification: ClassificationResult,
    tier: str,
    type_hint,
    language_hint,
):
    """
    Property: Hint Override Consistency
    
    For any classification, tier, and hint combination:
    - When type_hint is provided, the effective type should be the hint value
    - When language_hint is provided, the effective language should be the hint value
    - The routing result should be deterministic and follow priority rules
    
    **Feature: azure-foundry-agents-integration, Property: Hint Override**
    **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    """
    config = RouterConfig(
        azure_endpoint="https://test.azure.com",
        azure_key="test-key",
        deploy_deepseek="deepseek-r1-us",
        deploy_llama="llama33-70b-us",
        deploy_mistral="mistral-large-2411-us",
        deploy_classifier="phi4mini-classifier-us",
    )
    
    # Call routing with hints
    model_name, deployment = select_deployment(
        classification, tier, config,
        type_hint=type_hint, language_hint=language_hint
    )
    
    # Verify result is valid
    assert model_name is not None
    assert deployment is not None
    assert model_name in ["DeepSeek-R1", "Llama-3.3-70B", "Mistral-Large-2411"]
    assert deployment in [
        config.deploy_deepseek,
        config.deploy_llama,
        config.deploy_mistral,
    ]
    
    # Verify hints are applied correctly
    effective_type = type_hint if type_hint is not None else classification.type
    effective_language = language_hint if language_hint is not None else classification.language
    
    # Verify routing follows priority rules with effective values
    if effective_type in ("math", "coding") and classification.complexity == "high":
        assert model_name == "DeepSeek-R1"
    elif effective_type == "creative" or tier == "vip":
        assert model_name == "Llama-3.3-70B"
    elif effective_type == "chat":
        assert model_name == "Llama-3.3-70B"
    elif effective_language == "fr":
        assert model_name == "Mistral-Large-2411"
    else:
        assert model_name == "Llama-3.3-70B"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
