import pytest
from fastapi import status

class TestAuth:
    """Testing authentication features"""
    
    def test_login_success(self, client, admin_user):
        """Connection test passed"""
        response = client.post("/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@test.com"
        assert data["user"]["is_admin"] is True

    def test_login_invalid_credentials(self, client, admin_user):
        """Login test with wrong password"""
        response = client.post("/auth/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Connection test with non-existent user"""
        response = client.post("/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "password"
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_token(self, client, admin_user):
        """Test de refresh token"""
        # Login pour obtenir le refresh token
        login_response = client.post("/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Utiliser le refresh token
        response = client.post("/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_get_current_user(self, client, admin_user, auth_headers_admin):
        """Test retrieving the user profile"""
        response = client.get("/auth/me", headers=auth_headers_admin)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "admin@test.com"
        assert data["is_admin"] is True

    def test_protected_route_without_token(self, client):
        """Test access to a protected route without token"""
        response = client.get("/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_validate_token(self, client, auth_headers_admin):
        """Test token validation"""
        response = client.post("/auth/validate-token", headers=auth_headers_admin)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["valid"] is True
        assert "user_id" in data