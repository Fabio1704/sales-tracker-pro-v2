import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class InternationalSMSService:
    """Service d'envoi de SMS international gratuit via plusieurs APIs"""
    
    def __init__(self):
        # Services SMS gratuits internationaux
        self.services = [
            {
                'name': 'Textbelt',
                'url': 'https://textbelt.com/text',
                'key': 'textbelt',  # Gratuit: 1 SMS/jour/IP
                'international': True
            },
            {
                'name': 'SMS77',
                'url': 'https://gateway.sms77.io/api/sms',
                'key': os.getenv('SMS77_API_KEY', ''),
                'international': True
            },
            {
                'name': 'SMSApi',
                'url': 'https://api.smsapi.com/sms.do',
                'key': os.getenv('SMSAPI_TOKEN', ''),
                'international': True
            }
        ]
    
    def send_invitation_sms(self, phone_number: str, invitation_url: str, contact_name: str) -> bool:
        """Envoie un SMS d'invitation international"""
        
        formatted_phone = self.format_international_phone(phone_number)
        
        message_body = f"""🎉 Hello {contact_name}!

You're invited to join Sales Tracker Pro!

Create your account: {invitation_url}

⏰ Expires in 7 days.

Sales Tracker Pro"""
        
        # Essayer chaque service dans l'ordre
        for service in self.services:
            try:
                if service['name'] == 'Textbelt':
                    success = self._send_via_textbelt(formatted_phone, message_body, service)
                elif service['name'] == 'SMS77' and service['key']:
                    success = self._send_via_sms77(formatted_phone, message_body, service)
                elif service['name'] == 'SMSApi' and service['key']:
                    success = self._send_via_smsapi(formatted_phone, message_body, service)
                else:
                    continue
                    
                if success:
                    logger.info(f"✅ SMS envoyé via {service['name']} à {formatted_phone}")
                    return True
                    
            except Exception as e:
                logger.warning(f"⚠️ Échec {service['name']}: {str(e)}")
                continue
        
        logger.error(f"❌ Échec envoi SMS à {phone_number} - Tous les services ont échoué")
        return False
    
    def _send_via_textbelt(self, phone: str, message: str, service: dict) -> bool:
        """Envoie via Textbelt (gratuit international)"""
        payload = {
            'phone': phone,
            'message': message,
            'key': service['key']
        }
        
        response = requests.post(service['url'], data=payload, timeout=30)
        result = response.json()
        
        return result.get('success', False)
    
    def _send_via_sms77(self, phone: str, message: str, service: dict) -> bool:
        """Envoie via SMS77 (500 SMS gratuits à l'inscription)"""
        # SMS77 utilise parfois la signing key comme API key
        # Essayons les deux formats
        
        # Format 1: Paramètre 'p' (API key standard)
        params = {
            'to': phone,
            'text': message,
            'p': service['key']
        }
        
        try:
            response = requests.post(service['url'], params=params, timeout=30)
            if response.status_code == 100:
                return True
        except:
            pass
        
        # Format 2: Header Authorization (si c'est une signing key)
        headers = {
            'X-API-Key': service['key'],
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'to': phone,
            'text': message
        }
        
        try:
            response = requests.post(service['url'], data=data, headers=headers, timeout=30)
            return response.status_code == 100
        except:
            return False
    
    def _send_via_smsapi(self, phone: str, message: str, service: dict) -> bool:
        """Envoie via SMSApi (500 SMS gratuits)"""
        headers = {
            'Authorization': f'Bearer {service["key"]}'
        }
        
        data = {
            'to': phone,
            'message': message,
            'format': 'json'
        }
        
        response = requests.post(service['url'], data=data, headers=headers, timeout=30)
        result = response.json()
        
        return result.get('count', 0) > 0
    
    def format_international_phone(self, phone_number: str) -> str:
        """Formate un numéro de téléphone pour l'international"""
        # Nettoyer le numéro (garder seulement chiffres et +)
        clean_number = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # Si commence déjà par +, c'est bon
        if clean_number.startswith('+'):
            return clean_number
        
        # Si commence par 00, remplacer par +
        if clean_number.startswith('00'):
            return f"+{clean_number[2:]}"
        
        # Formats nationaux spécifiques par pays
        if clean_number.startswith('0'):
            # Madagascar : 032, 033, 034, 038 -> +261
            if len(clean_number) == 10 and clean_number.startswith(('032', '033', '034', '038')):
                return f"+261{clean_number[1:]}"
            # France : 06, 07 -> +33
            elif len(clean_number) == 10 and clean_number.startswith(('06', '07')):
                return f"+33{clean_number[1:]}"
            else:
                logger.warning(f"⚠️ Format national non reconnu: {phone_number}. Utilisez le format international (+261, +33, etc.)")
                return clean_number
        
        # Sinon, ajouter + au début
        return f"+{clean_number}"

# Instance globale
international_sms_service = InternationalSMSService()
