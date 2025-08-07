from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models.user import User
from app.models.share import ShareIssuance
from app.schemas.user import UserCreate, UserOut, AdminLogin  
from app.schemas.share import ShareIssuanceCreate, ShareIssuanceOut, ShareIssuanceWithOwner, ShareholderWithShares, ShareDistributionResponse
from app.crud import user as user_crud, share as share_crud 
from app.dependencies import get_db, get_current_admin
from app.utils.auth import verify_password, create_token
from datetime import timedelta
from app.services.DilutionService import DilutionService 
from app.models.audit_event import AuditEventType
from app.services.CertificateService import CertificateService

from app.services.AuditService import AuditService
router = APIRouter(prefix="/admin", tags=["Admin"])



@router.post("/shareholders", response_model=UserOut)
def add_shareholder(user: UserCreate, request: Request, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    db_user = user_crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    try:
        new_user = user_crud.create_user(db, user, is_admin=False)
        AuditService.log_user_creation(db, current_admin.id, new_user.id, request)
        return new_user
    except IntegrityError:
        # Capture l'erreur de contrainte d'unicité de la base de données
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already exists")
    
    return new_user

@router.get("/shareholders", response_model=list[UserOut])
def list_shareholders(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return user_crud.get_all_users(db)

@router.post("/issuances", response_model=ShareIssuanceWithOwner)
def issue_shares(
    issuance: ShareIssuanceCreate, 
    request: Request,
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin)
):
    target_user = user_crud.get_user_by_id(db, issuance.owner_id)
    if not target_user:
        raise HTTPException(
            status_code=404, 
            detail=f"User with ID {issuance.owner_id} not found"
        )
    
    if target_user.is_admin:
        raise HTTPException(
            status_code=400, 
            detail="Cannot issue shares to admin users"
        )
    
    if issuance.amount <= 0:
        raise HTTPException(
            status_code=400, 
            detail="Share amount must be greater than 0"
        )
    
    MAX_SHARES_PER_ISSUANCE = 10_000_000
    if issuance.amount > MAX_SHARES_PER_ISSUANCE:
        raise HTTPException(
            status_code=400, 
            detail=f"Share amount exceeds maximum limit of {MAX_SHARES_PER_ISSUANCE:,}"
        )

    try:
        dilution_data = DilutionService.calculate_dilution_impact(
            db=db,
            new_owner_id=issuance.owner_id,
            new_shares_amount=issuance.amount
        )
        
        new_issuance = share_crud.issue_shares(db, issuance)
        
        DilutionService.log_dilution_event(
            db=db,
            admin_user_id=current_admin.id,
            dilution_data=dilution_data,
            issuance_id=new_issuance.id,
            request=request
        )
        
        try:
            AuditService.log_event(
                db=db,
                event_type=AuditEventType.SHARE_ISSUED,
                user_id=current_admin.id,
                target_user_id=issuance.owner_id,
                details={
                    "action": "share_issuance_with_dilution",
                    "shares_amount": issuance.amount,
                    "target_user_email": target_user.email,
                    "issuance_id": new_issuance.id,
                    "dilution_summary": {
                        "total_shares_before": dilution_data["before_issuance"]["total_shares"],
                        "total_shares_after": dilution_data["after_issuance"]["total_shares"],
                        "shareholders_affected": len(dilution_data["dilution_impact"]["existing_shareholders_dilution"]),
                        "average_dilution_percentage": dilution_data["summary"]["average_dilution_per_shareholder"]
                    }
                },
                request=request
            )
        except Exception as audit_error:
            print(f"Warning: Could not log audit event: {audit_error}")

      
        complete_issuance = share_crud.get_issuance_with_owner(db, new_issuance.id)
        
        return complete_issuance
        
    except Exception as e:
        try:
            AuditService.log_event(
                db=db,
                event_type=AuditEventType.SHARE_ISSUANCE_FAILED,
                user_id=current_admin.id,
                target_user_id=issuance.owner_id,
                details={
                    "error": str(e),
                    "attempted_amount": issuance.amount,
                    "reason": "database_error",
                    "action": "share_issuance_failed"
                },
                request=request
            )
        except Exception as audit_error:
            print(f"Warning: Could not log audit event: {audit_error}")
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to issue shares: {str(e)}"
        )

@router.get("/issuances", response_model=list[ShareIssuanceWithOwner])
def list_issuances(db: Session = Depends(get_db),current_admin: User = Depends(get_current_admin)):
    return share_crud.get_all_issuances_with_owners(db)

@router.post("/issuances/{issuance_id}/certificate")
def generate_certificate_for_issuance(
    issuance_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Générer un certificat pour une émission d'actions existante
    """
    issuance = db.query(ShareIssuance).filter(ShareIssuance.id == issuance_id).first()
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance not found")
    
    owner = db.query(User).filter(User.id == issuance.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    try:
        from app.utils.pdf_generator import generate_share_certificate
        
        certificate_path = generate_share_certificate(
            shareholder_name=owner.name,
            num_shares=issuance.amount,
            issuance_date=issuance.issued_at,
            certificate_id=issuance_id
        )
        
        issuance.certificate_path = certificate_path
        db.commit()
        
        import os
        filename = os.path.basename(certificate_path)
        download_url = f"/certificates/{filename}"
        
        return {
            "message": "Certificate generated successfully",
            "certificate_path": certificate_path,
            "download_url": download_url,
            "issuance_id": issuance_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate certificate: {str(e)}"
        )

@router.get("/issuances/{issuance_id}/certificate/download")
def download_certificate_for_issuance(
    issuance_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Télécharger directement le certificat d'une émission d'actions
    """
    from app.utils.pdf_generator import generate_share_certificate
    
    # Récupérer l'émission avec le propriétaire
    issuance = db.query(ShareIssuance).filter(ShareIssuance.id == issuance_id).first()
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance not found")
    
    owner = db.query(User).filter(User.id == issuance.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    try:
        # Générer le certificat
        certificate_path = generate_share_certificate(
            shareholder_name=owner.name,
            num_shares=issuance.amount,
            issuance_date=issuance.issued_at,
            certificate_id=issuance_id
        )
        
        return FileResponse(
            path=certificate_path,
            filename=f"share_certificate_{issuance_id}_{owner.name.replace(' ', '_')}.pdf",
            media_type="application/pdf"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download certificate: {str(e)}"
        )

@router.get("/test-certificate")
def test_certificate_generation(current_admin: User = Depends(get_current_admin)):
    """
    Endpoint de test pour vérifier la génération de certificats
    """
    try:
        class MockUser:
            def __init__(self):
                self.id = 999
                self.name = "Test User"
                self.email = "test@example.com"
        
        class MockIssuance:
            def __init__(self):
                self.id = 999
                self.amount = 1000
                self.issued_at = datetime.now()
        
        from datetime import datetime
        
        mock_user = MockUser()
        mock_issuance = MockIssuance()
        
        certificate_path = CertificateService.generate_certificate(mock_issuance, mock_user)
        download_url = CertificateService.get_certificate_download_url(certificate_path)
        
        return {
            "message": "Test certificate generated successfully",
            "certificate_path": certificate_path,
            "download_url": download_url,
            "file_exists": CertificateService.certificate_exists(certificate_path)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate test certificate: {str(e)}"
        )

@router.get("/shareholders/summary", response_model=list[ShareholderWithShares])
def list_shareholders_with_shares(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """List all shareholders with their total number of shares"""
    shareholders = user_crud.get_shareholders_with_shares(db)
    
    return [
        ShareholderWithShares(
            id=shareholder.User.id,
            name=shareholder.User.name,
            email=shareholder.User.email,
            total_shares=shareholder.total_shares,
            created_at=shareholder.User.created_at
        )
        for shareholder in shareholders
    ]
@router.get("/shares/distribution", response_model=ShareDistributionResponse)
def get_shares_distribution(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Obtain the distribution of shares among shareholders
    Returns the formatted data for a pie chart
    """
    return share_crud.get_shares_distribution(db)

@router.post("/issuances/preview-dilution")
def preview_dilution_impact(
    preview_data: dict,  # {"owner_id": int, "amount": int}
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Prévisualiser l'impact de dilution avant d'émettre les actions
    """
    try:
        owner_id = preview_data.get("owner_id")
        amount = preview_data.get("amount")
        
        if not owner_id or not amount:
            raise HTTPException(
                status_code=400, 
                detail="owner_id and amount are required"
            )
        
        target_user = user_crud.get_user_by_id(db, owner_id)
        if not target_user:
            raise HTTPException(
                status_code=404, 
                detail=f"User with ID {owner_id} not found"
            )
        
        dilution_data = DilutionService.calculate_dilution_impact(
            db=db,
            new_owner_id=owner_id,
            new_shares_amount=amount
        )
        
        return {
            "preview": True,
            "target_user": {
                "id": target_user.id,
                "name": target_user.name,
                "email": target_user.email
            },
            "proposed_issuance": {
                "amount": amount,
                "owner_id": owner_id
            },
            **dilution_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate dilution preview: {str(e)}"
        )