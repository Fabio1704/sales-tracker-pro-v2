import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class FreeMobileSMSService:
    """Service d'envoi de SMS via Free Mobile API (gratuit pour abonnés Free)"""
    
    def __init__(self):
        # Free Mobile API - Gratuit pour les abonnés Free
        self.user_id = os.getenv('FREE_MOBILE_USER')
        self.api_key = os.getenv('FREE_MOBILE_KEY')
        self.api_url = "https://smsapi.free-mobile.fr/sendmsg"
        
    def send_invitation_sms(self, phone_number: str, invitation_url: str, contact_name: str) -> bool:
        """Envoie un SMS d'invitation via Free Mobile API"""
        if not self.user_id or not self.api_key:
            logger.error("❌ Free Mobile non configuré - Ajoutez FREE_MOBILE_USER et FREE_MOBILE_KEY")
            return False
            
        try:
            message_body = f"""🎉 Bonjour {contact_name} !

Vous êtes invité(e) à rejoindre Sales Tracker Pro !

Créez votre compte : {invitation_url}

⏰ Expire dans 7 jours.

Sales Tracker Pro"""
            
            params = {
                'user': self.user_id,
                'pass': self.api_key,
                'msg': message_body,
            }
            
            response = requests.get(self.api_url, params=params, timeout=30)
            
            if response.status_code == 200:
                logger.info(f"✅ SMS d'invitation envoyé à {phone_number} via Free Mobile")
                return True
            else:
                logger.error(f"❌ Erreur Free Mobile ({response.status_code}): {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception lors de l'envoi SMS à {phone_number}: {str(e)}")
            return False

# Instance globale
free_mobile_service = FreeMobileSMSService()
