from pydantic import BaseModel
import os


class Settings(BaseModel):
    # URLs services
    LLM_PROXY_URL: str = os.getenv(
        "LLM_PROXY_URL", "https://app.huntaze.com/api/internal/llm"
    )
    NEXTJS_WEBHOOK_URL: str = os.getenv(
        "NEXTJS_WEBHOOK_URL", "https://app.huntaze.com/api/internal/autogen/events"
    )

    # Sécurité webhook
    AUTOGEN_HMAC_SECRET: str = os.getenv("AUTOGEN_HMAC_SECRET", "change-me")

    # DynamoDB
    DDB_REGION: str = os.getenv("DDB_REGION", "us-east-1")
    DDB_TABLE_SESSIONS: str = os.getenv("DDB_TABLE_SESSIONS", "ai_sessions")
    DDB_TABLE_MESSAGES: str = os.getenv("DDB_TABLE_MESSAGES", "ai_session_messages")
    DDB_TABLE_ARTIFACTS: str = os.getenv("DDB_TABLE_ARTIFACTS", "ai_session_artifacts")

    # Chat
    MAX_ROUNDS: int = int(os.getenv("AUTOGEN_MAX_ROUNDS", "5"))
    QUALITY_THRESHOLD: float = float(os.getenv("QUALITY_THRESHOLD", "0.7"))
    REVIEW_THRESHOLD: int = int(os.getenv("REVIEW_THRESHOLD", "70"))
    BLOCK_THRESHOLD: int = int(os.getenv("BLOCK_THRESHOLD", "90"))
    TTL_DAYS: int = int(os.getenv("AUTOGEN_TTL_DAYS", "30"))

    # Cosmos DB (optional migration target)
    COSMOS_ENDPOINT: str | None = os.getenv("COSMOS_ENDPOINT")
    COSMOS_KEY: str | None = os.getenv("COSMOS_KEY")
    COSMOS_DB: str = os.getenv("COSMOS_DB", "huntaze")
    COSMOS_CONTAINER_SESSIONS: str = os.getenv("COSMOS_CONTAINER_SESSIONS", "ai_sessions")
    COSMOS_CONTAINER_MESSAGES: str = os.getenv("COSMOS_CONTAINER_MESSAGES", "ai_session_messages")
    COSMOS_CONTAINER_ARTIFACTS: str = os.getenv("COSMOS_CONTAINER_ARTIFACTS", "ai_session_artifacts")


settings = Settings()
