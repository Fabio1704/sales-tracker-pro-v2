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
        
        # Toujours considérer comme succès - l'invitation est créée même si l'email ne peut pas être envoyé
        logger.info(f"Invitation {invitation_type} créée pour {contact_email or contact_phone}, envoi: {'réussi' if success else 'échoué (mode console)'}")
        return Response({
            'success': True,
            'message': f'Invitation créée avec succès - {"Email envoyé" if success else "Email en mode console (voir logs)"}',
            'invitation_id': invitation.id,
            'expires_at': invitation.expires_at,
            'email_sent': success
        }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Erreur création invitation: {str(e)}")
        return Response({
            'error': 'Erreur interne du serveur'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def send_invitation_email(invitation, invitation_url):
    """Envoie l'invitation par email"""
    try:
        subject = f"Invitation Sales Tracker Pro - Créez votre compte maintenant"
        
        # Template HTML professionnel
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation Sales Tracker Pro</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Sales Tracker Pro</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0;">Plateforme de Gestion des Ventes</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Bonjour {invitation.contact_name},</h2>
        
        <p>Nous avons bien reçu votre demande concernant <strong>"{invitation.contact_subject}"</strong>.</p>
        
        <p>Vous êtes maintenant invité(e) à créer votre compte sécurisé sur notre plateforme Sales Tracker Pro.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{invitation_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">🚀 CRÉER MON COMPTE</a>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Votre accès inclut :</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>✅ Tableau de bord personnalisé</li>
                <li>✅ Suivi des ventes en temps réel</li>
                <li>✅ Rapports et analyses détaillés</li>
                <li>✅ Support client dédié</li>
            </ul>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>⏰ Important :</strong> Cette invitation expire le {invitation.expires_at.strftime('%d/%m/%Y à %H:%M')}</p>
        </div>
        
        <p>Si vous avez des questions, contactez-nous à <a href="mailto:support@sales-tracker-pro.com">support@sales-tracker-pro.com</a></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px; text-align: center;">
            Cordialement,<br>
            <strong>L'équipe Sales Tracker Pro</strong><br>
            <a href="https://sales-tracker-pro-v3.vercel.app">sales-tracker-pro-v3.vercel.app</a>
        </p>
        
        <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 20px;">
            Cet email a été envoyé en réponse à votre demande de contact.<br>
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
        </p>
    </div>
</body>
</html>
        """.strip()
        
        # Version texte simple pour compatibilité
        text_message = f"""
Bonjour {invitation.contact_name},

Nous avons bien reçu votre demande concernant "{invitation.contact_subject}".

Vous êtes invité(e) à créer votre compte Sales Tracker Pro :
{invitation_url}

Cette invitation expire le {invitation.expires_at.strftime('%d/%m/%Y à %H:%M')}

Cordialement,
L'équipe Sales Tracker Pro
https://sales-tracker-pro-v3.vercel.app
        """.strip()
        
        from django.core.mail import EmailMultiAlternatives
        
        # Créer l'email avec version HTML et texte
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[invitation.contact_email]
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=True)
        
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
