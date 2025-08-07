from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Dict, Any
from app.schemas.user import UserOut
import json

class AuditEventBase(BaseModel):
    event_type: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class AuditEventCreate(AuditEventBase):
    user_id: Optional[int] = None
    target_user_id: Optional[int] = None

class AuditEventOut(AuditEventBase):
    id: int
    user_id: Optional[int]
    target_user_id: Optional[int]
    created_at: datetime
    user: Optional[UserOut] = None
    target_user: Optional[UserOut] = None

    class Config:
        from_attributes = True

    @field_validator('details', mode='before')
    @classmethod
    def parse_details(cls, v):
        """Parse JSON string to dict if needed"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return {"raw": v}  # Fallback si le JSON est invalide
        if isinstance(v, dict):
            return v
        return {"value": str(v)}  # Fallback pour autres types

class AuditEventFilter(BaseModel):
    event_type: Optional[str] = None
    user_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 100
    offset: int = 0

    class Config:
        from_attributes = True