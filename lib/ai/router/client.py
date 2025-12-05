"""
Azure AI client factory for model inference.

Provides a unified interface to call different Azure AI deployments
using the Model Inference endpoint with deployment headers.
"""

from typing import Any, Dict, List, Optional
import httpx

try:
    from .config import RouterConfig
    from .models import DeploymentResponse, UsageStats
except ImportError:
    from config import RouterConfig
    from models import DeploymentResponse, UsageStats


class AzureClientFactory:
    """Factory for creating Azure AI inference clients.
    
    Uses the unified Model Inference endpoint with the
    azureml-model-deployment header to route to specific deployments.
    """
    
    def __init__(self, config: RouterConfig):
        """Initialize the client factory.
        
        Args:
            config: Router configuration with endpoint and credentials.
        
        Raises:
            RuntimeError: If endpoint or API key is not configured.
        """
        config.validate()
        self.config = config
        self._client: Optional[httpx.AsyncClient] = None
    
    @property
    def client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=60.0,
                headers={
                    "Authorization": f"Bearer {self.config.azure_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
    
    def _build_headers(self, deployment_name: str) -> Dict[str, str]:
        """Build request headers with deployment routing.
        
        Args:
            deployment_name: The target deployment name.
        
        Returns:
            Headers dictionary with azureml-model-deployment set.
        """
        return {
            "azureml-model-deployment": deployment_name,
        }
    
    def _build_request_body(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Build the chat completion request body.
        
        Args:
            system_prompt: The system message.
            user_prompt: The user message.
            max_tokens: Maximum tokens to generate.
            temperature: Sampling temperature.
        
        Returns:
            Request body dictionary.
        """
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        
        return {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
    
    def _extract_response(self, data: Dict[str, Any]) -> DeploymentResponse:
        """Extract text and usage from API response.
        
        Args:
            data: The JSON response from Azure.
        
        Returns:
            DeploymentResponse with extracted content.
        """
        # Extract text from choices
        text = ""
        choices = data.get("choices", [])
        if choices:
            message = choices[0].get("message", {})
            text = message.get("content", "")
        
        # Extract usage statistics
        usage = None
        usage_data = data.get("usage")
        if usage_data:
            usage = UsageStats(
                prompt_tokens=usage_data.get("prompt_tokens", 0),
                completion_tokens=usage_data.get("completion_tokens", 0),
                total_tokens=usage_data.get("total_tokens", 0),
            )
        
        return DeploymentResponse(
            text=text,
            raw=data,
            usage=usage,
        )
    
    async def call_deployment(
        self,
        deployment_name: str,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.7,
    ) -> DeploymentResponse:
        """Call an Azure AI deployment.
        
        Args:
            deployment_name: The target deployment name.
            system_prompt: The system message.
            user_prompt: The user message.
            max_tokens: Maximum tokens to generate.
            temperature: Sampling temperature.
        
        Returns:
            DeploymentResponse with generated text and usage.
        
        Raises:
            httpx.HTTPStatusError: If the API returns an error.
        """
        # Build endpoint URL (chat completions)
        url = f"{self.config.azure_endpoint.rstrip('/')}/chat/completions"
        
        # Build request
        headers = self._build_headers(deployment_name)
        body = self._build_request_body(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        
        # Make request
        response = await self.client.post(url, headers=headers, json=body)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        return self._extract_response(data)
