from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import UserProfile
from .firebase_config import FirebaseConfig
from .two_factor_auth import TwoFactorAuth, EmailVerificationCode
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_fcm_token(request):
    """Sauvegarde le token FCM de l'utilisateur pour les notifications push"""
    try:
        fcm_token = request.data.get('fcm_token')
        if not fcm_token:
            return Response({'error': 'Token FCM requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Sauvegarder le token dans le profil utilisateur
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.fcm_token = fcm_token
        profile.save()
        
        return Response({'message': 'Token FCM sauvegardé avec succès'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def verify_firebase_token(request):
    """Vérifie un token Firebase ID côté serveur"""
    try:
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({'error': 'Token ID requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier le token avec Firebase Admin SDK
        decoded_token = FirebaseConfig.verify_firebase_token(id_token)
        
        if decoded_token:
            # Token valide, récupérer les infos utilisateur
            firebase_uid = decoded_token['uid']
            email = decoded_token.get('email')
            
            # Chercher l'utilisateur dans Django via le profil
            try:
                profile = UserProfile.objects.get(firebase_uid=firebase_uid)
                user = profile.user
                return Response({
                    'valid': True,
                    'user_id': user.id,
                    'email': user.email,
                    'firebase_uid': firebase_uid
                })
            except UserProfile.DoesNotExist:
                return Response({
                    'valid': True,
                    'firebase_uid': firebase_uid,
                    'email': email,
                    'message': 'Utilisateur Firebase non lié à Django'
                })
        else:
            return Response({'valid': False, 'error': 'Token invalide'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def link_firebase_account(request):
    """Lie un compte Firebase à un utilisateur Django existant"""
    try:
        id_token = request.data.get('id_token')
        if not id_token:
            return Response({'error': 'Token ID requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier le token Firebase
        decoded_token = FirebaseConfig.verify_firebase_token(id_token)
        
        if decoded_token:
            firebase_uid = decoded_token['uid']
            firebase_email = decoded_token.get('email')
            
            # Vérifier que l'email correspond
            if firebase_email != request.user.email:
                return Response({
                    'error': 'L\'email Firebase ne correspond pas à votre compte'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Lier le compte via le profil
            user = request.user
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.firebase_uid = firebase_uid
            profile.save()
            
            return Response({
                'message': 'Compte Firebase lié avec succès',
                'firebase_uid': firebase_uid
            })
        else:
            return Response({'error': 'Token Firebase invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_push_notification(request):
    """Envoie une notification push à un utilisateur"""
    try:
        user_id = request.data.get('user_id')
        title = request.data.get('title', 'Notification')
        body = request.data.get('body', 'Vous avez une nouvelle notification')
        data = request.data.get('data', {})
        
        # Récupérer l'utilisateur cible
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        else:
            target_user = request.user
        
        # Vérifier que l'utilisateur a un token FCM via son profil
        try:
            profile = target_user.profile
            if not profile.fcm_token:
                return Response({'error': 'Utilisateur sans token FCM'}, status=status.HTTP_400_BAD_REQUEST)
            fcm_token = profile.fcm_token
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profil utilisateur non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Envoyer la notification
        response = FirebaseConfig.send_push_notification(
            token=fcm_token,
            title=title,
            body=body,
            data=data
        )
        
        if response:
            return Response({
                'message': 'Notification envoyée avec succès',
                'message_id': response
            })
        else:
            return Response({'error': 'Échec envoi notification'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_2fa_email(request):
    """Active l'authentification à deux facteurs par email"""
    try:
        user = request.user
        
        # Générer et envoyer un code de vérification
        success = EmailVerificationCode.generate_and_send_code(user)
        
        if success:
            return Response({
                'message': 'Code de vérification envoyé par email',
                'step': 'verify_code'
            })
        else:
            return Response({'error': 'Échec envoi email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa_code(request):
    """Vérifie un code 2FA et active la fonctionnalité"""
    try:
        user = request.user
        code = request.data.get('code')
        
        if not code:
            return Response({'error': 'Code requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier le code
        valid, message = EmailVerificationCode.verify_code(user, code)
        
        if valid:
            # Activer 2FA pour l'utilisateur via le profil
            user = request.user
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.two_factor_enabled = True
            profile.save()
            
            return Response({
                'message': 'Authentification à deux facteurs activée avec succès',
                'two_factor_enabled': True
            })
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """Désactive l'authentification à deux facteurs"""
    try:
        user = request.user
        password = request.data.get('password')
        
        # Vérifier le mot de passe pour sécurité
        if not user.check_password(password):
            return Response({'error': 'Mot de passe incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Désactiver 2FA via le profil
        user = request.user
        try:
            profile = user.profile
            profile.two_factor_enabled = False
            profile.two_factor_secret = None
            profile.save()
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profil utilisateur non trouvé'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': 'Authentification à deux facteurs désactivée',
            'two_factor_enabled': False
        })
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
