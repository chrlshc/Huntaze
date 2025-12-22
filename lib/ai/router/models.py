"""
Data models for AI Router.

Defines the core data structures used throughout the routing system.
Supports Azure AI Foundry models including Phi-4 Multimodal and Azure Speech.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Literal, Optional, List
from pydantic import BaseModel, Field


# Type aliases for classification values
ClassificationType = Literal["math", "coding", "creative", "chat", "visual", "audio", "multimodal"]
ComplexityLevel = Literal["high", "low", "moderate"]
LanguageCode = Literal["fr", "en", "other"]
ModalityType = Literal["text", "visual", "audio", "multimodal"]

# Model types available in the router
ModelType = Literal[
    "DeepSeek-R1",
    "DeepSeek-V3", 
    "Llama-3.3-70B",
    "Mistral-Large-2411",
    "Phi-4-mini",
    "Phi-4-Multimodal",
    "Azure-Speech-Batch"
]


@dataclass
class ClassificationResult:
    """Result of prompt classification by Phi-4-mini.
    
    Attributes:
        type: The detected task type (math, coding, creative, chat)
        complexity: The complexity level (high, low)
        language: The detected language (fr, en, other)
    """
    
    type: ClassificationType = "chat"
    complexity: ComplexityLevel = "low"
    language: LanguageCode = "other"
    
    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "ClassificationResult":
        """Create a ClassificationResult from a JSON dictionary.
        
        Handles missing fields by using defaults. Invalid values are
        coerced to defaults.
        
        Args:
            data: Dictionary with type, complexity, and language keys.
        
        Returns:
            ClassificationResult with validated values.
        """
        # Validate type
        raw_type = data.get("type", "chat")
        valid_types = {"math", "coding", "creative", "chat"}
        type_value: ClassificationType = raw_type if raw_type in valid_types else "chat"
        
        # Validate complexity
        raw_complexity = data.get("complexity", "low")
        valid_complexities = {"high", "low"}
        complexity_value: ComplexityLevel = raw_complexity if raw_complexity in valid_complexities else "low"
        
        # Validate language
        raw_language = data.get("language", "other")
        valid_languages = {"fr", "en", "other"}
        language_value: LanguageCode = raw_language if raw_language in valid_languages else "other"
        
        return cls(
            type=type_value,
            complexity=complexity_value,
            language=language_value,
        )
    
    def to_json(self) -> Dict[str, str]:
        """Serialize to a JSON-compatible dictionary.
        
        Returns:
            Dictionary with type, complexity, and language keys.
        """
        return {
            "type": self.type,
            "complexity": self.complexity,
            "language": self.language,
        }


@dataclass
class UsageStats:
    """Token usage statistics from model response.
    
    Attributes:
        prompt_tokens: Number of tokens in the prompt
        completion_tokens: Number of tokens in the completion
        total_tokens: Total tokens used
    """
    
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    
    def to_dict(self) -> Dict[str, int]:
        """Convert to dictionary."""
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
        }


@dataclass
class DeploymentResponse:
    """Response from an Azure deployment call.
    
    Attributes:
        text: The generated text content
        raw: The raw response object
        usage: Token usage statistics (if available)
    """
    
    text: str
    raw: Dict[str, Any] = field(default_factory=dict)
    usage: Optional[UsageStats] = None


# Pydantic models for FastAPI
class RouteRequest(BaseModel):
    """Request body for the /route endpoint.
    
    Attributes:
        prompt: The user prompt to route
        client_tier: Client subscription tier ("standard" or "vip")
        type_hint: Optional hint to override classifier type detection
        language_hint: Optional hint to override classifier language detection
        modality: Content modality (text, visual, audio, multimodal)
        image_urls: Optional list of image URLs for visual/multimodal tasks
        audio_url: Optional audio URL for audio/multimodal tasks
        video_url: Optional video URL for multimodal tasks
    """
    
    prompt: str
    client_tier: str = Field(default="standard")
    type_hint: Optional[ClassificationType] = Field(
        default=None,
        description="Override classifier type detection (math, coding, creative, chat, visual, audio, multimodal)"
    )
    language_hint: Optional[LanguageCode] = Field(
        default=None,
        description="Override classifier language detection (fr, en, other)"
    )
    modality: Optional[ModalityType] = Field(
        default="text",
        description="Content modality: text, visual, audio, or multimodal"
    )
    image_urls: Optional[List[str]] = Field(
        default=None,
        description="Image URLs for visual/multimodal analysis"
    )
    audio_url: Optional[str] = Field(
        default=None,
        description="Audio URL for transcription/multimodal analysis"
    )
    video_url: Optional[str] = Field(
        default=None,
        description="Video URL for multimodal analysis"
    )


class RouteResponse(BaseModel):
    """Response body for the /route endpoint."""
    
    model: str
    deployment: str
    region: str
    routing: Dict[str, Any]
    output: str
    usage: Optional[Dict[str, Any]] = None
    modality: Optional[str] = Field(default="text", description="Content modality used")
    azure_service: Optional[str] = Field(default=None, description="Azure service used (e.g., 'phi-4-multimodal', 'speech-batch')")


class MultimodalRequest(BaseModel):
    """Request body for multimodal analysis via Phi-4 Multimodal.
    
    Attributes:
        prompt: Analysis prompt/instructions
        image_urls: List of image URLs to analyze
        video_url: Optional video URL (will extract keyframes)
        audio_transcript: Optional pre-transcribed audio text
        analysis_type: Type of analysis (ocr, facial, editing, timeline, viral)
    """
    
    prompt: str
    image_urls: Optional[List[str]] = Field(default=None)
    video_url: Optional[str] = Field(default=None)
    audio_transcript: Optional[str] = Field(default=None)
    analysis_type: str = Field(
        default="general",
        description="Analysis type: ocr, facial, editing, timeline, viral, general"
    )
    client_tier: str = Field(default="standard")


class AudioTranscriptionRequest(BaseModel):
    """Request body for Azure Speech Batch Transcription.
    
    Attributes:
        audio_url: URL to audio file (WAV, MP3, etc.)
        language: Audio language code (default: en-US)
        enable_diarization: Enable speaker diarization
        enable_word_timestamps: Include word-level timestamps
    """
    
    audio_url: str
    language: str = Field(default="en-US")
    enable_diarization: bool = Field(default=True)
    enable_word_timestamps: bool = Field(default=True)
    client_tier: str = Field(default="standard")


class AudioTranscriptionResponse(BaseModel):
    """Response body for audio transcription."""
    
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    transcript: Optional[str] = None
    segments: Optional[List[Dict[str, Any]]] = None
    speakers: Optional[List[Dict[str, Any]]] = None
    duration_seconds: Optional[float] = None
    cost_usd: Optional[float] = None
