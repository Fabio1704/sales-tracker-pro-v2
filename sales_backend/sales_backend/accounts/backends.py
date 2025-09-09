from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameBackend(ModelBackend):
    """
    Backend d'authentification personnalisé qui permet la connexion
    avec email OU nom d'utilisateur
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        # Détermine si l'identifiant est un email ou un nom d'utilisateur
        is_email = '@' in username
        
        try:
            # Recherche l'utilisateur par email OU username
            user = User.objects.get(
                Q(username__iexact=username) | Q(email__iexact=username)
            )
        except User.DoesNotExist:
            # Exécute le hashage du mot de passe pour éviter les attaques de timing
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # Si plusieurs utilisateurs ont le même email (ne devrait pas arriver)
            return None
        
        # Vérifie le mot de passe et que l'utilisateur est actif
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
