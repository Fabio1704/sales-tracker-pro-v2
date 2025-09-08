import pyotp
import qrcode
from io import BytesIO
import base64
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string

class TwoFactorAuth:
    """Gestion de l'authentification à deux facteurs"""
    
    @staticmethod
    def generate_secret_key(user):
        """Génère une clé secrète pour l'utilisateur"""
        secret = pyotp.random_base32()
        
        # Stocker la clé dans le profil utilisateur (à créer un modèle UserProfile)
        # Pour l'instant, on peut utiliser un champ personnalisé
        if not hasattr(user, 'two_factor_secret'):
            # Vous devrez ajouter ce champ au modèle User ou créer un UserProfile
            pass
        
        return secret
    
    @staticmethod
    def generate_qr_code(user, secret):
        """Génère un QR code pour l'authentification 2FA"""
        # Nom de l'application
        app_name = "Sales Tracker"
        
        # URI pour l'authentificateur
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name=app_name
        )
        
        # Générer le QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Créer l'image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir en base64 pour l'affichage web
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{qr_code_base64}"
    
    @staticmethod
    def verify_totp_code(secret, code):
        """Vérifie un code TOTP (Google Authenticator, etc.)"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)  # Fenêtre de 30 secondes
    
    @staticmethod
    def generate_email_code():
        """Génère un code à 6 chiffres pour l'email"""
        return ''.join(random.choices(string.digits, k=6))
    
    @staticmethod
    def send_email_code(user, code):
        """Envoie un code de vérification par email"""
        try:
            subject = "Code de vérification - Sales Tracker"
            message = f"""
Bonjour {user.first_name or user.username},

Votre code de vérification est : {code}

Ce code expire dans 5 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

L'équipe Sales Tracker
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"❌ Erreur envoi email: {e}")
            return False

class EmailVerificationCode:
    """Gestion des codes de vérification par email"""
    
    # Stockage temporaire des codes (en production, utiliser Redis ou base de données)
    _codes = {}
    
    @classmethod
    def generate_and_send_code(cls, user):
        """Génère et envoie un code de vérification"""
        code = TwoFactorAuth.generate_email_code()
        
        # Stocker le code avec expiration
        cls._codes[user.id] = {
            'code': code,
            'expires_at': timezone.now() + timedelta(minutes=5),
            'attempts': 0
        }
        
        # Envoyer par email
        success = TwoFactorAuth.send_email_code(user, code)
        return success
    
    @classmethod
    def verify_code(cls, user, code):
        """Vérifie un code de vérification"""
        if user.id not in cls._codes:
            return False, "Code non trouvé"
        
        stored_data = cls._codes[user.id]
        
        # Vérifier l'expiration
        if timezone.now() > stored_data['expires_at']:
            del cls._codes[user.id]
            return False, "Code expiré"
        
        # Vérifier le nombre de tentatives
        if stored_data['attempts'] >= 3:
            del cls._codes[user.id]
            return False, "Trop de tentatives"
        
        # Vérifier le code
        if stored_data['code'] == code:
            del cls._codes[user.id]
            return True, "Code valide"
        else:
            stored_data['attempts'] += 1
            return False, "Code incorrect"
    
    @classmethod
    def cleanup_expired_codes(cls):
        """Nettoie les codes expirés"""
        now = timezone.now()
        expired_users = [
            user_id for user_id, data in cls._codes.items()
            if now > data['expires_at']
        ]
        
        for user_id in expired_users:
            del cls._codes[user_id]
