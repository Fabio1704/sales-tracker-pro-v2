import secrets
import string
from django.utils import timezone
from datetime import timedelta

def generate_invitation_token():
    """Génère un token sécurisé pour les invitations"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(64))

def get_invitation_expiry():
    """Retourne la date d'expiration par défaut (7 jours)"""
    return timezone.now() + timedelta(days=7)

def get_client_ip(request):
    """Récupère l'IP du client depuis la requête"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_user_agent(request):
    """Récupère le User-Agent depuis la requête"""
    return request.META.get('HTTP_USER_AGENT', '')
