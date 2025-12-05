"""
Configuration for AI Router.

Loads settings from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class RouterConfig:
    """Configuration for the AI Router service.
    
    Attributes:
        azure_endpoint: Azure AI Model Inference endpoint URL
        azure_key: Azure AI API key
        deploy_deepseek: DeepSeek-R1 deployment name
        deploy_llama: Llama 3.3 70B deployment name
        deploy_mistral: Mistral Large 2407 deployment name
        deploy_classifier: Phi-4-mini classifier deployment name
        region: Azure region (default: eastus2)
    """
    
    azure_endpoint: str
    azure_key: str
    deploy_deepseek: str = "deepseek-r1-us"
    deploy_llama: str = "llama33-70b-us"
    deploy_mistral: str = "mistral-large-2411-us"
    deploy_classifier: str = "phi4mini-classifier-us"
    region: str = "eastus2"
    
    @classmethod
    def from_env(cls) -> "RouterConfig":
        """Load configuration from environment variables.
        
        Environment variables:
            AZURE_AI_CHAT_ENDPOINT: Required. Azure AI endpoint URL.
            AZURE_AI_CHAT_KEY: REDACTED. Azure AI API key.
            DEPLOY_DEEPSEEK: Optional. DeepSeek deployment name.
            DEPLOY_LLAMA: Optional. Llama deployment name.
            DEPLOY_MISTRAL: Optional. Mistral deployment name.
            DEPLOY_PHI_CLASSIFIER: Optional. Phi classifier deployment name.
        
        Returns:
            RouterConfig instance with loaded values.
        """
        return cls(
            azure_endpoint=os.getenv("AZURE_AI_CHAT_ENDPOINT", ""),
            azure_key=os.getenv("AZURE_AI_CHAT_KEY", ""),
            deploy_deepseek=os.getenv("DEPLOY_DEEPSEEK", "deepseek-r1-us"),
            deploy_llama=os.getenv("DEPLOY_LLAMA", "llama33-70b-us"),
            deploy_mistral=os.getenv("DEPLOY_MISTRAL", "mistral-large-2411-us"),
            deploy_classifier=os.getenv("DEPLOY_PHI_CLASSIFIER", "phi4mini-classifier-us"),
        )
    
    def validate(self) -> None:
        """Validate that required configuration is present.
        
        Raises:
            RuntimeError: If endpoint or API key is missing.
        """
        if not self.azure_endpoint:
            raise RuntimeError(
                "AZURE_AI_CHAT_ENDPOINT environment variable is not configured. "
                "Please set it to your Azure AI Model Inference endpoint URL."
            )
        if not self.azure_key:
            raise RuntimeError(
                "AZURE_AI_CHAT_KEY environment variable is not configured. "
                "Please set it to your Azure AI API key."
            )
