from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import UserSerializer, CreateUserSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class AdminUserView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, user_id=None):
        # Chaque admin ne voit QUE son propre compte - isolation complète
        if request.user.is_superuser:
            users = User.objects.all().order_by('id')
        else:
            users = User.objects.filter(id=request.user.id).order_by('id')
        return Response(UserSerializer(users, many=True).data)
    
    def delete(self, request, user_id=None):
        """Supprimer un utilisateur spécifique"""
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        
        # Récupérer user_id depuis l'URL
        from django.urls import resolve
        resolver_match = resolve(request.path_info)
        user_id = resolver_match.kwargs.get('user_id')
        
        if not user_id:
            return Response({'error': 'User ID required'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
            user.delete()
            return Response({
                'success': True,
                'message': f'Utilisateur {user.username} supprimé avec succès',
                'deleted_user': user_data
            })
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class DeleteGaelView(APIView):
    """Vue spécifique pour supprimer Gael Rakotoharimanga (ID: 6)"""
    permission_classes = [IsAdminUser]
    
    def delete(self, request):
        if not request.user.is_superuser:
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        try:
            user = User.objects.get(id=6)  # ID fixe pour Gael
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
            user.delete()
            return JsonResponse({
                'success': True,
                'message': f'Gael Rakotoharimanga supprimé avec succès',
                'deleted_user': user_data
            })
        except User.DoesNotExist:
            return JsonResponse({'error': 'Gael not found (already deleted?)'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class EmailValidationView(APIView):
    """API endpoint pour valider un email en temps réel"""
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Vérification d'unicité
            if User.objects.filter(email__iexact=email).exists():
                return Response({
                    'valid': False,
                    'error': 'Un utilisateur avec cet email existe déjà'
                })
            
            # Validation de l'existence
            is_valid = validate_email_exists(email)
            
            if is_valid:
                return Response({
                    'valid': True,
                    'message': 'Email valide et disponible'
                })
            else:
                return Response({
                    'valid': False,
                    'error': 'Email invalide ou inexistant'
                })
                
        except Exception as e:
            return Response({
                'valid': False,
                'error': f'Erreur de validation: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Alias pour les fonctions manquantes
def login_view(request):
    """Placeholder pour login_view"""
    return Response({'error': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

def logout_view(request):
    """Placeholder pour logout_view"""
    return Response({'error': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

def validate_email(request):
    """Alias pour EmailValidationView"""
    view = EmailValidationView()
    return view.post(request)

class PasswordResetRequestView(APIView):
    """Vue pour demander une réinitialisation de mot de passe"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Vérifier que l'utilisateur existe et est dans la base de données
            user = User.objects.get(email__iexact=email)
            
            # Générer le token de réinitialisation
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Créer le lien de réinitialisation
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            
            # Envoyer l'email professionnel
            subject = "Réinitialisation de votre mot de passe - Sales Tracker Pro"
            
            # Email HTML professionnel
            html_message = f"""
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; }}
        .logo {{ color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 10px; }}
        .header-text {{ color: #e0e7ff; font-size: 16px; }}
        .content {{ padding: 40px 30px; }}
        .greeting {{ font-size: 18px; color: #1f2937; margin-bottom: 20px; }}
        .message {{ color: #4b5563; line-height: 1.6; margin-bottom: 30px; }}
        .button-container {{ text-align: center; margin: 40px 0; }}
        .reset-button {{ 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
            color: #ffffff; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 12px; 
            font-weight: 600; 
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
        }}
        .security-note {{ background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 30px 0; }}
        .security-title {{ color: #374151; font-weight: 600; margin-bottom: 10px; }}
        .security-text {{ color: #6b7280; font-size: 14px; line-height: 1.5; }}
        .footer {{ background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }}
        .footer-text {{ color: #9ca3af; font-size: 14px; }}
        .company-info {{ margin-top: 20px; }}
        .company-name {{ color: #374151; font-weight: 600; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📈 Sales Tracker Pro</div>
            <div class="header-text">Plateforme d'Analytics Avancée</div>
        </div>
        
        <div class="content">
            <div class="greeting">Bonjour {user.first_name or user.username},</div>
            
            <div class="message">
                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Sales Tracker Pro.
                <br><br>
                Pour créer un nouveau mot de passe sécurisé, cliquez sur le bouton ci-dessous :
            </div>
            
            <div class="button-container">
                <a href="{reset_link}" class="reset-button">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="security-note">
                <div class="security-title">🔒 Informations de sécurité</div>
                <div class="security-text">
                    • Ce lien est valide pendant <strong>24 heures</strong><br>
                    • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email<br>
                    • Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau<br>
                    • Pour votre sécurité, ne partagez jamais ce lien avec personne
                </div>
            </div>
            
            <div class="message">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="{reset_link}" style="color: #3b82f6; word-break: break-all;">{reset_link}</a>
            </div>
        </div>
        
        <div class="footer">
            <div class="company-info">
                <div class="company-name">Sales Tracker Pro</div>
                <div class="footer-text">
                    Plateforme d'analytics et de suivi des ventes<br>
                    123 Avenue des Champs-Élysées, 75008 Paris, France<br>
                    support@salestrackerpro.com | +33 1 23 45 67 89
                </div>
            </div>
            <div class="footer-text" style="margin-top: 20px;">
                © 2025 Sales Tracker Pro. Tous droits réservés.
            </div>
        </div>
    </div>
</body>
</html>
            """
            
            # Message texte simple pour les clients email qui ne supportent pas HTML
            text_message = f"""
Bonjour {user.first_name or user.username},

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Sales Tracker Pro.

Pour créer un nouveau mot de passe, cliquez sur ce lien :
{reset_link}

INFORMATIONS DE SÉCURITÉ :
• Ce lien est valide pendant 24 heures
• Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
• Votre mot de passe actuel reste inchangé tant que vous n'en créez pas un nouveau

Cordialement,
L'équipe Sales Tracker Pro

---
Sales Tracker Pro
Plateforme d'analytics et de suivi des ventes
123 Avenue des Champs-Élysées, 75008 Paris, France
support@salestrackerpro.com | +33 1 23 45 67 89
© 2025 Sales Tracker Pro. Tous droits réservés.
            """
            
            from django.core.mail import EmailMultiAlternatives
            
            # Créer l'email avec version HTML et texte
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=False)
            
            logger.info(f"Email de réinitialisation envoyé à {user.email}")
            
            return Response({
                'message': 'Email de réinitialisation envoyé avec succès'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
            # Mais on renvoie un message d'erreur spécifique pour les utilisateurs non enregistrés
            return Response({
                'error': 'Aucun compte trouvé avec cet email. Seuls les utilisateurs invités et enregistrés peuvent réinitialiser leur mot de passe.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de l'email de réinitialisation: {str(e)}")
            return Response({
                'error': 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    """Vue pour confirmer la réinitialisation de mot de passe"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('token')
        uid = request.data.get('uid')
        password = request.data.get('password')
        
        logger.info(f"Tentative de réinitialisation - UID: {uid}, Token présent: {bool(token)}, Password présent: {bool(password)}")
        
        if not all([token, uid, password]):
            logger.error(f"Paramètres manquants - Token: {bool(token)}, UID: {bool(uid)}, Password: {bool(password)}")
            return Response(
                {'error': 'Token, UID et mot de passe requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Décoder l'UID
            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
                logger.error(f"Erreur lors du décodage UID {uid}: {str(e)}")
                return Response(
                    {'error': 'Lien de réinitialisation invalide'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier le token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Lien de réinitialisation invalide ou expiré'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider le mot de passe (longueur minimale, etc.)
            if len(password) < 8:
                return Response(
                    {'error': 'Le mot de passe doit contenir au moins 8 caractères'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Changer le mot de passe
            user.set_password(password)
            user.save()
            
            logger.info(f"Mot de passe réinitialisé avec succès pour {user.email}")
            
            return Response({
                'message': 'Mot de passe réinitialisé avec succès'
            }, status=status.HTTP_200_OK)
            
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Lien de réinitialisation invalide'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la réinitialisation du mot de passe: {str(e)}")
            return Response({
                'error': 'Erreur lors de la réinitialisation. Veuillez réessayer.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)