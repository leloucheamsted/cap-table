from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_
from app.models.audit_event import AuditEvent
from app.schemas.AuditEvent import AuditEventFilter
from typing import List, Optional
from datetime import datetime

class AuditCRUD:
    def get_audit_events(
        self, 
        db: Session, 
        filters: AuditEventFilter
    ) -> List[AuditEvent]:
        """Retrieve audit events with filters"""
        
        query = db.query(AuditEvent).options(
            joinedload(AuditEvent.user),
            joinedload(AuditEvent.target_user)
        )

        # Appliquer les filtres
        if filters.event_type:
            query = query.filter(AuditEvent.event_type == filters.event_type)
        
        if filters.user_id:
            query = query.filter(AuditEvent.user_id == filters.user_id)
        
        if filters.start_date:
            query = query.filter(AuditEvent.created_at >= filters.start_date)
        
        if filters.end_date:
            query = query.filter(AuditEvent.created_at <= filters.end_date)

        # Tri par date décroissante
        query = query.order_by(desc(AuditEvent.created_at))
        
        # Pagination
        query = query.offset(filters.offset).limit(filters.limit)
        
        return query.all()

    def get_recent_audit_events(self, db: Session, limit: int = 10) -> List[AuditEvent]:
        """Retrieves recent events for the dashboard"""
        return db.query(AuditEvent).options(
            joinedload(AuditEvent.user),
            joinedload(AuditEvent.target_user)
        ).order_by(desc(AuditEvent.created_at)).limit(limit).all()

    def get_audit_stats(self, db: Session) -> dict:
        """Audit statistics for the dashboard"""
        from sqlalchemy import func

        today = datetime.utcnow().date()
        today_events = db.query(
            AuditEvent.event_type,
            func.count(AuditEvent.id).label('count')
        ).filter(
            func.date(AuditEvent.created_at) == today
        ).group_by(AuditEvent.event_type).all()

        total_events = db.query(func.count(AuditEvent.id)).scalar()

        active_users_today = db.query(
            func.count(func.distinct(AuditEvent.user_id))
        ).filter(
            func.date(AuditEvent.created_at) == today
        ).scalar()

        return {
            "total_events": total_events,
            "today_events": dict(today_events),
            "active_users_today": active_users_today
        }

audit_crud = AuditCRUD()