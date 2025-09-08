from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.contrib.sessions.models import Session
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone
from .models import UserSession
import logging

logger = logging.getLogger(__name__)

@receiver(user_logged_in)
def user_login_handler(sender, request, user, **kwargs):
    """Signal handler pour la connexion utilisateur"""
    try:
        # Obtenir ou créer l'objet UserSession
        user_session, created = UserSession.objects.get_or_create(user=user)
        
        # Obtenir les informations de la requête
        session_key = request.session.session_key
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Marquer l'utilisateur comme en ligne
        user_session.mark_online(
            session_key=session_key,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"✅ Utilisateur {user.username} connecté - IP: {ip_address}")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du tracking de connexion pour {user.username}: {str(e)}")

@receiver(user_logged_out)
def user_logout_handler(sender, request, user, **kwargs):
    """Signal handler pour la déconnexion utilisateur"""
    try:
        if user:
            # Obtenir l'objet UserSession
            user_session = UserSession.objects.filter(user=user).first()
            if user_session:
                user_session.mark_offline()
                logger.info(f"✅ Utilisateur {user.username} déconnecté")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du tracking de déconnexion: {str(e)}")

def get_client_ip(request):
    """Obtenir l'adresse IP du client"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def cleanup_expired_sessions():
    """Nettoyer les sessions expirées et marquer les utilisateurs comme hors ligne"""
    try:
        # Obtenir toutes les clés de session actives
        active_session_keys = set(Session.objects.filter(
            expire_date__gt=timezone.now()
        ).values_list('session_key', flat=True))
        
        # Marquer comme hors ligne les utilisateurs dont la session a expiré
        expired_sessions = UserSession.objects.filter(
            is_online=True,
            session_key__isnull=False
        ).exclude(session_key__in=active_session_keys)
        
        count = 0
        for session in expired_sessions:
            session.mark_offline()
            count += 1
            
        if count > 0:
            logger.info(f"🧹 {count} sessions expirées nettoyées")
            
    except Exception as e:
        logger.error(f"❌ Erreur lors du nettoyage des sessions: {str(e)}")
