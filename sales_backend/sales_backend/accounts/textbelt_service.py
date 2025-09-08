import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class TextbeltSMSService:
    """Service d'envoi de SMS via Textbelt API (gratuit)"""
    
    def __init__(self):
        # Textbelt API - 1 SMS gratuit par jour par IP
        self.api_url = "https://textbelt.com/text"
        self.api_key = os.getenv('TEXTBELT_API_KEY', 'textbelt')  # 'textbelt' pour gratuit
        
    def send_invitation_sms(self, phone_number: str, invitation_url: str, contact_name: str) -> bool:
        """Envoie un SMS d'invitation via Textbelt"""
        try:
            # Formater le numéro de téléphone français
            formatted_phone = self.format_phone_number(phone_number)
            
            message_body = f"""🎉 Bonjour {contact_name} !

Vous êtes invité(e) à rejoindre Sales Tracker Pro !

Créez votre compte : {invitation_url}

⏰ Expire dans 7 jours.

Sales Tracker Pro"""
            
            payload = {
                'phone': formatted_phone,
                'message': message_body,
                'key': self.api_key,
            }
            
            response = requests.post(self.api_url, data=payload, timeout=30)
            result = response.json()
            
            if result.get('success'):
                logger.info(f"✅ SMS d'invitation envoyé à {formatted_phone} via Textbelt")
                return True
            else:
                error_msg = result.get('error', 'Erreur inconnue')
                logger.error(f"❌ Erreur Textbelt pour {formatted_phone}: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception lors de l'envoi SMS à {phone_number}: {str(e)}")
            return False
    
    def format_phone_number(self, phone_number: str) -> str:
        """Formate un numéro de téléphone international"""
        # Nettoyer le numéro
        clean_number = ''.join(filter(str.isdigit, phone_number))
        
        # Si le numéro commence déjà par +, le garder tel quel
        if phone_number.startswith('+'):
            return phone_number
        # Si le numéro est déjà au format international (commence par un code pays)
        elif len(clean_number) > 10:
            return f"+{clean_number}"
        # Si le numéro commence par 0 (format national), essayer de deviner le pays
        elif clean_number.startswith('0'):
            # Retirer le 0 initial et laisser l'utilisateur spécifier le code pays
            return f"+{clean_number[1:]}"
        else:
            # Format international direct
            return f"+{clean_number}"

# Instance globale
textbelt_service = TextbeltSMSService()
