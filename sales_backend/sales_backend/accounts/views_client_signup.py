from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
import logging

from .models import ClientInvitation
from .validators_simple import validate_email_simple

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def client_signup_with_token(request, token):
    """
    GET: Valide le token et retourne les informations d'invitation
    POST: Crée le compte utilisateur avec les données fournies
    """
    
    try:
        # Récupérer l'invitation par token
        invitation = ClientInvitation.objects.get(
            invitation_token=token,
            status='pending'
        )
        
        # Vérifier si l'invitation n'a pas expiré
        if invitation.expires_at < timezone.now():
            return Response({
                'error': 'Cette invitation a expiré',
                'expired': True
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except ClientInvitation.DoesNotExist:
        return Response({
            'error': 'Token d\'invitation invalide ou inexistant',
            'invalid_token': True
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Retourner les informations de l'invitation pour pré-remplir le formulaire
        return Response({
            'success': True,
            'contact_name': invitation.contact_name,
            'contact_email': invitation.contact_email,
            'contact_subject': invitation.contact_subject,
            'expires_at': invitation.expires_at,
            'email': invitation.contact_email,  # Ajout pour compatibilité frontend
            'invitation_data': {
                'contact_name': invitation.contact_name,
                'contact_email': invitation.contact_email,
                'contact_subject': invitation.contact_subject,
                'expires_at': invitation.expires_at
            }
        })
    
    elif request.method == 'POST':
        # Créer le compte utilisateur
        data = request.data
        
        # Validation des données requises
        required_fields = ['first_name', 'last_name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'Le champ {field} est requis',
                    'field': field
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation de l'email
        email = data.get('email', '').lower().strip()
        if not email:
            return Response({
                'error': 'L\'email est requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_email_simple(email)
        except Exception as e:
            return Response({
                'error': f'Email invalide: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que l'email correspond à l'invitation
        if email != invitation.contact_email.lower():
            return Response({
                'error': 'L\'email doit correspondre à celui de l\'invitation'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Un compte avec cet email existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation du mot de passe
        password = data.get('password')
        if len(password) < 8:
            return Response({
                'error': 'Le mot de passe doit contenir au moins 8 caractères'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Créer l'utilisateur
                user = User.objects.create_user(
                    username=email,  # Utiliser l'email comme username
                    email=email,
                    first_name=data.get('first_name', '').strip(),
                    last_name=data.get('last_name', '').strip(),
                    password=password
                )
                
                # Marquer l'invitation comme utilisée
                invitation.status = 'accepted'
                invitation.used_at = timezone.now()
                invitation.created_user = user
                invitation.ip_address_used = request.META.get('REMOTE_ADDR', '')
                invitation.user_agent_used = request.META.get('HTTP_USER_AGENT', '')[:500]
                invitation.save()
                
                logger.info(f"Nouveau compte créé via invitation: {email} (ID: {user.id})")
                
                return Response({
                    'success': True,
                    'message': 'Compte créé avec succès',
                    'user_id': user.id,
                    'redirect_url': '/'  # Rediriger vers la landing page
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Erreur création compte: {str(e)}")
            return Response({
                'error': 'Erreur lors de la création du compte'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'error': 'Méthode non autorisée'
    }, status=status.HTTP_405_METHOD_NOT_ALLOWED)
