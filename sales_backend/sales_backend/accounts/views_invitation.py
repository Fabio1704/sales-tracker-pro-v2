from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib import messages
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
import json

from .models import ClientInvitation, UserProfile
from .utils import generate_invitation_token, get_invitation_expiry, get_client_ip, get_user_agent
from .validators_simple import validate_real_email
from .password_validators import validate_strong_password
from .firebase_config import FirebaseConfig
from .admin_permissions import assign_client_admin_permissions
# Firebase auth désactivé - utilisateurs gérés uniquement dans Django
# from firebase_admin import auth as firebase_auth

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_client_invitation(request):
    """Envoie une invitation client par email"""
    try:
        data = request.data
        invitation_id = data.get('invitation_id')
        custom_message = data.get('custom_message', '')
        
        if not invitation_id:
            return Response({
                'error': 'ID d\'invitation requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer l'invitation
        try:
            invitation = ClientInvitation.objects.get(id=invitation_id)
        except ClientInvitation.DoesNotExist:
            return Response({
                'error': 'Invitation non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier que l'invitation appartient à l'utilisateur connecté
        if invitation.owner != request.user:
            return Response({
                'error': 'Accès non autorisé à cette invitation'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Générer l'URL d'invitation
        invitation_url = f"{settings.FRONTEND_URL or 'http://localhost:3000'}/signup/{invitation.invitation_token}"
        
        # Préparer le contenu de l'email
        subject = f"🎉 Invitation à rejoindre Sales Tracker Pro - {invitation.contact_subject}"
        
        # Contexte pour le template HTML
        email_context = {
            'invitation': invitation,
            'invitation_url': invitation_url,
            'custom_message': custom_message,
            'admin_name': request.user.get_full_name() or request.user.username
        }
        
        # Générer l'email HTML professionnel
        html_message = render_to_string('emails/client_invitation.html', email_context)
        
        # Version texte brut (fallback)
        plain_message = f"""
Bonjour {invitation.contact_name},

Merci pour votre intérêt pour Sales Tracker Pro !

Nous avons bien reçu votre message concernant : "{invitation.contact_subject}"

{custom_message if custom_message else ''}

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
{request.user.get_full_name() or request.user.username}
L'équipe Sales Tracker Pro

---
Cet email a été envoyé en réponse à votre demande de contact.
Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
        """.strip()
        
        # Log des informations pour debug
        logger.info(f"=== ENVOI EMAIL RÉEL ===")
        logger.info(f"À: {invitation.contact_email}")
        logger.info(f"Sujet: {subject}")
        logger.info(f"From: {settings.DEFAULT_FROM_EMAIL}")
        logger.info(f"Lien d'inscription: {invitation_url}")
        logger.info(f"========================")
        
        # Envoyer l'email réel avec HTML professionnel
        try:
            from django.core.mail import EmailMultiAlternatives
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[invitation.contact_email]
            )
            email.attach_alternative(html_message, "text/html")
            email.send()
            
            # Marquer l'invitation comme envoyée
            invitation.status = 'sent'
            invitation.sent_at = timezone.now()
            invitation.save()
            
            logger.info(f"Invitation envoyée par email à {invitation.contact_email} par {request.user.username}")
            
            return Response({
                'success': True,
                'message': 'Invitation envoyée avec succès par email',
                'invitation_url': invitation_url
            })
            
        except Exception as e:
            logger.error(f"Erreur envoi email invitation {invitation_id}: {str(e)}")
            
            # En cas d'erreur email, retourner quand même le lien
            return Response({
                'success': True,
                'message': f'Invitation créée ! Erreur envoi email - Lien à partager manuellement: {invitation_url}',
                'invitation_url': invitation_url,
                'email_error': str(e),
                'email_failed': True
            })
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Erreur send_client_invitation: {str(e)}")
        logger.error(f"Stack trace: {error_details}")
        return Response({
            'error': 'Erreur interne du serveur',
            'details': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class ClientSignupView(View):
    """Vue pour l'inscription client via lien d'invitation"""
    
    def get(self, request, token):
        """Affiche le formulaire d'inscription si le token est valide ou retourne JSON pour API"""
        try:
            invitation = get_object_or_404(ClientInvitation, invitation_token=token)
            
            # Détecter si c'est une requête API (par Accept header ou Content-Type)
            is_api_request = (
                request.headers.get('Content-Type') == 'application/json' or
                'application/json' in request.headers.get('Accept', '') or
                request.GET.get('format') == 'json'
            )
            
            # Debug: Log des informations d'invitation
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"=== DEBUG INVITATION ===")
            logger.info(f"Token: {token}")
            logger.info(f"Status: {invitation.status}")
            logger.info(f"Expires at: {invitation.expires_at}")
            logger.info(f"Current time: {timezone.now()}")
            logger.info(f"Is expired: {invitation.is_expired()}")
            logger.info(f"Is valid: {invitation.is_valid()}")
            logger.info(f"========================")
            
            # Vérifier si l'invitation est valide
            if not invitation.is_valid():
                if is_api_request:
                    # Requête API - retourner JSON
                    if invitation.is_expired():
                        return JsonResponse({
                            'success': False,
                            'error': f'Cette invitation a expiré le {invitation.expires_at.strftime("%d/%m/%Y à %H:%M")}.'
                        }, status=400)
                    else:
                        return JsonResponse({
                            'success': False,
                            'error': f'Cette invitation n\'est plus valide (statut: {invitation.status}).'
                        }, status=400)
                else:
                    # Requête web - retourner HTML
                    if invitation.is_expired():
                        return render(request, 'accounts/invitation_expired.html', {
                            'invitation': invitation
                        })
                    else:
                        return render(request, 'accounts/invitation_invalid.html', {
                            'invitation': invitation
                        })
            
            # Si c'est une requête API, retourner les données JSON
            if is_api_request:
                return JsonResponse({
                    'success': True,
                    'contact_name': invitation.contact_name,
                    'contact_email': invitation.contact_email,
                    'contact_subject': invitation.contact_subject,
                    'expires_at': invitation.expires_at.isoformat()
                })
            
            # Sinon, afficher le formulaire d'inscription HTML
            return render(request, 'accounts/client_signup.html', {
                'invitation': invitation,
                'token': token
            })
            
        except ClientInvitation.DoesNotExist:
            is_api_request = (
                request.headers.get('Content-Type') == 'application/json' or
                'application/json' in request.headers.get('Accept', '') or
                request.GET.get('format') == 'json'
            )
            
            if is_api_request:
                return JsonResponse({
                    'success': False,
                    'error': 'Invitation non trouvée.'
                }, status=404)
            return render(request, 'accounts/invitation_not_found.html')
    
    def post(self, request, token):
        """Traite l'inscription du client"""
        try:
            invitation = get_object_or_404(ClientInvitation, invitation_token=token)
            
            # Vérifier si l'invitation est valide
            if not invitation.is_valid():
                return JsonResponse({
                    'success': False,
                    'error': 'Cette invitation n\'est plus valide.'
                }, status=400)
            
            # Récupérer les données du formulaire
            data = json.loads(request.body)
            logger.debug(f"Données reçues pour inscription: {data}")
            
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            confirm_password = data.get('confirm_password', '')
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            
            logger.debug(f"Email: {email}")
            logger.debug(f"Invitation email: {invitation.contact_email}")
            logger.debug(f"Password: {'***' if password else 'EMPTY'}")
            logger.debug(f"Confirm password: {'***' if confirm_password else 'EMPTY'}")
            logger.debug(f"First name: {first_name}")
            logger.debug(f"Last name: {last_name}")
            
            # Validations
            errors = []
            
            # Vérifier que tous les champs sont présents
            if not all([email, password, confirm_password, first_name, last_name]):
                errors.append('Tous les champs sont requis.')
            
            # Vérifier que l'email correspond à celui de l'invitation
            if email and email != invitation.contact_email.lower():
                errors.append('L\'email doit correspondre à celui de l\'invitation.')
            
            # Valider l'email Gmail
            if email:
                try:
                    validate_real_email(email)
                except Exception as e:
                    errors.append(f'Email invalide: {str(e)}')
            
            # Vérifier que l'utilisateur n'existe pas déjà
            if email and User.objects.filter(email=email).exists():
                errors.append('Un compte avec cet email existe déjà.')
            
            # Valider le mot de passe
            if password and confirm_password:
                if password != confirm_password:
                    errors.append('Les mots de passe ne correspondent pas.')
            
            if errors:
                logger.error(f"Erreurs de validation pour l'inscription: {errors}")
                return JsonResponse({
                    'success': False,
                    'error': errors[0] if errors else 'Erreur de validation',
                    'errors': errors
                }, status=400)
            
            # Créer l'utilisateur avec permissions admin
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=True  # Donner les permissions admin
            )
            
            # Assigner les permissions d'admin client
            assign_client_admin_permissions(user)
            
            # Firebase désactivé - Les utilisateurs ne sont créés que dans Django
            firebase_uid = None
            print(f"Utilisateur {email} créé dans Django uniquement (Firebase désactivé)")
            
            # Créer le profil utilisateur (si le modèle existe et n'existe pas déjà)
            try:
                from accounts.models import UserProfile
                profile, created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'firebase_uid': firebase_uid,
                        'ip_address': get_client_ip(request),
                        'user_agent': get_user_agent(request),
                        'created_by': user  # Le nouvel utilisateur devient son propre créateur (admin autonome)
                    }
                )
                if not created:
                    # Mettre à jour les informations si le profil existe déjà
                    profile.firebase_uid = firebase_uid or profile.firebase_uid
                    profile.ip_address = get_client_ip(request)
                    profile.user_agent = get_user_agent(request)
                    profile.created_by = user  # Le nouvel utilisateur devient son propre créateur (admin autonome)
                    profile.save()
            except ImportError:
                # Le modèle UserProfile n'existe pas
                pass
            except Exception as e:
                print(f"Erreur création profil (non critique): {e}")
                # Si le profil échoue, on continue sans profil
                pass
            
            # Marquer l'invitation comme utilisée et assigner le propriétaire
            invitation.status = 'used'
            invitation.used_at = timezone.now()
            invitation.created_user = user
            invitation.owner = user  # Le nouvel utilisateur devient propriétaire de son invitation
            invitation.usage_ip_address = get_client_ip(request)
            invitation.usage_user_agent = get_user_agent(request)
            invitation.save()
            
            # Générer les tokens JWT pour connexion automatique
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            logger.info(f"Compte créé avec succès pour {email}, tokens générés")
            
            return JsonResponse({
                'success': True,
                'message': 'Compte créé avec succès ! Vous êtes maintenant connecté.',
                'redirect_url': 'http://localhost:3000/dashboard',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Données JSON invalides'
            }, status=400)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            logger.error(f'Erreur lors de la création du compte: {str(e)}', exc_info=True)
            logger.error(f'Stack trace complet: {error_details}')
            return JsonResponse({
                'success': False,
                'error': f'Erreur lors de la création du compte: {str(e)}',
                'details': error_details if settings.DEBUG else None
            }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def create_client_invitation(request):
    """Crée une invitation client depuis un message de contact"""
    try:
        data = request.data
        contact_name = data.get('contact_name')
        contact_email = data.get('contact_email')
        contact_subject = data.get('contact_subject')
        contact_message = data.get('contact_message')
        
        if not all([contact_name, contact_email, contact_subject, contact_message]):
            return Response({
                'error': 'Tous les champs sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que l'email est valide
        try:
            validate_real_email(contact_email)
        except Exception as e:
            return Response({
                'error': f'Email invalide: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier qu'une invitation n'existe pas déjà pour cet email
        existing_invitation = ClientInvitation.objects.filter(
            contact_email=contact_email,
            status='pending'
        ).first()
        
        if existing_invitation and existing_invitation.is_valid():
            # Retourner l'invitation existante au lieu d'une erreur
            invitation_url = existing_invitation.get_invitation_url(request)
            return Response({
                'success': True,
                'invitation_id': existing_invitation.id,
                'invitation_url': invitation_url,
                'expires_at': existing_invitation.expires_at,
                'message': 'Invitation existante réutilisée',
                'existing': True
            }, status=status.HTTP_200_OK)
        
        # Créer l'invitation
        invitation_token = generate_invitation_token()
        expires_at = get_invitation_expiry()
        invitation = ClientInvitation.objects.create(
            contact_name=contact_name,
            contact_email=contact_email,
            contact_subject=contact_subject,
            contact_message=contact_message,
            invitation_token=invitation_token,
            expires_at=expires_at,
            sent_by=request.user,
            owner=request.user  # L'admin qui crée l'invitation en devient propriétaire
        )
        
        # Générer l'URL d'invitation
        invitation_url = invitation.get_invitation_url(request)
        
        return Response({
            'success': True,
            'invitation_id': invitation.id,
            'invitation_url': invitation_url,
            'expires_at': invitation.expires_at,
            'message': 'Invitation créée avec succès'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la création de l\'invitation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def send_invitation_email(request):
    """Envoie l'email d'invitation au client"""
    try:
        invitation_id = request.data.get('invitation_id')
        custom_message = request.data.get('custom_message', '')
        
        invitation = get_object_or_404(ClientInvitation, id=invitation_id)
        
        if not invitation.is_valid():
            return Response({
                'error': 'Cette invitation n\'est plus valide'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Générer l'URL d'invitation
        invitation_url = invitation.get_invitation_url(request)
        
        # Préparer le contexte pour l'email
        context = {
            'invitation': invitation,
            'invitation_url': invitation_url,
            'custom_message': custom_message,
            'admin_name': request.user.get_full_name() or request.user.username,
        }
        
        # Rendu du template HTML
        html_message = render_to_string('emails/client_invitation.html', context)
        plain_message = strip_tags(html_message)
        
        # Envoyer l'email
        send_mail(
            subject=f'Invitation à rejoindre Sales Tracker Pro - Re: {invitation.contact_subject}',
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[invitation.contact_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': f'Invitation envoyée à {invitation.contact_email}'
        })
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors de l\'envoi de l\'invitation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def list_invitations(request):
    """Liste toutes les invitations"""
    try:
        invitations = ClientInvitation.objects.all()
        
        data = []
        for invitation in invitations:
            data.append({
                'id': invitation.id,
                'contact_name': invitation.contact_name,
                'contact_email': invitation.contact_email,
                'contact_subject': invitation.contact_subject,
                'status': invitation.status,
                'created_at': invitation.created_at,
                'expires_at': invitation.expires_at,
                'used_at': invitation.used_at,
                'sent_by': invitation.sent_by.get_full_name() or invitation.sent_by.username,
                'created_user': invitation.created_user.get_full_name() if invitation.created_user else None,
                'is_valid': invitation.is_valid(),
                'is_expired': invitation.is_expired(),
            })
        
        return Response({
            'invitations': data
        })
        
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération des invitations: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
