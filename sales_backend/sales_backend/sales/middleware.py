from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import User
from .models import UserSession
import logging

logger = logging.getLogger(__name__)

class UserActivityMiddleware(MiddlewareMixin):
    """
    Middleware pour tracker l'activité des utilisateurs connectés
    et mettre à jour automatiquement leur dernière activité
    """
    
    def process_request(self, request):
        """
        Traiter chaque requête pour mettre à jour l'activité utilisateur
        """
        # Vérifier si l'utilisateur est connecté
        if request.user.is_authenticated:
            try:
                # Obtenir ou créer l'objet UserSession
                user_session, created = UserSession.objects.get_or_create(
                    user=request.user
                )
                
                # Si c'est une nouvelle session, marquer comme en ligne
                if created:
                    session_key = request.session.session_key
                    ip_address = self.get_client_ip(request)
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    
                    user_session.mark_online(
                        session_key=session_key,
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                    logger.info(f"📱 Nouvelle session créée pour {request.user.username}")
                else:
                    # Mettre à jour la dernière activité
                    user_session.update_activity()
                    
                    # Si l'utilisateur n'était pas marqué comme en ligne, le marquer
                    if not user_session.is_online:
                        session_key = request.session.session_key
                        ip_address = self.get_client_ip(request)
                        user_agent = request.META.get('HTTP_USER_AGENT', '')
                        
                        user_session.mark_online(
                            session_key=session_key,
                            ip_address=ip_address,
                            user_agent=user_agent
                        )
                        logger.info(f"🔄 Utilisateur {request.user.username} marqué comme en ligne")
                        
            except Exception as e:
                logger.error(f"❌ Erreur dans UserActivityMiddleware pour {request.user.username}: {str(e)}")
        
        return None
    
    def get_client_ip(self, request):
        """Obtenir l'adresse IP du client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SessionCleanupMiddleware(MiddlewareMixin):
    """
    Middleware pour nettoyer périodiquement les sessions expirées
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.request_count = 0
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Nettoyer les sessions expirées toutes les 100 requêtes
        """
        self.request_count += 1
        
        # Nettoyer toutes les 100 requêtes pour éviter de surcharger
        if self.request_count % 100 == 0:
            try:
                from .signals import cleanup_expired_sessions
                cleanup_expired_sessions()
            except Exception as e:
                logger.error(f"❌ Erreur lors du nettoyage des sessions: {str(e)}")
        
        return None
