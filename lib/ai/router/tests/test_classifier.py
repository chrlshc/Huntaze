"""
Property-based tests for AI Router classifier service.

Uses Hypothesis for property-based testing to verify correctness properties.
"""

import os
import sys
import json
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import AsyncMock, MagicMock, patch

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import with absolute paths
from lib.ai.router.classifier import (
    extract_json_from_text,
    get_default_classification,
    CLASSIFIER_SYSTEM_PROMPT,
)
from lib.ai.router.models import ClassificationResult


# =============================================================================
# Hypothesis Strategies (Generators)
# =============================================================================

classification_type = st.sampled_from(["math", "coding", "creative", "chat"])
complexity_level = st.sampled_from(["high", "low"])
language_code = st.sampled_from(["fr", "en", "other"])

# Strategy for valid classification JSON objects
valid_classification_json = st.fixed_dictionaries({
    "type": classification_type,
    "complexity": complexity_level,
    "language": language_code,
})

# Strategy for arbitrary prefix/suffix text (no curly braces to avoid nested JSON)
surrounding_text = st.text(
    alphabet=st.characters(blacklist_characters='{}'),
    min_size=0,
    max_size=100
)

# Strategy for whitespace
whitespace = st.sampled_from(["", " ", "\n", "\t", "  ", "\n\n", " \n "])


# =============================================================================
# Property 3: JSON Extraction from Malformed Response
# **Feature: ai-router-azure-us, Property 3: JSON Extraction from Malformed Response**
# **Validates: Requirements 1.3**
# =============================================================================

@settings(max_examples=100)
@given(
    json_obj=valid_classification_json,
    prefix=surrounding_text,
    suffix=surrounding_text,
    ws_before=whitespace,
    ws_after=whitespace,
)
def test_json_extraction_from_malformed_response(
    json_obj: dict,
    prefix: str,
    suffix: str,
    ws_before: str,
    ws_after: str,
):
    """
    Property 3: JSON Extraction from Malformed Response
    
    For any string containing a valid JSON object between curly braces
    (with arbitrary text before/after), the JSON extraction function
    SHALL successfully parse and return the embedded JSON object.
    
    **Feature: ai-router-azure-us, Property 3: JSON Extraction from Malformed Response**
    **Validates: Requirements 1.3**
    """
    # Create the JSON string
    json_str = json.dumps(json_obj)
    
    # Embed it in surrounding text
    malformed_response = f"{prefix}{ws_before}{json_str}{ws_after}{suffix}"
    
    # Extract JSON
    extracted = extract_json_from_text(malformed_response)
    
    # Verify extraction succeeded
    assert extracted is not None, f"Failed to extract JSON from: {malformed_response!r}"
    
    # Verify the extracted values match
    assert extracted["type"] == json_obj["type"]
    assert extracted["complexity"] == json_obj["complexity"]
    assert extracted["language"] == json_obj["language"]


@settings(max_examples=100)
@given(json_obj=valid_classification_json)
def test_json_extraction_direct_parse(json_obj: dict):
    """
    Test that clean JSON strings are parsed directly.
    
    **Feature: ai-router-azure-us, Property 3: JSON Extraction from Malformed Response**
    **Validates: Requirements 1.3**
    """
    json_str = json.dumps(json_obj)
    
    extracted = extract_json_from_text(json_str)
    
    assert extracted is not None
    assert extracted == json_obj


# =============================================================================
# Property 2: Classification Schema Validity
# **Feature: ai-router-azure-us, Property 2: Classification Schema Validity**
# **Validates: Requirements 1.2, 1.4**
# =============================================================================

# Strategy for arbitrary JSON values (to test schema validation)
arbitrary_type = st.one_of(
    classification_type,  # Valid values
    st.text(min_size=0, max_size=20),  # Arbitrary strings
    st.none(),  # None
)

arbitrary_complexity = st.one_of(
    complexity_level,  # Valid values
    st.text(min_size=0, max_size=20),  # Arbitrary strings
    st.none(),  # None
)

arbitrary_language = st.one_of(
    language_code,  # Valid values
    st.text(min_size=0, max_size=20),  # Arbitrary strings
    st.none(),  # None
)


@settings(max_examples=100)
@given(
    type_val=arbitrary_type,
    complexity_val=arbitrary_complexity,
    language_val=arbitrary_language,
)
def test_classification_schema_validity(type_val, complexity_val, language_val):
    """
    Property 2: Classification Schema Validity
    
    For any response from the Classifier, the parsed ClassificationResult
    SHALL contain a type in {math, coding, creative, chat}, a complexity
    in {high, low}, and a language in {fr, en, other}.
    
    **Feature: ai-router-azure-us, Property 2: Classification Schema Validity**
    **Validates: Requirements 1.2, 1.4**
    """
    # Build input dict (may have invalid values)
    input_data = {}
    if type_val is not None:
        input_data["type"] = type_val
    if complexity_val is not None:
        input_data["complexity"] = complexity_val
    if language_val is not None:
        input_data["language"] = language_val
    
    # Parse through ClassificationResult
    result = ClassificationResult.from_json(input_data)
    
    # Verify schema validity - type must be in valid set
    valid_types = {"math", "coding", "creative", "chat"}
    assert result.type in valid_types, f"Invalid type: {result.type}"
    
    # Verify complexity is in valid set
    valid_complexities = {"high", "low"}
    assert result.complexity in valid_complexities, f"Invalid complexity: {result.complexity}"
    
    # Verify language is in valid set
    valid_languages = {"fr", "en", "other"}
    assert result.language in valid_languages, f"Invalid language: {result.language}"


@settings(max_examples=50)
@given(st.dictionaries(
    keys=st.text(min_size=1, max_size=20),
    values=st.one_of(st.text(), st.integers(), st.booleans(), st.none()),
    max_size=10
))
def test_classification_from_arbitrary_dict(arbitrary_dict: dict):
    """
    Test that ClassificationResult.from_json handles arbitrary dictionaries
    and always produces valid schema.
    
    **Feature: ai-router-azure-us, Property 2: Classification Schema Validity**
    **Validates: Requirements 1.2, 1.4**
    """
    result = ClassificationResult.from_json(arbitrary_dict)
    
    # Must always produce valid values
    assert result.type in {"math", "coding", "creative", "chat"}
    assert result.complexity in {"high", "low"}
    assert result.language in {"fr", "en", "other"}


# =============================================================================
# Unit Tests for Classifier Edge Cases
# =============================================================================

class TestExtractJsonFromText:
    """Unit tests for extract_json_from_text function."""
    
    def test_clean_json(self):
        """Should parse clean JSON directly."""
        text = '{"type": "math", "complexity": "high", "language": "en"}'
        result = extract_json_from_text(text)
        assert result == {"type": "math", "complexity": "high", "language": "en"}
    
    def test_json_with_prefix(self):
        """Should extract JSON with text before it."""
        text = 'Here is the classification: {"type": "coding", "complexity": "low", "language": "fr"}'
        result = extract_json_from_text(text)
        assert result is not None
        assert result["type"] == "coding"
    
    def test_json_with_suffix(self):
        """Should extract JSON with text after it."""
        text = '{"type": "creative", "complexity": "high", "language": "other"} That is my analysis.'
        result = extract_json_from_text(text)
        assert result is not None
        assert result["type"] == "creative"
    
    def test_json_with_newlines(self):
        """Should handle JSON with newlines."""
        text = '''Based on my analysis:
{"type": "chat", "complexity": "low", "language": "en"}
Hope this helps!'''
        result = extract_json_from_text(text)
        assert result is not None
        assert result["type"] == "chat"
    
    def test_invalid_json_returns_none(self):
        """Should return None for completely invalid JSON."""
        text = "This is not JSON at all"
        result = extract_json_from_text(text)
        assert result is None
    
    def test_malformed_json_returns_none(self):
        """Should return None for malformed JSON."""
        text = '{"type": "math", "complexity": }'
        result = extract_json_from_text(text)
        assert result is None
    
    def test_empty_string_returns_none(self):
        """Should return None for empty string."""
        result = extract_json_from_text("")
        assert result is None
    
    def test_whitespace_only_returns_none(self):
        """Should return None for whitespace-only string."""
        result = extract_json_from_text("   \n\t  ")
        assert result is None


class TestGetDefaultClassification:
    """Unit tests for get_default_classification function."""
    
    def test_returns_correct_defaults(self):
        """Should return chat/low/other defaults."""
        result = get_default_classification()
        assert result.type == "chat"
        assert result.complexity == "low"
        assert result.language == "other"
    
    def test_returns_new_instance_each_time(self):
        """Should return a new instance each call."""
        result1 = get_default_classification()
        result2 = get_default_classification()
        assert result1 is not result2


class TestClassifierSystemPrompt:
    """Unit tests for classifier system prompt."""
    
    def test_prompt_mentions_json(self):
        """System prompt should mention JSON output."""
        assert "JSON" in CLASSIFIER_SYSTEM_PROMPT
    
    def test_prompt_mentions_all_types(self):
        """System prompt should mention all classification types."""
        assert "math" in CLASSIFIER_SYSTEM_PROMPT
        assert "coding" in CLASSIFIER_SYSTEM_PROMPT
        assert "creative" in CLASSIFIER_SYSTEM_PROMPT
        assert "chat" in CLASSIFIER_SYSTEM_PROMPT
    
    def test_prompt_mentions_complexity_levels(self):
        """System prompt should mention complexity levels."""
        assert "high" in CLASSIFIER_SYSTEM_PROMPT
        assert "low" in CLASSIFIER_SYSTEM_PROMPT
    
    def test_prompt_mentions_languages(self):
        """System prompt should mention language codes."""
        assert "fr" in CLASSIFIER_SYSTEM_PROMPT
        assert "en" in CLASSIFIER_SYSTEM_PROMPT
        assert "other" in CLASSIFIER_SYSTEM_PROMPT


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
