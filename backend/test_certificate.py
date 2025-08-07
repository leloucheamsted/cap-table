#!/usr/bin/env python3
"""
Test script pour vérifier la génération des certificats
"""

import sys
import os
sys.path.append('/Users/apple/Documents/Work/cap-table/backend')

from app.services.CertificateService import CertificateService
from app.models.share import ShareIssuance
from app.models.user import User
from datetime import datetime

# Test de base sans base de données
def test_certificate_generation():
    # Créer des objets mock
    class MockUser:
        def __init__(self):
            self.id = 1
            self.name = "John Doe"
            self.email = "john@example.com"
    
    class MockIssuance:
        def __init__(self):
            self.id = 1
            self.amount = 1000
            self.issued_at = datetime.now()
    
    user = MockUser()
    issuance = MockIssuance()
    
    try:
        # Tester la génération du certificat
        certificate_path = CertificateService.generate_certificate(issuance, user)
        print(f"✅ Certificat généré: {certificate_path}")
        
        # Tester l'URL de téléchargement
        download_url = CertificateService.get_certificate_download_url(certificate_path)
        print(f"✅ URL de téléchargement: {download_url}")
        
        # Vérifier que le fichier existe
        if CertificateService.certificate_exists(certificate_path):
            print("✅ Le fichier certificat existe")
        else:
            print("❌ Le fichier certificat n'existe pas")
            
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        return False

if __name__ == "__main__":
    print("Test de génération de certificat...")
    success = test_certificate_generation()
    if success:
        print("✅ Test réussi!")
    else:
        print("❌ Test échoué!")
