from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserCreate
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, SignupRequest
from app.dependencies import get_current_user
from app.utils.auth import verify_password, create_token, decode_token
from app.crud import user as user_crud
from datetime import timedelta
from jose import JWTError, jwt
from app.services.AuditService import AuditService
from app.models.audit_event import AuditEventType
router = APIRouter(prefix="/auth", tags=["Authentication"])
from app.services.AuthService import get_user_with_capital


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Universal login endpoint - works for both admin and shareholders"""
    user = user_crud.get_user_by_email(db, payload.email)
    
    if not user or not verify_password(payload.password, user.hashed_password):
        if user:
            AuditService.log_event(
                db=db,
                event_type="login_failed",
                user_id=user.id,
                details={"reason": "invalid_password"},
                request=request
                
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_token(
        data={
            "user_id": user.id,
            "is_admin": user.is_admin,
            "email": user.email
        },
        expires_delta=timedelta(minutes=30)
    )
    
    refresh_token = create_token(
        data={
            "user_id": user.id,
            "token_type": "refresh"
        },
        expires_delta=timedelta(days=7)
    )
    AuditService.log_login(db, user.id, request, success=True)

    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=1800,  # 30 minutes
        user=UserOut.from_orm(user)
    )

@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, request: Request, db: Session = Depends(get_db)):
    """User registration endpoint - creates new shareholder account"""
    
    print(f"📝 Signup attempt for: {payload.email}")
    
    try:
        # Check if user already exists
        existing_user = user_crud.get_user_by_email(db, payload.email)
        if existing_user:
            print(f"❌ User already exists: {payload.email}")
            
            try:
                AuditService.log_event(
                    db=db,
                    event_type=AuditEventType.USER_CREATED,
                    user_id=None,
                    details={"reason": "email_already_exists", "email": payload.email},
                    request=request
                )
            except Exception as audit_error:
                print(f"Warning: Could not log audit event: {audit_error}")
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Créer UserCreate à partir de SignupRequest (sans confirm_password)
        user_data = UserCreate(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            confirm_password=payload.password  # Utiliser le même mot de passe pour la confirmation
        )
        
        print(f"🔨 Creating user: {user_data.email}")
        
        new_user = user_crud.create_user(db=db, user=user_data, is_admin=False)
        
        print(f"✅ User created successfully: {new_user.email} (ID: {new_user.id})")
        
        # Log user creation
        try:
            AuditService.log_event(
                db=db,
                event_type=AuditEventType.USER_CREATED,
                user_id=new_user.id,
                details={
                    "reason": "self_registration", 
                    "email": new_user.email,
                    "name": new_user.name
                },
                request=request
            )
        except Exception as audit_error:
            print(f"Warning: Could not log audit event: {audit_error}")
        
        # Create tokens for immediate login
        print(f"🎫 Creating tokens for user: {new_user.email}")
        
        access_token = create_token(
            data={
                "user_id": new_user.id,
                "is_admin": new_user.is_admin,
                "email": new_user.email
            },
            expires_delta=timedelta(minutes=30)
        )
        
        refresh_token = create_token(
            data={
                "user_id": new_user.id,
                "token_type": "refresh"
            },
            expires_delta=timedelta(days=7)
        )
        
        print(f"🎉 Signup successful for: {new_user.email}")
        
        # Créer les données utilisateur pour la réponse
        user_data_response = {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800,
            user=UserOut(**user_data_response)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"💥 Error during signup: {e}")
        import traceback
        traceback.print_exc()
        
        # Log failed user creation
        try:
            AuditService.log_event(
                db=db,
                event_type=AuditEventType.USER_CREATED,
                user_id=None,
                details={"reason": "creation_failed", "email": payload.email, "error": str(e)},
                request=request
            )
        except Exception as audit_error:
            print(f"Warning: Could not log audit event: {audit_error}")
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user account: {str(e)}"
        )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        token_data = decode_token(payload.refresh_token)
        
        if token_data.get("token_type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = token_data.get("user_id")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Generate new tokens
        access_token = create_token(
            data={
                "user_id": user.id,
                "is_admin": user.is_admin,
                "email": user.email
            },
            expires_delta=timedelta(minutes=30)
        )
        
        new_refresh_token = create_token(
            data={
                "user_id": user.id,
                "token_type": "refresh"
            },
            expires_delta=timedelta(days=7)
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=1800,
            user=UserOut.from_orm(user)
        )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user),db: Session = Depends(get_db)):
    """Get current authenticated user profile"""
    user_with_capital = get_user_with_capital(db, current_user.id)
    
    if not user_with_capital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserOut(**user_with_capital)

@router.post("/logout")
def logout():
    """Logout endpoint"""
    return {"message": "Successfully logged out"}

@router.post("/validate-token")
def validate_token(current_user: User = Depends(get_current_user)):
    """Validate current token and return user info"""
    return {
        "valid": True,
        "user_id": current_user.id,
        "is_admin": current_user.is_admin,
        "email": current_user.email
    }