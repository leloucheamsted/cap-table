import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_db, Base
from app.models.user import User
from app.models.audit_event import AuditEvent
from app.models.share import ShareIssuance
from app.core.security import hash_password 
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def db_engine():
    """Fixture to create the database engine for tests"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Database session for each test"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI test client"""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="function")
def admin_user(db_session):
    """Admin user for tests"""
    # Vérifier d'abord si l'utilisateur existe déjà
    existing_admin = db_session.query(User).filter(User.email == "admin@test.com").first()
    if existing_admin:
        return existing_admin
        
    admin = User(
        email="admin@test.com",
        name="Admin Test",
        hashed_password=hash_password("admin123"),
        is_admin=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture(scope="function")
def regular_user(db_session):
    """Regular user for tests"""
    # Vérifier d'abord si l'utilisateur existe déjà
    existing_user = db_session.query(User).filter(User.email == "user@test.com").first()
    if existing_user:
        return existing_user
        
    user = User(
        email="user@test.com",
        name="User Test",
        hashed_password=hash_password("user123"),
        is_admin=False
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_token(client, admin_user):
    """Admin authentication token"""
    response = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    return response.json()["access_token"]

@pytest.fixture
def user_token(client, regular_user):
    """User authentication token"""
    response = client.post("/auth/login", json={
        "email": "user@test.com",
        "password": "user123"
    })
    return response.json()["access_token"]

@pytest.fixture
def auth_headers_admin(admin_token):
    """Headers with admin token"""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def auth_headers_user(user_token):
    """Headers with user token"""
    return {"Authorization": f"Bearer {user_token}"}