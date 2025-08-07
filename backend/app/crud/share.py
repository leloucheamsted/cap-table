from app.models.user import User
from sqlalchemy.orm import Session
from app.models.share import ShareIssuance
from app.schemas.share import ShareDistributionItem, ShareDistributionResponse, ShareIssuanceCreate
from datetime import datetime
from sqlalchemy import func
from app.services.CertificateService import CertificateService
from app.services.SimpleCertificateService import SimpleCertificateService

def issue_shares(db: Session, issuance: ShareIssuanceCreate):
    """
    Émettre des actions et générer automatiquement le certificat
    """
    db_issuance = ShareIssuance(
        user_id=issuance.owner_id,  
        owner_id=issuance.owner_id,
        amount=issuance.amount,
        issued_at=datetime.utcnow()
    )
    db.add(db_issuance)
    db.commit()
    db.refresh(db_issuance)
    
    owner = db.query(User).filter(User.id == issuance.owner_id).first()
    
    if owner:
        try:
            
            certificate_path = CertificateService.generate_certificate(db_issuance, owner)
            
            db_issuance.certificate_path = certificate_path
            db.commit()
            db.refresh(db_issuance)
            
        except Exception as e:
            print(f"Warning: Could not generate certificate: {e}")
            try:
                certificate_path = SimpleCertificateService.generate_certificate_path(db_issuance.id, owner.id)
                db_issuance.certificate_path = certificate_path
                db.commit()
                db.refresh(db_issuance)
                print(f"Generated simple certificate: {certificate_path}")
            except Exception as e2:
                print(f"Simple certificate also failed: {e2}")
                db_issuance.certificate_path = f"certificates/certificate_{db_issuance.id}_{owner.id}_temp.pdf"
                db.commit()
                db.refresh(db_issuance)
    
    return db_issuance

def get_issuance_with_owner(db: Session, issuance_id: int):
    """Get a single issuance with owner information and download URL"""
    issuance = db.query(ShareIssuance).join(User, ShareIssuance.owner_id == User.id).filter(ShareIssuance.id == issuance_id).first()
    
    if issuance:
        if hasattr(issuance, 'certificate_path') and issuance.certificate_path:
            try:
                issuance.certificate_download_url = CertificateService.get_certificate_download_url(issuance.certificate_path)
            except:
                issuance.certificate_download_url = SimpleCertificateService.get_certificate_download_url(issuance.certificate_path)
        else:
            issuance.certificate_download_url = None
    
    return issuance

def get_all_issuances(db: Session):
    return db.query(ShareIssuance).all()

def get_all_issuances_with_owners(db: Session):
    """Get all share issuances with owner information and download URLs"""
    issuances = db.query(ShareIssuance).join(User, ShareIssuance.owner_id == User.id).all()
    
    for issuance in issuances:
        if hasattr(issuance, 'certificate_path') and issuance.certificate_path:
            try:
                issuance.certificate_download_url = CertificateService.get_certificate_download_url(issuance.certificate_path)
            except:
                issuance.certificate_download_url = SimpleCertificateService.get_certificate_download_url(issuance.certificate_path)
        else:
            issuance.certificate_download_url = None
    
    return issuances

def get_shares_distribution(db: Session) -> ShareDistributionResponse:
    """Get the distribution of shares among shareholders for pie chart"""
    total_shares = db.query(func.sum(ShareIssuance.amount)).scalar() or 0
    
    distribution_query = db.query(
        User.name,
        func.sum(ShareIssuance.amount).label('shares_count')
    ).join(
        ShareIssuance, User.id == ShareIssuance.owner_id  
    ).filter(
        User.is_admin == False  
    ).group_by(
        User.id, User.name
    ).all()
    
    distribution_items = []
    for item in distribution_query:
        percentage = round((item.shares_count / total_shares * 100), 2) if total_shares > 0 else 0
        distribution_items.append(
            ShareDistributionItem(
                shareholder_name=item.name,
                shares_count=item.shares_count,
                percentage=percentage
            )
        )
    
    return ShareDistributionResponse(
        total_shares=total_shares,
        distribution=distribution_items
    )

