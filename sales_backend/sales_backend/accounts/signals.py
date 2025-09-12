from django.db.models.signals import post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
# Firebase désactivé - utilisateurs gérés uniquement dans Django
# from .firebase_config import FirebaseConfig
# from firebase_admin import auth
import logging
import json

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Crée automatiquement un profil utilisateur lors de la création d'un utilisateur"""
    if created:
        # Créer le profil sans assigner created_by pour l'instant
        # Il sera assigné dans perform_create des vues API
        profile = UserProfile.objects.create(
            user=instance,
            created_by=None
        )
        
        # Firebase désactivé - Les utilisateurs ne sont gérés que dans Django
        # Garder seulement Firebase pour les notifications push si nécessaire
        logger.info(f"Utilisateur {instance.email} créé dans Django uniquement (Firebase désactivé)")

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Sauvegarde le profil utilisateur lors de la sauvegarde de l'utilisateur"""
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        UserProfile.objects.create(user=instance)

@receiver(post_delete, sender=User)
def notify_user_deletion(sender, instance, **kwargs):
    """Notifie tous les clients connectés de la suppression d'un utilisateur"""
    try:
        # Obtenir le channel layer pour WebSocket
        channel_layer = get_channel_layer()
        
        if channel_layer:
            # Préparer les données de notification
            notification_data = {
                'type': 'user_deleted',
                'user_id': str(instance.id),
                'user_email': instance.email,
                'user_name': f"{instance.first_name} {instance.last_name}".strip() or instance.username,
                'timestamp': str(instance.date_joined)
            }
            
            # Envoyer la notification à tous les admins connectés
            async_to_sync(channel_layer.group_send)(
                'admin_notifications',
                {
                    'type': 'send_notification',
                    'message': notification_data
                }
            )
            
            logger.info(f"Notification de suppression envoyée pour l'utilisateur {instance.email}")
        
        logger.info(f"Utilisateur {instance.email} supprimé de Django")
        
    except Exception as e:
        logger.error(f"Erreur lors de la notification de suppression pour {instance.email}: {str(e)}")

@receiver(pre_delete, sender=User)
def delete_firebase_user(sender, instance, **kwargs):
    """Firebase désactivé - Suppression uniquement dans Django"""
    try:
        user_profile = UserProfile.objects.get(user=instance)
        logger.info(f"Utilisateur {instance.email} supprimé de Django uniquement (Firebase désactivé)")
    except UserProfile.DoesNotExist:
        logger.warning(f"Aucun profil trouvé pour l'utilisateur {instance.email}")
