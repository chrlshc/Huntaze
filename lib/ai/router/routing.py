"""
Routing engine for model selection.

Applies priority-based rules to select the optimal deployment for each request.
Supports type_hint and language_hint to override classifier results.
Includes routing for Azure AI services: Phi-4 Multimodal and Azure Speech Batch.
"""

from typing import Optional

try:
    from .models import ClassificationResult, ClassificationType, LanguageCode, ModalityType
    from .config import RouterConfig
except ImportError:
    from models import ClassificationResult, ClassificationType, LanguageCode, ModalityType
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
    modality: Optional[ModalityType] = None,
) -> tuple[str, str]:
    """Select the optimal deployment based on classification and tier.
    
    Routing rules (in priority order):
    1. Audio modality → Azure Speech Batch Transcription
    2. Visual/Multimodal modality → Phi-4 Multimodal
    3. Math/coding with high complexity → DeepSeek-R1
    4. Creative type OR VIP tier → Llama 3.3 70B
    5. Chat type → Llama 3.3 70B
    6. French language → Mistral Large 2407
    7. Fallback → Llama 3.3 70B
    
    When type_hint or language_hint are provided, they override the classifier
    results before applying routing rules.
    
    Args:
        classification: The prompt classification result from Phi-4-mini.
        client_tier: The client's subscription tier ("standard" or "vip").
        config: Router configuration with deployment names.
        type_hint: Optional hint to override classifier type detection.
        language_hint: Optional hint to override classifier language detection.
        modality: Content modality (text, visual, audio, multimodal).
    
    Returns:
        Tuple of (model_name, deployment_name).
    """
    # Apply hints to override classification
    effective = apply_hints(classification, type_hint, language_hint)
    
    # Rule 0: Audio modality → Azure Speech Batch
    if modality == "audio" or effective.type == "audio":
        return ("Azure-Speech-Batch", config.deploy_azure_speech)
    
    # Rule 1: Visual/Multimodal modality → Phi-4 Multimodal
    if modality in ("visual", "multimodal") or effective.type in ("visual", "multimodal"):
        return ("Phi-4-Multimodal", config.deploy_phi4_multimodal)
    
    # Rule 2: Math/coding with high complexity → DeepSeek-R1
    if effective.type in ("math", "coding") and effective.complexity == "high":
        return ("DeepSeek-R1", config.deploy_deepseek)
    
    # Rule 3: Creative type OR VIP tier → Llama 3.3 70B
    if effective.type == "creative" or client_tier == "vip":
        return ("Llama-3.3-70B", config.deploy_llama)
    
    # Rule 4: Chat type → Llama 3.3 70B
    if effective.type == "chat":
        return ("Llama-3.3-70B", config.deploy_llama)
    
    # Rule 5: French language → Mistral Large 2411
    if effective.language == "fr":
        return ("Mistral-Large-2411", config.deploy_mistral)
    
    # Rule 6: Fallback → Llama 3.3 70B
    return ("Llama-3.3-70B", config.deploy_llama)


def select_deployment_for_content_trends(
    task_type: str,
    modality: ModalityType,
    complexity: str,
    config: "RouterConfig",
) -> tuple[str, str, str]:
    """Select deployment specifically for Content Trends AI Engine tasks.
    
    Routing rules for content trends:
    1. Audio transcription → Azure Speech Batch ($0.18/hour)
    2. Visual/Multimodal analysis → Phi-4 Multimodal (128K context)
    3. Complex reasoning (viral analysis, hook analysis) → DeepSeek R1
    4. Simple/Moderate text tasks → DeepSeek V3
    
    Args:
        task_type: Type of content trends task (viral_analysis, ocr, audio_transcription, etc.)
        modality: Content modality (text, visual, audio, multimodal)
        complexity: Task complexity (simple, moderate, complex)
        config: Router configuration.
    
    Returns:
        Tuple of (model_name, deployment_name, azure_service).
    """
    # Audio tasks → Azure Speech Batch
    if modality == "audio" or task_type == "audio_transcription":
        return ("Azure-Speech-Batch", config.deploy_azure_speech, "speech-batch")
    
    # Visual/Multimodal tasks → Phi-4 Multimodal
    if modality in ("visual", "multimodal") or task_type in ("ocr", "visual_analysis", "facial_analysis", "editing_dynamics", "timeline_analysis"):
        return ("Phi-4-Multimodal", config.deploy_phi4_multimodal, "phi-4-multimodal")
    
    # Complex reasoning tasks → DeepSeek R1
    complex_tasks = {"viral_analysis", "hook_analysis", "emotional_analysis", "trend_prediction", "strategy_generation"}
    if task_type in complex_tasks or complexity == "complex":
        return ("DeepSeek-R1", config.deploy_deepseek, "deepseek-r1")
    
    # Simple/Moderate text tasks → DeepSeek V3 (or Llama as fallback)
    return ("Llama-3.3-70B", config.deploy_llama, "llama-3.3-70b")


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
        "Phi-4-Multimodal": config.deploy_phi4_multimodal,
        "Azure-Speech-Batch": config.deploy_azure_speech,
    }
    return model_map.get(model_name, config.deploy_llama)


def get_azure_service_endpoint(service_name: str, config: "RouterConfig") -> dict:
    """Get Azure service endpoint configuration.
    
    Args:
        service_name: Azure service name (phi-4-multimodal, speech-batch)
        config: Router configuration.
    
    Returns:
        Dictionary with endpoint URL and API key.
    """
    if service_name == "phi-4-multimodal":
        return {
            "endpoint": config.azure_phi4_multimodal_endpoint,
            "api_key": config.azure_phi4_multimodal_key,
            "deployment": config.deploy_phi4_multimodal,
        }
    elif service_name == "speech-batch":
        return {
            "endpoint": config.azure_speech_endpoint,
            "api_key": config.azure_speech_key,
            "region": config.azure_speech_region,
        }
    else:
        raise ValueError(f"Unknown Azure service: {service_name}")
