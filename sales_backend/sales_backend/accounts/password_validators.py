import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class StrongPasswordValidator:
    """
    Validateur de mot de passe fort avec règles strictes
    """
    
    def validate(self, password, user=None):
        """Valide qu'un mot de passe respecte les règles de sécurité"""
        errors = []
        
        # Longueur minimale
        if len(password) < 8:
            errors.append(_("Le mot de passe doit contenir au moins 8 caractères."))
        
        # Au moins une majuscule
        if not re.search(r'[A-Z]', password):
            errors.append(_("Le mot de passe doit contenir au moins une lettre majuscule."))
        
        # Au moins une minuscule
        if not re.search(r'[a-z]', password):
            errors.append(_("Le mot de passe doit contenir au moins une lettre minuscule."))
        
        # Au moins un chiffre
        if not re.search(r'\d', password):
            errors.append(_("Le mot de passe doit contenir au moins un chiffre."))
        
        # Au moins un caractère spécial
        if not re.search(r'[!@#$%^&*(),.?":{}|<>\.]', password):
            errors.append(_("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*(),.?\":{}|<>.)."))
        
        # Pas de caractères répétitifs
        if re.search(r'(.)\1{2,}', password):
            errors.append(_("Le mot de passe ne doit pas contenir plus de 2 caractères identiques consécutifs."))
        
        # Pas de séquences communes
        common_sequences = ['123', '456', '789', 'abc', 'qwe', 'asd', 'zxc']
        password_lower = password.lower()
        for seq in common_sequences:
            if seq in password_lower:
                errors.append(_("Le mot de passe ne doit pas contenir de séquences communes (123, abc, qwe, etc.)."))
                break
        
        # Mots de passe faibles communs
        weak_passwords = [
            'password', 'motdepasse', '12345678', 'azerty123',
            'admin123', 'user123', 'test123', 'password123'
        ]
        if password.lower() in weak_passwords:
            errors.append(_("Ce mot de passe est trop commun et facilement devinable."))
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        return _(
            "Votre mot de passe doit contenir au moins 8 caractères, "
            "une majuscule, une minuscule, un chiffre et un caractère spécial."
        )

class NoPersonalInfoValidator:
    """
    Validateur qui empêche l'utilisation d'informations personnelles dans le mot de passe
    """
    
    def validate(self, password, user=None):
        if user is None:
            return
        
        password_lower = password.lower()
        
        # Vérifier le nom d'utilisateur
        if user.username and len(user.username) > 2:
            if user.username.lower() in password_lower:
                raise ValidationError(
                    _("Le mot de passe ne doit pas contenir votre nom d'utilisateur."),
                    code='password_too_similar',
                )
        
        # Vérifier l'email
        if user.email:
            email_parts = user.email.lower().split('@')[0]
            if len(email_parts) > 2 and email_parts in password_lower:
                raise ValidationError(
                    _("Le mot de passe ne doit pas contenir votre adresse email."),
                    code='password_too_similar',
                )
        
        # Vérifier le prénom et nom
        if user.first_name and len(user.first_name) > 2:
            if user.first_name.lower() in password_lower:
                raise ValidationError(
                    _("Le mot de passe ne doit pas contenir votre prénom."),
                    code='password_too_similar',
                )
        
        if user.last_name and len(user.last_name) > 2:
            if user.last_name.lower() in password_lower:
                raise ValidationError(
                    _("Le mot de passe ne doit pas contenir votre nom de famille."),
                    code='password_too_similar',
                )
    
    def get_help_text(self):
        return _(
            "Votre mot de passe ne doit pas contenir vos informations personnelles "
            "(nom d'utilisateur, email, prénom, nom)."
        )

def validate_strong_password(password, user=None):
    """
    Fonction utilitaire pour valider un mot de passe fort
    """
    validator = StrongPasswordValidator()
    validator.validate(password, user)
    
    if user:
        personal_validator = NoPersonalInfoValidator()
        personal_validator.validate(password, user)
