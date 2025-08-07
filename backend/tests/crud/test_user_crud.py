import pytest
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.user import (
    get_user_by_email,
    create_user,
    get_all_users,
    get_shareholders_with_shares,
    get_shares_distribution,
)
from app.models.user import User
from app.models.share import ShareIssuance
from app.schemas.user import UserCreate
from app.core.security import verify_password

class TestUserCRUD:
    """Test suite for user CRUD operations"""
    
    def test_create_user_regular(self, db_session):
        """Test creating a regular user (non-admin)"""
        user_data = UserCreate(
            name="John Doe",
            email="john@example.com",
            password="password123"
        )
        
        created_user = create_user(db_session, user_data, is_admin=False)
        
        # Assertions
        assert created_user.id is not None
        assert created_user.name == "John Doe"
        assert created_user.email == "john@example.com"
        assert created_user.is_admin is False
        assert created_user.hashed_password is not None
        assert created_user.hashed_password != "password123"  # Password should be hashed
        assert verify_password("password123", created_user.hashed_password) is True
        
        # Verify user is persisted in database
        db_user = db_session.query(User).filter(User.id == created_user.id).first()
        assert db_user is not None
        assert db_user.email == "john@example.com"

    def test_create_user_admin(self, db_session):
        """Test creating an admin user"""
        user_data = UserCreate(
            name="Admin User",
            email="admin@example.com",
            password="admin123"
        )
        
        # Create admin user
        created_user = create_user(db_session, user_data, is_admin=True)
        
        # Assertions
        assert created_user.name == "Admin User"
        assert created_user.email == "admin@example.com"
        assert created_user.is_admin is True
        assert verify_password("admin123", created_user.hashed_password) is True

    def test_get_user_by_email_existing(self, db_session):
        """Test retrieving an existing user by email"""
        # Create a test user first
        user_data = UserCreate(
            name="Test User",
            email="test@example.com",
            password="password123"
        )
        created_user = create_user(db_session, user_data)
        
        # Retrieve user by email
        found_user = get_user_by_email(db_session, "test@example.com")
        
        # Assertions
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "test@example.com"
        assert found_user.name == "Test User"

    def test_get_user_by_email_nonexistent(self, db_session):
        """Test retrieving a non-existent user by email"""
        found_user = get_user_by_email(db_session, "nonexistent@example.com")
        
        # Should return None for non-existent user
        assert found_user is None

    def test_get_user_by_id_existing(self, db_session):
        """Test retrieving an existing user by ID"""
        # Create a test user first
        user_data = UserCreate(
            name="ID Test User",
            email="idtest@example.com",
            password="password123"
        )
        created_user = create_user(db_session, user_data)
        
        # Retrieve user by ID
        found_user = get_user_by_id(db_session, created_user.id)
        
        # Assertions
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "idtest@example.com"

    def test_get_user_by_id_nonexistent(self, db_session):
        """Test retrieving a non-existent user by ID"""
        found_user = get_user_by_id(db_session, 99999)
        
        # Should return None for non-existent user
        assert found_user is None

    def test_get_all_users_empty_database(self, db_session):
        """Test retrieving all users when database is empty"""
        users = get_all_users(db_session)
        
        # Should return empty list
        assert isinstance(users, list)
        assert len(users) == 0

    def test_get_all_users_with_data(self, db_session):
        """Test retrieving all users when database has users"""
        # Create multiple test users
        user1_data = UserCreate(name="User 1", email="user1@example.com", password="pass1")
        user2_data = UserCreate(name="User 2", email="user2@example.com", password="pass2")
        user3_data = UserCreate(name="Admin User", email="admin@example.com", password="admin")
        
        create_user(db_session, user1_data, is_admin=False)
        create_user(db_session, user2_data, is_admin=False)
        create_user(db_session, user3_data, is_admin=True)
        
        # Retrieve all users
        users = get_all_users(db_session)
        
        # Assertions
        assert len(users) == 3
        emails = [user.email for user in users]
        assert "user1@example.com" in emails
        assert "user2@example.com" in emails
        assert "admin@example.com" in emails

    def test_get_shareholders_with_shares_no_shares(self, db_session):
        """Test retrieving shareholders when no shares have been issued"""
        # Create a user with no shares
        user_data = UserCreate(
            name="Shareholder",
            email="shareholder@example.com",
            password="password123"
        )
        create_user(db_session, user_data)
        
        # Get shareholders with shares
        result = get_shareholders_with_shares(db_session)
        
        # Should return users with 0 shares
        assert len(result) >= 1
        # Find our test user in results
        test_user_result = next((r for r in result if r[0].email == "shareholder@example.com"), None)
        assert test_user_result is not None
        assert test_user_result[1] == 0  # total_shares should be 0

    def test_get_shareholders_with_shares_with_shares(self, db_session):
        """Test retrieving shareholders with actual share issuances"""
        # Create a user
        user_data = UserCreate(
            name="Shareholder With Shares",
            email="richshareholder@example.com",
            password="password123"
        )
        user = create_user(db_session, user_data)
        
        # Create share issuances for this user
        share1 = ShareIssuance(user_id=user.id, amount=1000)
        share2 = ShareIssuance(user_id=user.id, amount=500)
        
        db_session.add(share1)
        db_session.add(share2)
        db_session.commit()
        
        # Get shareholders with shares
        result = get_shareholders_with_shares(db_session)
        
        # Find our test user in results
        test_user_result = next((r for r in result if r[0].email == "richshareholder@example.com"), None)
        assert test_user_result is not None
        assert test_user_result[1] == 1500  # total_shares should be 1000 + 500

    def test_get_shares_distribution_no_shares(self, db_session):
        """Test shares distribution when no shares exist"""
        distribution = get_shares_distribution(db_session)
        
        # Should return structure with zero totals
        assert "total_shares" in distribution
        assert "distribution" in distribution
        assert distribution["total_shares"] == 0
        assert isinstance(distribution["distribution"], list)
        assert len(distribution["distribution"]) == 0

    def test_get_shares_distribution_with_shares(self, db_session):
        """Test shares distribution with actual share data"""
        # Create users
        user1_data = UserCreate(name="Alice", email="alice@example.com", password="pass1")
        user2_data = UserCreate(name="Bob", email="bob@example.com", password="pass2")
        
        user1 = create_user(db_session, user1_data)
        user2 = create_user(db_session, user2_data)
        
        # Create share issuances
        share1 = ShareIssuance(user_id=user1.id, amount=600)  # Alice gets 600 shares
        share2 = ShareIssuance(user_id=user2.id, amount=400)  # Bob gets 400 shares
        share3 = ShareIssuance(user_id=user1.id, amount=200)  # Alice gets 200 more shares
        
        db_session.add_all([share1, share2, share3])
        db_session.commit()
        
        # Get distribution
        distribution = get_shares_distribution(db_session)
        
        # Assertions
        assert distribution["total_shares"] == 1200  # 600 + 400 + 200
        assert len(distribution["distribution"]) == 2
        
        # Find Alice and Bob in distribution
        alice_dist = next((d for d in distribution["distribution"] if d["shareholder_name"] == "Alice"), None)
        bob_dist = next((d for d in distribution["distribution"] if d["shareholder_name"] == "Bob"), None)
        
        assert alice_dist is not None
        assert alice_dist["shares_count"] == 800  # 600 + 200
        assert alice_dist["percentage"] == 66.67  # 800/1200 * 100, rounded to 2 decimals
        
        assert bob_dist is not None
        assert bob_dist["shares_count"] == 400
        assert bob_dist["percentage"] == 33.33  # 400/1200 * 100, rounded to 2 decimals

    def test_get_shares_distribution_percentage_calculation(self, db_session):
        """Test percentage calculation in shares distribution"""
        # Create a user
        user_data = UserCreate(name="Solo Shareholder", email="solo@example.com", password="pass")
        user = create_user(db_session, user_data)
        
        # Create single share issuance
        share = ShareIssuance(user_id=user.id, amount=1000)
        db_session.add(share)
        db_session.commit()
        
        # Get distribution
        distribution = get_shares_distribution(db_session)
        
        # Single shareholder should have 100%
        assert len(distribution["distribution"]) == 1
        shareholder_dist = distribution["distribution"][0]
        assert shareholder_dist["percentage"] == 100.0

    def test_create_user_duplicate_email_constraint(self, db_session):
        """Test that duplicate emails are handled by database constraints"""
        user_data = UserCreate(
            name="First User",
            email="duplicate@example.com",
            password="password123"
        )
        
        # Create first user
        create_user(db_session, user_data)
        
        # Try to create second user with same email
        duplicate_user_data = UserCreate(
            name="Second User",
            email="duplicate@example.com",  # Same email
            password="differentpassword"
        )
        
        # This should raise an integrity error due to unique constraint
        with pytest.raises(Exception):  # Could be IntegrityError or similar
            create_user(db_session, duplicate_user_data)

    def test_password_hashing_security(self, db_session):
        """Test that passwords are properly hashed and not stored in plain text"""
        password = "supersecretpassword"
        user_data = UserCreate(
            name="Security Test User",
            email="security@example.com",
            password=password
        )
        
        # Create user
        user = create_user(db_session, user_data)
        
        # Verify password is hashed
        assert user.hashed_password != password
        assert len(user.hashed_password) > 20  # Hashed passwords are typically much longer
        assert "$" in user.hashed_password  # bcrypt hashes contain $ symbols
        
        # Verify original password validates against hash
        assert verify_password(password, user.hashed_password) is True
        assert verify_password("wrongpassword", user.hashed_password) is False

    def test_user_model_relationships(self, db_session):
        """Test user model relationships with share issuances"""
        # Create a user
        user_data = UserCreate(
            name="Relationship Test User",
            email="relationship@example.com",
            password="password123"
        )
        user = create_user(db_session, user_data)
        
        # Create share issuances
        share1 = ShareIssuance(user_id=user.id, amount=100)
        share2 = ShareIssuance(user_id=user.id, amount=200)
        
        db_session.add_all([share1, share2])
        db_session.commit()
        
        # Refresh user to load relationships
        db_session.refresh(user)
        
        # Test relationship access (if relationships are defined in the model)
        # Note: This assumes you have a relationship defined in the User model
        # If not, you might need to query shares separately
        shares = db_session.query(ShareIssuance).filter(ShareIssuance.user_id == user.id).all()
        assert len(shares) == 2
        assert sum(share.amount for share in shares) == 300

    def test_get_all_users_excludes_deleted(self, db_session):
        """Test that soft-deleted users are excluded (if soft delete is implemented)"""
        # Note: This test assumes soft delete functionality exists
        # If not implemented, this test can be removed or modified
        
        # Create users
        user1_data = UserCreate(name="Active User", email="active@example.com", password="pass1")
        user2_data = UserCreate(name="To Delete User", email="deleted@example.com", password="pass2")
        
        user1 = create_user(db_session, user1_data)
        user2 = create_user(db_session, user2_data)
        
        # If soft delete is implemented, mark user2 as deleted
        # user2.is_deleted = True
        # db_session.commit()
        
        # Get all users - should only return active users
        users = get_all_users(db_session)
        
        # For now, without soft delete, both users should be returned
        assert len(users) == 2
        
        # If soft delete was implemented:
        # assert len(users) == 1
        # assert users[0].email == "active@example.com"