from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile
# Firebase désactivé - utilisateurs gérés uniquement dans Django
# from .firebase_config import FirebaseConfig
# from firebase_admin import auth
import logging

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

@receiver(pre_delete, sender=User)
def delete_firebase_user(sender, instance, **kwargs):
    """Firebase désactivé - Suppression uniquement dans Django"""
    try:
        user_profile = UserProfile.objects.get(user=instance)
        logger.info(f"Utilisateur {instance.email} supprimé de Django uniquement (Firebase désactivé)")
    except UserProfile.DoesNotExist:
        logger.warning(f"Aucun profil trouvé pour l'utilisateur {instance.email}")
