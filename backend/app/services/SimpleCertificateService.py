import os
from pathlib import Path
from datetime import datetime

class SimpleCertificateService:
    """Service simple pour générer des liens de certificats"""
    
    CERTIFICATES_DIR = "certificates"
    
    @classmethod
    def _ensure_certificates_directory(cls):
        """S'assurer que le dossier des certificats existe"""
        Path(cls.CERTIFICATES_DIR).mkdir(exist_ok=True)
        return cls.CERTIFICATES_DIR
    
    @classmethod
    def generate_certificate_path(cls, issuance_id: int, owner_id: int) -> str:
        """
        Générer simplement un chemin de certificat et créer un fichier PDF factice
        """
        certificates_dir = cls._ensure_certificates_directory()
        
        filename = f"certificate_{issuance_id}_{owner_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(certificates_dir, filename)
        
        try:
            # Contenu PDF minimal valide
            pdf_content = """%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Share Certificate - Test) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000109 00000 n 
0000000158 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
251
%%EOF"""
            
            with open(filepath, 'w') as f:
                f.write(pdf_content)
            
            return filepath
            
        except Exception as e:
            return filepath
    
    @classmethod
    def get_certificate_download_url(cls, certificate_path: str) -> str:
        if not certificate_path:
            return ""
        
        filename = os.path.basename(certificate_path)
        return f"/api/certificates/download/{filename}"
