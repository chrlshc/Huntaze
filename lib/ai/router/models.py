"""
Data models for AI Router.

Defines the core data structures used throughout the routing system.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field


# Type aliases for classification values
ClassificationType = Literal["math", "coding", "creative", "chat"]
ComplexityLevel = Literal["high", "low"]
LanguageCode = Literal["fr", "en", "other"]


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
    """
    
    prompt: str
    client_tier: str = Field(default="standard")
    type_hint: Optional[ClassificationType] = Field(
        default=None,
        description="Override classifier type detection (math, coding, creative, chat)"
    )
    language_hint: Optional[LanguageCode] = Field(
        default=None,
        description="Override classifier language detection (fr, en, other)"
    )


class RouteResponse(BaseModel):
    """Response body for the /route endpoint."""
    
    model: str
    deployment: str
    region: str
    routing: Dict[str, Any]
    output: str
    usage: Optional[Dict[str, Any]] = None
