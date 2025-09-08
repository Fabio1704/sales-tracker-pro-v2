#!/usr/bin/env python3
"""
Script de test pour SMS77 API
Usage: python test_sms77.py
"""

import os
import sys
import django
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.append(str(Path(__file__).parent))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sales_backend.settings')
django.setup()

from accounts.international_sms_service import international_sms_service

def test_sms77():
    """Test de l'envoi SMS via SMS77"""
    
    print("🧪 Test SMS77 API")
    print("=" * 50)
    
    # Vérifier la configuration
    sms77_key = os.getenv('SMS77_API_KEY')
    if not sms77_key:
        print("❌ SMS77_API_KEY non configuré dans .env")
        print("Ajoutez: SMS77_API_KEY=votre_cle_api")
        return False
    
    print(f"✅ SMS77_API_KEY configuré: {sms77_key[:10]}...")
    
    # Demander le numéro de test
    phone_number = input("\n📱 Entrez votre numéro de téléphone (format international +33612345678): ")
    if not phone_number.startswith('+'):
        print("⚠️ Format recommandé: +33612345678")
    
    # Test d'envoi
    print(f"\n📤 Envoi SMS de test à {phone_number}...")
    
    success = international_sms_service.send_invitation_sms(
        phone_number=phone_number,
        invitation_url="http://localhost:3000/test-invitation",
        contact_name="Test User"
    )
    
    if success:
        print("✅ SMS envoyé avec succès !")
        print("📱 Vérifiez votre téléphone")
    else:
        print("❌ Échec de l'envoi SMS")
        print("💡 Vérifiez votre clé API et votre crédit SMS77")
    
    return success

if __name__ == "__main__":
    test_sms77()
