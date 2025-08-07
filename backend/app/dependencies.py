from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.utils.auth import decode_token
from app.models.user import User
from sqlalchemy.orm import Session
from app.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
def get_current_shareholder(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload["user_id"], User.role == "shareholder").first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user")
    return user

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload["user_id"], User.is_admin == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user")
    return user

# get current user 

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user (admin or shareholder)"""
    try:
        payload = decode_token(token)
        if not payload or "user_id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
        user_id = payload["user_id"]
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
        
    except Exception as e:
        print(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_current_shareholder(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current shareholder user (non-admin)"""
    try:
        payload = decode_token(token)
        if not payload or "user_id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
        user_id = payload["user_id"]
        user = db.query(User).filter(
            User.id == user_id,
            User.is_admin == False  
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Shareholder access required"
            )
        return user
        
    except HTTPException:
      
        raise
    except Exception as e:
        print(f"Shareholder token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )