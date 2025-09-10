from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
import secrets
import logging
from datetime import timedelta

from .models import ClientInvitation
from .sms_service import sms_service
from .textbelt_service import textbelt_service
from .free_mobile_service import free_mobile_service
from .international_sms_service import international_sms_service
from .validators_simple import validate_email_simple

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_contact_invitation(request):
    """Crée une invitation à partir d'une demande de contact"""
    
    try:
        data = request.data
        
        # Validation des données requises
        required_fields = ['contact_name', 'contact_subject', 'contact_message', 'invitation_type']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'Le champ {field} est requis'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        invitation_type = data.get('invitation_type')
        if invitation_type not in ['email', 'sms']:
            return Response({
                'error': 'Type d\'invitation invalide (email ou sms)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation selon le type
        if invitation_type == 'email':
            contact_email = data.get('contact_email')
            if not contact_email:
                return Response({
                    'error': 'Email requis pour invitation par email'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Valider l'email
            try:
                validate_email_simple(contact_email)
            except Exception as e:
                return Response({
                    'error': f'Email invalide: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            contact_phone = None
            
        elif invitation_type == 'sms':
            contact_phone = data.get('contact_phone')
            if not contact_phone:
                return Response({
                    'error': 'Numéro de téléphone requis pour invitation par SMS'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Valider le numéro de téléphone international
            phone_clean = ''.join(filter(str.isdigit, contact_phone.replace('+', '')))
            
            # Formats acceptés : France (+33), Madagascar (+261), USA (+1), UK (+44), etc.
            valid_formats = [
                # France
                phone_clean.startswith('33') and len(phone_clean) >= 11,
                phone_clean.startswith('06') or phone_clean.startswith('07'),
                # Madagascar
                phone_clean.startswith('261') and len(phone_clean) >= 12,
                phone_clean.startswith('032') or phone_clean.startswith('033') or 
                phone_clean.startswith('034') or phone_clean.startswith('038'),
                # USA/Canada
                phone_clean.startswith('1') and len(phone_clean) >= 11,
                # UK
                phone_clean.startswith('44') and len(phone_clean) >= 12,
                # Autres formats internationaux (minimum 8 chiffres)
                len(phone_clean) >= 8 and contact_phone.startswith('+')
            ]
            
            if not any(valid_formats):
                return Response({
                    'error': 'Format de numéro de téléphone invalide. Utilisez le format international (+261, +33, +1, etc.)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            contact_email = None
        
        # Générer un token unique
        invitation_token = secrets.token_urlsafe(32)
        
        # Créer l'invitation (sans admin pour l'instant - sera assignée plus tard)
        invitation = ClientInvitation.objects.create(
            contact_name=data['contact_name'],
            contact_email=contact_email,
            contact_phone=contact_phone,
            contact_subject=data['contact_subject'],
            contact_message=data['contact_message'],
            invitation_type=invitation_type,
            invitation_token=invitation_token,
            expires_at=timezone.now() + timedelta(days=7),
            sent_by=request.user  # Utilisateur authentifié qui crée l'invitation
        )
        
        # Générer l'URL d'invitation
        invitation_url = f"{settings.FRONTEND_URL or 'http://localhost:3000'}/signup/{invitation_token}"
        
        # Envoyer l'invitation
        if invitation_type == 'email':
            success = send_invitation_email(invitation, invitation_url)
        else:  # sms
            success = send_invitation_sms(invitation, invitation_url)
        
        if success:
            logger.info(f"Invitation {invitation_type} envoyée avec succès à {contact_email or contact_phone}")
            return Response({
                'success': True,
                'message': f'Invitation envoyée par {invitation_type} avec succès',
                'invitation_id': invitation.id,
                'expires_at': invitation.expires_at
            }, status=status.HTTP_201_CREATED)
        else:
            # Supprimer l'invitation si l'envoi a échoué
            invitation.delete()
            return Response({
                'error': f'Erreur lors de l\'envoi de l\'invitation par {invitation_type}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Erreur création invitation: {str(e)}")
        return Response({
            'error': 'Erreur interne du serveur'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def send_invitation_email(invitation, invitation_url):
    """Envoie l'invitation par email"""
    try:
        subject = f"🎉 Invitation à rejoindre Sales Tracker Pro - {invitation.contact_subject}"
        
        message = f"""
Bonjour {invitation.contact_name},

Merci pour votre intérêt pour Sales Tracker Pro !

Nous avons bien reçu votre message concernant : "{invitation.contact_subject}"

Vous êtes maintenant invité(e) à créer votre compte sécurisé sur notre plateforme.

🔗 Cliquez sur ce lien pour vous inscrire :
{invitation_url}

⏰ Cette invitation expire le {invitation.expires_at.strftime('%d/%m/%Y à %H:%M')}

Une fois votre compte créé, vous aurez accès à :
✅ Tableau de bord personnalisé
✅ Suivi des ventes en temps réel
✅ Rapports détaillés
✅ Support client dédié

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Sales Tracker Pro

---
Cet email a été envoyé en réponse à votre demande de contact.
Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
        """.strip()
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.contact_email],
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur envoi email invitation: {str(e)}")
        return False

def send_invitation_sms(invitation, invitation_url):
    """Envoie l'invitation par SMS"""
    try:
        contact_phone = invitation.contact_phone
        contact_name = invitation.contact_name
        
        # Envoyer le SMS d'invitation via le service international
        sms_sent = international_sms_service.send_invitation_sms(
            phone_number=contact_phone,
            invitation_url=invitation_url,
            contact_name=contact_name
        )      
        
        return sms_sent
        
    except Exception as e:
        logger.error(f"Erreur envoi SMS invitation: {str(e)}")
        return False

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_invitation_token(request, token):
    """Valide un token d'invitation"""
    try:
        invitation = ClientInvitation.objects.get(
            invitation_token=token,
            status='pending'
        )
        
        if invitation.is_expired():
            return Response({
                'valid': False,
                'error': 'Cette invitation a expiré'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'valid': True,
            'invitation': {
                'contact_name': invitation.contact_name,
                'contact_email': invitation.contact_email,
                'contact_phone': invitation.contact_phone,
                'invitation_type': invitation.invitation_type,
                'expires_at': invitation.expires_at
            }
        })
        
    except ClientInvitation.DoesNotExist:
        return Response({
            'valid': False,
            'error': 'Token d\'invitation invalide'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Erreur validation token: {str(e)}")
        return Response({
            'error': 'Erreur interne du serveur'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
