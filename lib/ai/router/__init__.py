"""
AI Router for Huntaze - Azure AI Foundry East US 2

This module provides intelligent routing of AI requests to different models
deployed on Azure AI Foundry based on prompt classification.

Models:
- DeepSeek-R1: Math and coding tasks with high complexity
- Llama 3.3 70B: Creative, chat, and VIP tier requests
- Mistral Large 2407: French language requests
- Phi-4-mini: Prompt classification
"""

from .config import RouterConfig
from .models import ClassificationResult, RouteRequest, RouteResponse, UsageStats
from .classifier import classify_prompt
from .routing import select_deployment
from .client import AzureClientFactory
from .main import app, get_app

__all__ = [
    "RouterConfig",
    "ClassificationResult",
    "RouteRequest",
    "RouteResponse",
    "UsageStats",
    "classify_prompt",
    "select_deployment",
    "AzureClientFactory",
    "app",
    "get_app",
]
