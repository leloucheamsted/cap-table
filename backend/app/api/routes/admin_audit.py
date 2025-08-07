from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from datetime import datetime 
from app.dependencies import get_current_admin
from app.models.user import User
from app.schemas.AuditEvent import AuditEventOut, AuditEventFilter
from app.crud.audit import audit_crud
from typing import List

router = APIRouter(prefix="/admin/audit", tags=["Admin Audit"])

@router.get("/events", response_model=List[AuditEventOut])
def get_audit_events(
    event_type: str = None,
    user_id: int = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Retrieve audit events with filters"""

    # Conversion des dates
    start_datetime = None
    end_datetime = None
    
    if start_date:
        start_datetime = datetime.fromisoformat(start_date)
    if end_date:
        end_datetime = datetime.fromisoformat(end_date)

    filters = AuditEventFilter(
        event_type=event_type,
        user_id=user_id,
        start_date=start_datetime,
        end_date=end_datetime,
        limit=limit,
        offset=offset
    )

    events = audit_crud.get_audit_events(db, filters)
    return events

@router.get("/recent", response_model=List[AuditEventOut])
def get_recent_audit_events(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Retrieve recent events for the dashboard"""
    return audit_crud.get_recent_audit_events(db, limit)

@router.get("/stats")
def get_audit_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Audit statistics for the admin dashboard"""
    return audit_crud.get_audit_stats(db)