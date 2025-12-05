"""
FastAPI application for AI Router.

Provides REST endpoints for intelligent routing of AI requests to different
Azure AI Foundry deployments based on prompt classification.

Endpoints:
    POST /route - Route a prompt to the appropriate model
    GET /health - Health check endpoint

Security:
    API key authentication via X-API-Key header (optional, enabled via AI_ROUTER_API_KEY env)
"""

import os
import secrets
import logging
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.security import APIKeyHeader
from contextlib import asynccontextmanager
from typing import Optional

try:
    # Relative imports (when used as package)
    from .config import RouterConfig
    from .models import RouteRequest, RouteResponse, ClassificationResult
    from .classifier import classify_prompt
    from .routing import select_deployment, get_deployment_for_model
    from .client import AzureClientFactory
except ImportError:
    # Absolute imports (when run directly in Docker)
    from config import RouterConfig
    from models import RouteRequest, RouteResponse, ClassificationResult
    from classifier import classify_prompt
    from routing import select_deployment, get_deployment_for_model
    from client import AzureClientFactory


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ai-router")

# Global configuration and client (initialized on startup)
_config: Optional[RouterConfig] = None
_client: Optional[AzureClientFactory] = None
_api_key: Optional[str] = None


# API Key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: Optional[str] = Depends(api_key_header)) -> Optional[str]:
    """Verify API key if authentication is enabled.
    
    Authentication is enabled when AI_ROUTER_API_KEY environment variable is set.
    When enabled, all requests to /route must include a valid X-API-Key header.
    
    Args:
        api_key: API key from X-API-Key header
        
    Returns:
        The API key if valid, None if auth is disabled
        
    Raises:
        HTTPException 401: If auth is enabled and key is missing or invalid
    """
    global _api_key
    
    # If no API key is configured, authentication is disabled
    if not _api_key:
        return None
    
    # API key is required
    if not api_key:
        logger.warning("Request rejected: Missing API key")
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    # Constant-time comparison to prevent timing attacks
    if not secrets.compare_digest(api_key, _api_key):
        logger.warning("Request rejected: Invalid API key")
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize configuration and client on startup."""
    global _config, _client, _api_key
    
    _config = RouterConfig.from_env()
    
    # Load API key for authentication (optional)
    _api_key = os.getenv("AI_ROUTER_API_KEY")
    if _api_key:
        logger.info("API key authentication enabled")
    else:
        logger.warning("API key authentication disabled (AI_ROUTER_API_KEY not set)")
    
    # Only initialize client if config is valid (for testing without Azure)
    if _config.azure_endpoint and _config.azure_key:
        _client = AzureClientFactory(_config)
        logger.info(f"Azure client initialized for region: {_config.region}")
    else:
        logger.warning("Azure client not initialized (missing credentials)")
    
    yield
    
    # Cleanup (if needed)
    _config = None
    _client = None
    _api_key = None


app = FastAPI(
    title="Huntaze AI Router",
    description="Intelligent routing of AI requests to Azure AI Foundry models",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    """Health check endpoint.
    
    Returns:
        Status and region information.
    """
    region = _config.region if _config else "unknown"
    return {
        "status": "healthy",
        "region": region,
        "service": "ai-router",
    }



@app.post("/route", response_model=RouteResponse)
async def route_prompt(
    request: RouteRequest,
    api_key: Optional[str] = Depends(verify_api_key),
):
    """Route a prompt to the appropriate AI model.
    
    The routing process:
    1. Verify API key (if authentication enabled)
    2. Validate the prompt is not empty
    3. Classify the prompt using Phi-4-mini
    4. Select the appropriate deployment based on classification
    5. Call the selected model
    6. Return the response with routing metadata
    
    Args:
        request: RouteRequest with prompt and optional client_tier
        api_key: Validated API key (injected by verify_api_key dependency)
    
    Returns:
        RouteResponse with model output and routing information
    
    Raises:
        HTTPException 401: If API key is invalid (when auth enabled)
        HTTPException 400: If prompt is empty
        HTTPException 500: If configuration is missing or model call fails
    """
    # Generate correlation ID for request tracing
    correlation_id = str(uuid.uuid4())[:8]
    start_time = datetime.now()
    
    # Validate prompt is not empty
    if not request.prompt or not request.prompt.strip():
        logger.warning(f"[{correlation_id}] Request rejected: Empty prompt")
        raise HTTPException(
            status_code=400,
            detail="Prompt cannot be empty"
        )
    
    # Validate configuration
    if not _config:
        raise HTTPException(
            status_code=500,
            detail="Router configuration not initialized"
        )
    
    if not _client:
        raise HTTPException(
            status_code=500,
            detail="Azure client not initialized. Check AZURE_AI_CHAT_ENDPOINT and AZURE_AI_CHAT_KEY."
        )
    
    try:
        # Step 1: Classify the prompt
        logger.info(f"[{correlation_id}] Classifying prompt (tier={request.client_tier})")
        classification = await _classify_prompt_async(request.prompt)
        
        # Step 2: Select deployment based on classification and hints
        # type_hint and language_hint override classifier results when provided
        model_name, deployment_name = select_deployment(
            classification=classification,
            client_tier=request.client_tier,
            config=_config,
            type_hint=request.type_hint,
            language_hint=request.language_hint,
        )
        logger.info(f"[{correlation_id}] Selected model={model_name}, deployment={deployment_name}")
        
        # Step 3: Call the selected model
        response = await _client.call_deployment(
            deployment_name=deployment_name,
            system_prompt="You are a helpful AI assistant.",
            user_prompt=request.prompt,
        )
        
        # Step 4: Build response
        usage_dict = response.usage.to_dict() if response.usage else None
        
        # Determine effective type and language (hints override classifier)
        effective_type = request.type_hint if request.type_hint else classification.type
        effective_language = request.language_hint if request.language_hint else classification.language
        
        # Calculate latency
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        # Log request completion with metrics
        tokens_in = usage_dict.get("prompt_tokens", 0) if usage_dict else 0
        tokens_out = usage_dict.get("completion_tokens", 0) if usage_dict else 0
        logger.info(
            f"[{correlation_id}] Request completed: "
            f"model={model_name}, latency={latency_ms:.0f}ms, "
            f"tokens_in={tokens_in}, tokens_out={tokens_out}, "
            f"tier={request.client_tier}"
        )
        
        return RouteResponse(
            model=model_name,
            deployment=deployment_name,
            region=_config.region,
            routing={
                "type": effective_type,
                "complexity": classification.complexity,
                "language": effective_language,
                "client_tier": request.client_tier,
                "type_hint_applied": request.type_hint is not None,
                "language_hint_applied": request.language_hint is not None,
            },
            output=response.text,
            usage=usage_dict,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000
        logger.error(f"[{correlation_id}] Request failed after {latency_ms:.0f}ms: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during routing: {str(e)}"
        )


async def _classify_prompt_async(prompt: str) -> ClassificationResult:
    """Classify a prompt asynchronously.
    
    Uses the async classify_prompt function from classifier module.
    """
    if not _client:
        # Return default classification if no client
        return ClassificationResult()
    
    return await classify_prompt(prompt, _client, _config)


# Export for testing
def get_app() -> FastAPI:
    """Get the FastAPI application instance."""
    return app
