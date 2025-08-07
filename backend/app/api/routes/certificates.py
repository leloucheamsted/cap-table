from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_admin, get_current_user
from app.services.CertificateService import CertificateService
import os

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("/download/{filename}")
def download_certificate(
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  
):
    
    certificate_path = os.path.join(CertificateService.CERTIFICATES_DIR, filename)
    
    if not os.path.exists(certificate_path):
        raise HTTPException(status_code=404, detail="Certificate not found")
    
   
    if not current_user.is_admin:
        
        try:
            parts = filename.replace('.pdf', '').split('_')
            if len(parts) >= 3:
                file_user_id = int(parts[2])
                if file_user_id != current_user.id:
                    raise HTTPException(
                        status_code=403, 
                        detail="You can only download your own certificates"
                    )
            else:
                raise HTTPException(status_code=400, detail="Invalid certificate filename format")
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Invalid certificate filename format")
    
    return FileResponse(
        path=certificate_path,
        filename=filename,
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
