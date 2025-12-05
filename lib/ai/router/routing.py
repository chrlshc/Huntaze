"""
Routing engine for model selection.

Applies priority-based rules to select the optimal deployment for each request.
Supports type_hint and language_hint to override classifier results.
"""

from typing import Optional

try:
    from .models import ClassificationResult, ClassificationType, LanguageCode
    from .config import RouterConfig
except ImportError:
    from models import ClassificationResult, ClassificationType, LanguageCode
    from config import RouterConfig


def apply_hints(
    classification: ClassificationResult,
    type_hint: Optional[ClassificationType] = None,
    language_hint: Optional[LanguageCode] = None,
) -> ClassificationResult:
    """Apply hints to override classification results.
    
    When hints are provided, they override the classifier's detection.
    The classifier serves as an intelligent fallback when hints are not provided.
    
    Args:
        classification: The original classification from Phi-4-mini.
        type_hint: Optional type hint to override classifier type.
        language_hint: Optional language hint to override classifier language.
    
    Returns:
        ClassificationResult with hints applied.
    """
    return ClassificationResult(
        type=type_hint if type_hint is not None else classification.type,
        complexity=classification.complexity,  # No hint for complexity
        language=language_hint if language_hint is not None else classification.language,
    )


def select_deployment(
    classification: ClassificationResult,
    client_tier: str,
    config: "RouterConfig",
    type_hint: Optional[ClassificationType] = None,
    language_hint: Optional[LanguageCode] = None,
) -> tuple[str, str]:
    """Select the optimal deployment based on classification and tier.
    
    Routing rules (in priority order):
    1. Math/coding with high complexity → DeepSeek-R1
    2. Creative type OR VIP tier → Llama 3.3 70B
    3. Chat type → Llama 3.3 70B
    4. French language → Mistral Large 2407
    5. Fallback → Llama 3.3 70B
    
    When type_hint or language_hint are provided, they override the classifier
    results before applying routing rules.
    
    Args:
        classification: The prompt classification result from Phi-4-mini.
        client_tier: The client's subscription tier ("standard" or "vip").
        config: Router configuration with deployment names.
        type_hint: Optional hint to override classifier type detection.
        language_hint: Optional hint to override classifier language detection.
    
    Returns:
        Tuple of (model_name, deployment_name).
    """
    # Apply hints to override classification
    effective = apply_hints(classification, type_hint, language_hint)
    
    # Rule 1: Math/coding with high complexity → DeepSeek-R1
    if effective.type in ("math", "coding") and effective.complexity == "high":
        return ("DeepSeek-R1", config.deploy_deepseek)
    
    # Rule 2: Creative type OR VIP tier → Llama 3.3 70B
    if effective.type == "creative" or client_tier == "vip":
        return ("Llama-3.3-70B", config.deploy_llama)
    
    # Rule 3: Chat type → Llama 3.3 70B
    if effective.type == "chat":
        return ("Llama-3.3-70B", config.deploy_llama)
    
    # Rule 4: French language → Mistral Large 2411
    if effective.language == "fr":
        return ("Mistral-Large-2411", config.deploy_mistral)
    
    # Rule 5: Fallback → Llama 3.3 70B
    return ("Llama-3.3-70B", config.deploy_llama)


def get_deployment_for_model(model_name: str, config: "RouterConfig") -> str:
    """Get the deployment name for a given model.
    
    Args:
        model_name: The model name (e.g., "DeepSeek-R1").
        config: Router configuration.
    
    Returns:
        The deployment name for the model.
    """
    model_map = {
        "DeepSeek-R1": config.deploy_deepseek,
        "Llama-3.3-70B": config.deploy_llama,
        "Mistral-Large-2411": config.deploy_mistral,
        "Phi-4-mini": config.deploy_classifier,
    }
    return model_map.get(model_name, config.deploy_llama)
