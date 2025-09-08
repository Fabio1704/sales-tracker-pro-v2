import os
from django.conf import settings
from twilio.rest import Client
import logging

logger = logging.getLogger(__name__)

class SMSService:
    """Service d'envoi de SMS via Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.dev_mode = os.getenv('SMS_DEV_MODE', 'true').lower() == 'true'
        
        if self.dev_mode:
            logger.info("🔧 Mode développement SMS activé - Les SMS ne seront pas envoyés réellement")
            self.client = None
        elif self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio non configuré - Mode développement activé par défaut")
    
    def send_invitation_sms(self, phone_number, invitation_url, contact_name):
        """Envoie un SMS d'invitation"""
        if not self.client:
            logger.error("Twilio non configuré - impossible d'envoyer le SMS")
            return False
        
        try:
            # Formater le numéro de téléphone (ajouter +33 si nécessaire)
            formatted_phone = self.format_phone_number(phone_number)
            
            message_body = f"""
🎉 Bonjour {contact_name} !

Vous êtes invité(e) à rejoindre Sales Tracker Pro !

Créez votre compte sécurisé en cliquant sur ce lien :
{invitation_url}

⏰ Cette invitation expire dans 7 jours.

Merci de votre confiance !
Sales Tracker Pro
            """.strip()
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=formatted_phone
            )
            
            logger.info(f"SMS d'invitation envoyé à {formatted_phone} - SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi SMS à {phone_number}: {str(e)}")
            return False
    
    def format_phone_number(self, phone_number):
        """Formate le numéro de téléphone pour Twilio"""
        # Supprimer tous les espaces et caractères spéciaux
        phone = ''.join(filter(str.isdigit, phone_number))
        
        # Si le numéro commence par 0, remplacer par +33
        if phone.startswith('0'):
            phone = '+33' + phone[1:]
        # Si le numéro ne commence pas par +, ajouter +33
        elif not phone.startswith('+'):
            phone = '+33' + phone
        
        return phone
    
    def send_2fa_sms(self, phone_number, code):
        """Envoie un code 2FA par SMS"""
        if not self.client:
            logger.error("Twilio non configuré - impossible d'envoyer le SMS 2FA")
            return False
        
        try:
            formatted_phone = self.format_phone_number(phone_number)
            
            message_body = f"""
🔐 Code de vérification Sales Tracker Pro

Votre code de sécurité : {code}

Ce code expire dans 5 minutes.
Ne le partagez avec personne.

Sales Tracker Pro
            """.strip()
            
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=formatted_phone
            )
            
            logger.info(f"SMS 2FA envoyé à {formatted_phone} - SID: {message.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi SMS 2FA à {phone_number}: {str(e)}")
            return False

# Instance globale du service SMS
sms_service = SMSService()
