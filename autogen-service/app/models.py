from pydantic import BaseModel
from pydantic import Field, ConfigDict
from pydantic.alias_generators import to_snake
from typing import List, Optional, Dict, Any


class Message(BaseModel):
    role: str
    content: str


class DraftRequest(BaseModel):
    trace_id: str
    fan_context: Dict[str, Any]
    objectives: Dict[str, Any]
    constraints: Dict[str, Any] = {}
    attachments: Optional[List[Dict[str, Any]]] = None
    max_rounds: int = 5


class DraftResponse(BaseModel):
    status: str  # ok | needs_review | error
    session_id: str
    draft: Optional[str] = None
    risk: Optional[Dict[str, Any]] = None
    checkpoints: Optional[List[Dict[str, Any]]] = None


class HumanDecisionRequest(BaseModel):
    decision: str  # approve | reject | edit
    notes: Optional[str] = None
    edited_draft: Optional[str] = None


class WriterReply(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    draft: str = Field(min_length=1)
    rationale: Optional[str] = None
    confidence: Optional[float] = None


class SafeguardInfraction(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    rule_id: str
    severity: str
    reason: Optional[str] = None


class SafeguardReply(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)
    label: str
    infractions: List[SafeguardInfraction] = Field(default_factory=list)
