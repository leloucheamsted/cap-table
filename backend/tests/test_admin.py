import pytest
from fastapi import status

class TestAdmin:
    """Admin feature testing"""
    
    def test_create_shareholder_success(self, client, admin_user, auth_headers_admin):
        """Test successful shareholder creation"""
        response = client.post("/admin/shareholders", 
            headers=auth_headers_admin,
            json={
                "name": "New Shareholder",
                "email": "shareholder@test.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "New Shareholder"
        assert data["email"] == "shareholder@test.com"
        assert data["is_admin"] is False

    def test_create_shareholder_duplicate_email(self, client, admin_user, regular_user, auth_headers_admin):
        """Test shareholder creation with existing email"""
        response = client.post("/admin/shareholders",
            headers=auth_headers_admin,
            json={
                "name": "Duplicate User",
                "email": "user@test.com",  # Email déjà utilisé
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already exists" in response.json()["detail"]

    def test_issue_shares_success(self, client, admin_user, regular_user, auth_headers_admin):
        """Test successful share issuance"""
        response = client.post("/admin/issuances",
            headers=auth_headers_admin,
            json={
                "user_id": regular_user.id,
                "amount": 1000
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == regular_user.id
        assert data["amount"] == 1000

    def test_issue_shares_nonexistent_user(self, client, admin_user, auth_headers_admin):
        """Testing the issue of shares to a non-existent user"""
        response = client.post("/admin/issuances",
            headers=auth_headers_admin,
            json={
                "user_id": 99999,  # Non-existent ID
                "amount": 1000
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "User with ID 99999 not found" in response.json()["detail"]

    def test_issue_shares_to_admin(self, client, admin_user, auth_headers_admin):
        """Test share issuance to an admin (should fail)"""
        response = client.post("/admin/issuances",
            headers=auth_headers_admin,
            json={
                "user_id": admin_user.id,
                "amount": 1000
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cannot issue shares to admin users" in response.json()["detail"]

    def test_issue_shares_invalid_amount(self, client, admin_user, regular_user, auth_headers_admin):
        """Test share issuance with invalid amount"""
        response = client.post("/admin/issuances",
            headers=auth_headers_admin,
            json={
                "user_id": regular_user.id,
                "amount": -100  # Negative amount
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Share amount must be greater than 0" in response.json()["detail"]

    def test_get_shareholders_list(self, client, admin_user, regular_user, auth_headers_admin):
        """Test successful retrieval of shareholders list"""
        response = client.get("/admin/shareholders", headers=auth_headers_admin)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # Au moins regular_user

    def test_admin_route_access_denied_for_regular_user(self, client, regular_user, auth_headers_user):
        """Test access denied for admin routes for regular user"""
        response = client.get("/admin/shareholders", headers=auth_headers_user)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED