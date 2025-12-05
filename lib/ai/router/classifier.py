"""
Classifier service for prompt analysis.

Uses Phi-4-mini to classify incoming prompts by type, complexity, and language.
"""

import json
import re
from typing import Optional

try:
    from .models import ClassificationResult
    from .client import AzureClientFactory
    from .config import RouterConfig
except ImportError:
    from models import ClassificationResult
    from client import AzureClientFactory
    from config import RouterConfig


# System prompt for the classifier
CLASSIFIER_SYSTEM_PROMPT = """You are a prompt classifier. Analyze the user's prompt and return ONLY a JSON object with these fields:
- type: one of "math", "coding", "creative", "chat"
- complexity: one of "high", "low"
- language: one of "fr", "en", "other"

Rules:
- "math": mathematical problems, equations, calculations
- "coding": programming, code, algorithms, debugging
- "creative": writing, stories, poetry, brainstorming
- "chat": general conversation, questions, explanations

Complexity is "high" if the task requires deep reasoning or multiple steps.

Return ONLY the JSON object, no other text."""


def extract_json_from_text(text: str) -> Optional[dict]:
    """Extract a JSON object from text that may contain extra content.
    
    Attempts to find and parse JSON between curly braces.
    
    Args:
        text: Text that may contain a JSON object.
    
    Returns:
        Parsed dictionary if found, None otherwise.
    """
    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON between curly braces
    match = re.search(r'\{[^{}]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    
    # Try to find nested JSON (handles some edge cases)
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    
    return None


def get_default_classification() -> ClassificationResult:
    """Return the default classification for failed parsing.
    
    Returns:
        ClassificationResult with type=chat, complexity=low, language=other.
    """
    return ClassificationResult(
        type="chat",
        complexity="low",
        language="other",
    )


async def classify_prompt(
    prompt: str,
    client_factory: "AzureClientFactory",
    config: "RouterConfig",
) -> ClassificationResult:
    """Classify a user prompt using Phi-4-mini.
    
    Args:
        prompt: The user's prompt to classify.
        client_factory: Factory for creating Azure clients.
        config: Router configuration.
    
    Returns:
        ClassificationResult with detected type, complexity, and language.
    """
    try:
        response = await client_factory.call_deployment(
            deployment_name=config.deploy_classifier,
            system_prompt=CLASSIFIER_SYSTEM_PROMPT,
            user_prompt=prompt,
        )
        
        # Try to parse the response as JSON
        parsed = extract_json_from_text(response.text)
        
        if parsed is not None:
            return ClassificationResult.from_json(parsed)
        
        # If parsing failed, return defaults
        return get_default_classification()
        
    except Exception:
        # On any error, return defaults
        return get_default_classification()
