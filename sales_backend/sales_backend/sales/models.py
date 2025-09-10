from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone

def profile_upload_path(instance, filename):
    return f"profile_photos/user_{instance.owner_id}/{filename}"

class ModelProfile(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='model_profiles')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_model_profiles', null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    profile_photo = models.ImageField(upload_to=profile_upload_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Profil Modèle'
        verbose_name_plural = 'Profils Modèles'

    def __str__(self):
        return f"{self.first_name} {self.last_name} (#{self.pk})"
    
    def get_absolute_url(self):
        return reverse('admin:sales_modelprofile_change', args=[str(self.id)])
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def sales_count(self):
        return self.daily_sales.count()
    
    @property
    def total_revenue(self):
        total = self.daily_sales.aggregate(total=models.Sum('amount_usd'))['total']
        return total or 0
    
    @property
    def total_net_revenue(self):
        return self.total_revenue * 0.8

class DailySale(models.Model):
    model_profile = models.ForeignKey(ModelProfile, on_delete=models.CASCADE, related_name='daily_sales')
    date = models.DateField()
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)  # Always USD
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('model_profile', 'date', 'amount_usd', 'created_at')
        ordering = ['-date', '-created_at']
        verbose_name = 'Vente Quotidienne'
        verbose_name_plural = 'Ventes Quotidiennes'

    def __str__(self):
        return f"{self.model_profile} - {self.date} - ${self.amount_usd}"
    
    def get_absolute_url(self):
        return reverse('admin:sales_dailysale_change', args=[str(self.id)])
    
    @property
    def net_amount(self):
        return self.amount_usd * 0.8
    
    @property
    def fees_amount(self):
        return self.amount_usd * 0.2


class UserSession(models.Model):
    """Modèle pour tracker les sessions utilisateurs et leur statut de connexion"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='session_info')
    is_online = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    last_logout = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Session Utilisateur'
        verbose_name_plural = 'Sessions Utilisateurs'
        ordering = ['-last_activity']

    def __str__(self):
        status = "En ligne" if self.is_online else "Hors ligne"
        return f"{self.user.username} - {status}"

    @property
    def status_display(self):
        return "En ligne" if self.is_online else "Hors ligne"

    @property
    def last_seen_display(self):
        if self.is_online:
            return "En ligne maintenant"
        elif self.last_logout:
            return f"Dernière déconnexion: {self.last_logout.strftime('%d/%m/%Y à %H:%M')}"
        elif self.last_login:
            return f"Dernière connexion: {self.last_login.strftime('%d/%m/%Y à %H:%M')}"
        else:
            return "Jamais connecté"

    def mark_online(self, session_key=None, ip_address=None, user_agent=None):
        """Marquer l'utilisateur comme en ligne"""
        self.is_online = True
        self.last_login = timezone.now()
        self.last_activity = timezone.now()
        if session_key:
            self.session_key = session_key
        if ip_address:
            self.ip_address = ip_address
        if user_agent:
            self.user_agent = user_agent
        self.save()

    def mark_offline(self):
        """Marquer l'utilisateur comme hors ligne"""
        self.is_online = False
        self.last_logout = timezone.now()
        self.session_key = None
        self.save()

    def update_activity(self):
        """Mettre à jour la dernière activité"""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])