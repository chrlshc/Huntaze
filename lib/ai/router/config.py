"""
Configuration for AI Router.

Loads settings from environment variables with sensible defaults.
Supports Azure AI Foundry models including Phi-4 Multimodal and Azure Speech.
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
        deploy_phi4_multimodal: Phi-4 Multimodal deployment name
        deploy_azure_speech: Azure Speech Batch service name
        azure_phi4_multimodal_endpoint: Phi-4 Multimodal endpoint URL
        azure_phi4_multimodal_key: Phi-4 Multimodal API key
        azure_speech_endpoint: Azure Speech endpoint URL
        azure_speech_key: Azure Speech API key
        azure_speech_region: Azure Speech region
        region: Azure region (default: eastus2)
    """
    
    azure_endpoint: str
    azure_key: str
    deploy_deepseek: str = "deepseek-r1-us"
    deploy_llama: str = "llama33-70b-us"
    deploy_mistral: str = "mistral-large-2411-us"
    deploy_classifier: str = "phi4mini-classifier-us"
    deploy_phi4_multimodal: str = "phi-4-multimodal-endpoint"
    deploy_azure_speech: str = "huntaze-speech"
    azure_phi4_multimodal_endpoint: str = ""
    azure_phi4_multimodal_key: str = ""
    azure_speech_endpoint: str = ""
    azure_speech_key: str = ""
    azure_speech_region: str = "eastus2"
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
            DEPLOY_PHI4_MULTIMODAL: Optional. Phi-4 Multimodal deployment name.
            AZURE_PHI4_MULTIMODAL_ENDPOINT: Optional. Phi-4 Multimodal endpoint.
            AZURE_PHI4_MULTIMODAL_KEY: REDACTED. Phi-4 Multimodal API key.
            AZURE_SPEECH_ENDPOINT: Optional. Azure Speech endpoint.
            AZURE_SPEECH_KEY: REDACTED. Azure Speech API key.
            AZURE_SPEECH_REGION: Optional. Azure Speech region.
        
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
            deploy_phi4_multimodal=os.getenv("DEPLOY_PHI4_MULTIMODAL", "phi-4-multimodal-endpoint"),
            deploy_azure_speech=os.getenv("DEPLOY_AZURE_SPEECH", "huntaze-speech"),
            azure_phi4_multimodal_endpoint=os.getenv("AZURE_PHI4_MULTIMODAL_ENDPOINT", ""),
            azure_phi4_multimodal_key=os.getenv("AZURE_PHI4_MULTIMODAL_KEY", ""),
            azure_speech_endpoint=os.getenv("AZURE_SPEECH_ENDPOINT", ""),
            azure_speech_key=os.getenv("AZURE_SPEECH_KEY", ""),
            azure_speech_region=os.getenv("AZURE_SPEECH_REGION", "eastus2"),
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
    
    def validate_multimodal(self) -> None:
        """Validate Phi-4 Multimodal configuration.
        
        Raises:
            RuntimeError: If Phi-4 Multimodal endpoint or key is missing.
        """
        if not self.azure_phi4_multimodal_endpoint:
            raise RuntimeError(
                "AZURE_PHI4_MULTIMODAL_ENDPOINT environment variable is not configured. "
                "Please set it to your Phi-4 Multimodal endpoint URL."
            )
        if not self.azure_phi4_multimodal_key:
            raise RuntimeError(
                "AZURE_PHI4_MULTIMODAL_KEY environment variable is not configured. "
                "Please set it to your Phi-4 Multimodal API key."
            )
    
    def validate_speech(self) -> None:
        """Validate Azure Speech configuration.
        
        Raises:
            RuntimeError: If Azure Speech endpoint or key is missing.
        """
        if not self.azure_speech_key:
            raise RuntimeError(
                "AZURE_SPEECH_KEY environment variable is not configured. "
                "Please set it to your Azure Speech API key."
            )
    
    def has_multimodal_config(self) -> bool:
        """Check if Phi-4 Multimodal is configured."""
        return bool(self.azure_phi4_multimodal_endpoint and self.azure_phi4_multimodal_key)
    
    def has_speech_config(self) -> bool:
        """Check if Azure Speech is configured."""
        return bool(self.azure_speech_key)
