import pytest
from datetime import datetime, timedelta
from app.crud.audit import audit_crud
from app.models.audit_event import AuditEvent, AuditEventType
from app.schemas.AuditEvent import AuditEventFilter

class TestAuditCRUD:
    """Audit CRUD Tests"""
    
    def test_get_audit_events_no_filters(self, db_session, admin_user):
        """Recovery test without filters"""
        event1 = AuditEvent(
            event_type=AuditEventType.USER_LOGIN.value,
            user_id=admin_user.id,
            ip_address="127.0.0.1"
        )
        event2 = AuditEvent(
            event_type=AuditEventType.SHARE_ISSUED.value,
            user_id=admin_user.id,
            ip_address="127.0.0.1"
        )
        
        db_session.add_all([event1, event2])
        db_session.commit()
        
        filters = AuditEventFilter()
        events = audit_crud.get_audit_events(db_session, filters)
        
        assert len(events) >= 2
        assert events[0].created_at >= events[1].created_at  

    def test_get_audit_events_with_event_type_filter(self, db_session, admin_user):
        """Recovery test with filter by type"""
        event1 = AuditEvent(
            event_type=AuditEventType.USER_LOGIN.value,
            user_id=admin_user.id
        )
        event2 = AuditEvent(
            event_type=AuditEventType.SHARE_ISSUED.value,
            user_id=admin_user.id
        )
        
        db_session.add_all([event1, event2])
        db_session.commit()
        
        filters = AuditEventFilter(event_type=AuditEventType.USER_LOGIN.value)
        events = audit_crud.get_audit_events(db_session, filters)
        
        assert all(event.event_type == AuditEventType.USER_LOGIN.value for event in events)

    def test_get_audit_events_with_date_filter(self, db_session, admin_user):
        """Recovery test with filter by date"""
        yesterday = datetime.utcnow() - timedelta(days=1)
        
       
        old_event = AuditEvent(
            event_type=AuditEventType.USER_LOGIN.value,
            user_id=admin_user.id,
            created_at=yesterday
        )
        
       
        new_event = AuditEvent(
            event_type=AuditEventType.SHARE_ISSUED.value,
            user_id=admin_user.id
        )
        
        db_session.add_all([old_event, new_event])
        db_session.commit()
        
      
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        filters = AuditEventFilter(start_date=today)
        events = audit_crud.get_audit_events(db_session, filters)
        
        assert all(event.created_at >= today for event in events)

    def test_get_audit_stats(self, db_session, admin_user):
        """Recovery test for audit stats"""
       
        events = [
            AuditEvent(event_type=AuditEventType.USER_LOGIN.value, user_id=admin_user.id),
            AuditEvent(event_type=AuditEventType.USER_LOGIN.value, user_id=admin_user.id),
            AuditEvent(event_type=AuditEventType.SHARE_ISSUED.value, user_id=admin_user.id),
        ]
        
        db_session.add_all(events)
        db_session.commit()
        
        stats = audit_crud.get_audit_stats(db_session)
        
        assert "total_events" in stats
        assert "today_events" in stats
        assert "active_users_today" in stats
        assert stats["total_events"] >= 3