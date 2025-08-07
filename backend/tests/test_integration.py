# tests/test_integration.py
import pytest
import uuid
from fastapi import status

class TestIntegration:
    """intégration  test end-to-end"""
    
    def test_complete_shareholder_workflow(self, client, admin_user, auth_headers_admin, db_session):
        """Test complet : création utilisateur -> émission actions -> audit"""
        
        # Générer un email unique pour éviter les conflits
        unique_email = f"integration-{uuid.uuid4().hex[:8]}@test.com"
        
        # 1. Créer un nouvel utilisateur/actionnaire
        create_response = client.post("/admin/shareholders",
            headers=auth_headers_admin,
            json={
                "name": "Integration Test User",
                "email": unique_email,
                "password": "password123",
                "confirm_password": "password123"
            }
        )
        assert create_response.status_code == status.HTTP_200_OK
        new_user = create_response.json()
        
        issue_response = client.post("/admin/issuances",
            headers=auth_headers_admin,
            json={
                "user_id": new_user["id"],
                "amount": 500,
                "owner_id": new_user["id"]
            }
        )
        assert issue_response.status_code == status.HTTP_200_OK
        
        audit_response = client.get("/admin/audit/events", headers=auth_headers_admin)
        assert audit_response.status_code == status.HTTP_200_OK
        
        audit_events = audit_response.json()
        event_types = [event["event_type"] for event in audit_events]
        
        assert "user_created" in event_types
        assert "share_issued" in event_types
        
        stats_response = client.get("/admin/audit/stats", headers=auth_headers_admin)
        assert stats_response.status_code == status.HTTP_200_OK
        
        stats = stats_response.json()
        assert stats["total_events"] >= 2