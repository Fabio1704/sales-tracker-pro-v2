from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    """Profil utilisateur étendu avec sécurité avancée"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Admin propriétaire (pour isolation des données)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_users', null=True, blank=True)
    
    # Authentification à deux facteurs
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)
    
    # Firebase
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True)
    fcm_token = models.CharField(max_length=255, blank=True, null=True)  # Pour notifications push
    
    # Sécurité
    last_password_change = models.DateTimeField(default=timezone.now)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    email_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Profile de {self.user.email}"
    
    def is_account_locked(self):
        """Vérifie si le compte est verrouillé"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def lock_account(self, duration_minutes=30):
        """Verrouille le compte pour une durée donnée"""
        self.account_locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        self.save()
    
    def unlock_account(self):
        """Déverrouille le compte"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save()
    
    def increment_failed_login(self):
        """Incrémente les tentatives de connexion échouées"""
        self.failed_login_attempts += 1
        
        # Verrouiller après 5 tentatives
        if self.failed_login_attempts >= 5:
            self.lock_account()
        
        self.save()
    
    def reset_failed_login(self):
        """Remet à zéro les tentatives échouées"""
        self.failed_login_attempts = 0
        self.save()

class LoginAttempt(models.Model):
    """Historique des tentatives de connexion"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    success = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)
    failure_reason = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        status = "✅" if self.success else "❌"
        return f"{status} {self.email} - {self.timestamp}"

class SecurityEvent(models.Model):
    """Événements de sécurité"""
    
    EVENT_TYPES = [
        ('login_success', 'Connexion réussie'),
        ('login_failed', 'Connexion échouée'),
        ('password_changed', 'Mot de passe modifié'),
        ('2fa_enabled', '2FA activé'),
        ('2fa_disabled', '2FA désactivé'),
        ('account_locked', 'Compte verrouillé'),
        ('suspicious_activity', 'Activité suspecte'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.email} - {self.get_event_type_display()}"

class ClientInvitation(models.Model):
    """Invitations sécurisées pour clients"""
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('sent', 'Envoyée'),
        ('used', 'Utilisée'),
        ('expired', 'Expirée'),
        ('cancelled', 'Annulée'),
    ]
    
    INVITATION_TYPE_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
    ]
    
    # Informations du contact original
    contact_name = models.CharField(max_length=100)
    contact_email = models.EmailField(blank=True, null=True)  # Optionnel pour SMS
    contact_phone = models.CharField(max_length=20, blank=True, null=True)  # Pour SMS
    contact_subject = models.CharField(max_length=200)
    contact_message = models.TextField()
    
    # Type d'invitation
    invitation_type = models.CharField(max_length=10, choices=INVITATION_TYPE_CHOICES, default='email')
    
    # Token sécurisé pour l'invitation
    invitation_token = models.CharField(max_length=64, unique=True)
    
    # Statut et dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    
    # Utilisateur créé après inscription
    created_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Admin qui a envoyé l'invitation
    sent_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    
    # Admin propriétaire du client créé (pour isolation des données)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_invitations', null=True, blank=True)
    
    # Métadonnées
    ip_address_used = models.GenericIPAddressField(null=True, blank=True)
    user_agent_used = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation pour {self.contact_email} - {self.get_status_display()}"
    
    def is_expired(self):
        """Vérifie si l'invitation a expiré"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Vérifie si l'invitation est valide (non utilisée et non expirée)"""
        return self.status in ['pending', 'sent'] and not self.is_expired()
    
    def mark_as_used(self, user, ip_address=None, user_agent=None):
        """Marque l'invitation comme utilisée"""
        self.status = 'used'
        self.used_at = timezone.now()
        self.created_user = user
        if ip_address:
            self.ip_address_used = ip_address
        if user_agent:
            self.user_agent_used = user_agent
        self.save()
    
    def get_invitation_url(self, request=None):
        """Génère l'URL d'invitation complète"""
        from django.urls import reverse
        path = reverse('client_signup', kwargs={'token': self.invitation_token})
        if request:
            return request.build_absolute_uri(path)
        return path

class ContactMessage(models.Model):
    """Messages de contact du site web"""
    
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Message de contact'
        verbose_name_plural = 'Messages de contact'
    
    def __str__(self):
        return f"{self.name} - {self.subject}"
    
    @property
    def is_recent(self):
        """Vérifie si le message a moins de 24h"""
        from datetime import timedelta
        return self.created_at > timezone.now() - timedelta(hours=24)
