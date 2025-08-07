import pytest
from fastapi import status
from app.crud.audit import audit_crud
from app.models.audit_event import AuditEvent, AuditEventType

class TestAudit:
    """Audit system tests"""
    
    def test_login_creates_audit_event(self, client, admin_user, db_session):
        """Test that the connection creates an audit event"""
        initial_count = db_session.query(AuditEvent).count()
        
        response = client.post("/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        
        assert response.status_code == status.HTTP_200_OK
        
        # Vérifier qu'un événement d'audit a été créé
        final_count = db_session.query(AuditEvent).count()
        assert final_count == initial_count + 1
        
        # Vérifier le contenu de l'événement
        audit_event = db_session.query(AuditEvent).order_by(AuditEvent.created_at.desc()).first()
        assert audit_event.event_type == AuditEventType.USER_LOGIN.value
        assert audit_event.user_id == admin_user.id

    def test_failed_login_creates_audit_event(self, client, admin_user, db_session):
        """Test that failed login creates an audit event"""
        initial_count = db_session.query(AuditEvent).count()
        
        response = client.post("/auth/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Vérifier qu'un événement d'audit a été créé
        final_count = db_session.query(AuditEvent).count()
        assert final_count == initial_count + 1
        
        audit_event = db_session.query(AuditEvent).order_by(AuditEvent.created_at.desc()).first()
        assert audit_event.event_type == "login_failed"
        assert audit_event.user_id == admin_user.id

    def test_share_issuance_creates_audit_event(self, client, admin_user, regular_user, auth_headers_admin, db_session):
        """Test that the issuance of shares creates an audit event"""
        initial_count = db_session.query(AuditEvent).count()
        
        response = client.post("/admin/issuances",
            headers=auth_headers_admin,
            json={
                "user_id": regular_user.id,
                "amount": 1000,
                "owner_id": regular_user.id
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Vérifier qu'au moins un événement d'audit a été créé
        final_count = db_session.query(AuditEvent).count()
        assert final_count >= initial_count + 1
        
        # Vérifier qu'il y a un événement SHARE_ISSUED
        share_issued_events = db_session.query(AuditEvent).filter(
            AuditEvent.event_type == AuditEventType.SHARE_ISSUED.value,
            AuditEvent.user_id == admin_user.id,
            AuditEvent.target_user_id == regular_user.id
        ).all()
        assert len(share_issued_events) >= 1

    def test_get_audit_events(self, client, admin_user, auth_headers_admin):
        """Audit Event Recovery Test"""
        response = client.get("/admin/audit/events", headers=auth_headers_admin)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_get_audit_stats(self, client, admin_user, auth_headers_admin):
        """Audit Statistics Recovery Test"""
        response = client.get("/admin/audit/stats", headers=auth_headers_admin)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_events" in data
        assert "today_events" in data
        assert "active_users_today" in data

    def test_audit_events_filtering(self, client, admin_user, auth_headers_admin):
        """Audit Event Filtering Test"""
        response = client.get(
            "/admin/audit/events?event_type=user_login&limit=5",
            headers=auth_headers_admin
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5