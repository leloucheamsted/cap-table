from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.share import ShareholderLogin, ShareholderResponse, ShareIssuanceResponse
from app.models.share import ShareIssuance
from app.models.user import User
from app.dependencies import get_db, get_current_shareholder
from app.utils.auth import verify_password
from fastapi.responses import FileResponse
from app.utils.pdf_generator import generate_share_certificate
import os
router = APIRouter(prefix="/shareholder", tags=["Shareholder"])


@router.get("/issuances", response_model=list[ShareIssuanceResponse])
def get_issuances(db: Session = Depends(get_db), current_user: User = Depends(get_current_shareholder)):
    issuances = db.query(ShareIssuance).filter(ShareIssuance.owner_id == current_user.id).all()
    return issuances

@router.get("/certificate/{issuance_id}")
def download_certificate(issuance_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_shareholder)):
    issuance = db.query(ShareIssuance).filter(
        ShareIssuance.id == issuance_id, 
        ShareIssuance.owner_id == current_user.id
    ).first()
    if not issuance:
        raise HTTPException(status_code=404, detail="Issuance not found")
    
    certificate_path = generate_share_certificate(
        shareholder_name=current_user.name,
        num_shares=issuance.amount,
        issuance_date=issuance.issued_at,
        certificate_id=issuance_id
    )
    
    # Return PDF file
    return FileResponse(
        path=certificate_path,
        filename=f"share_certificate_{issuance_id}.pdf",
        media_type="application/pdf"
    )

@router.get("/dashboard")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_shareholder)
):
    """Get dashboard data for shareholder"""
    from sqlalchemy import func
    
    total_shares = db.query(func.sum(ShareIssuance.amount)).filter(
        ShareIssuance.owner_id == current_user.id
    ).scalar() or 0
    
    total_issuances = db.query(func.count(ShareIssuance.id)).filter(
        ShareIssuance.owner_id == current_user.id
    ).scalar() or 0
    
    total_value = db.query(
        func.sum(ShareIssuance.amount * 1000)
    ).filter(
        ShareIssuance.owner_id == current_user.id
    ).scalar() or 0.0
    
    recent_issuances = db.query(ShareIssuance).filter(
        ShareIssuance.owner_id == current_user.id
    ).order_by(ShareIssuance.issued_at.desc()).limit(5).all()
    
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email
        },
        "statistics": {
            "total_shares": total_shares,
            "total_issuances": total_issuances,
            "total_value": total_value
        },
        "recent_issuances": [
            {
                "id": issuance.id,
                "amount": issuance.amount,
                "issued_at": issuance.issued_at,
                "certificate_available": issuance.certificate_path is not None
            }
            for issuance in recent_issuances
        ]
    }