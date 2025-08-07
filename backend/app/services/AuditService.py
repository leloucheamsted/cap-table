from sqlalchemy.orm import Session
from app.models.audit_event import AuditEvent, AuditEventType
from app.schemas.AuditEvent import AuditEventCreate
from typing import Optional, Dict, Any
import json
from fastapi import Request
from datetime import datetime
class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        event_type: AuditEventType,
        user_id: Optional[int] = None,
        target_user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditEvent:
        """Record an audit event"""

        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        audit_event = AuditEvent(
            event_type=event_type,
            user_id=user_id,
            target_user_id=target_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=json.dumps(details) if details else None
        )

        db.add(audit_event)
        db.commit()
        db.refresh(audit_event)

        return audit_event

    @staticmethod
    def log_login(db: Session, user_id: int, request: Request, success: bool = True):
        """Log login attempts"""
        details = {
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        event_type = AuditEventType.USER_LOGIN if success else "login_failed"
        
        return AuditService.log_event(
            db=db,
            event_type=event_type,
            user_id=user_id,
            details=details,
            request=request
        )

    @staticmethod
    def log_share_issuance(
        db: Session, 
        admin_user_id: int, 
        target_user_id: int, 
        shares_amount: int,
        request: Request
    ):
        """Log share issuances"""
        details = {
            "shares_amount": shares_amount,
            "action": "share_issuance",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return AuditService.log_event(
            db=db,
            event_type=AuditEventType.SHARE_ISSUED,
            user_id=admin_user_id,
            target_user_id=target_user_id,
            details=details,
            request=request
        )

    @staticmethod
    def log_user_creation(
        db: Session, 
        admin_user_id: int, 
        created_user_id: int,
        request: Request
    ):
        """Log user creation"""
        details = {
            "action": "user_created",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return AuditService.log_event(
            db=db,
            event_type=AuditEventType.USER_CREATED,
            user_id=admin_user_id,
            target_user_id=created_user_id,
            details=details,
            request=request
        )