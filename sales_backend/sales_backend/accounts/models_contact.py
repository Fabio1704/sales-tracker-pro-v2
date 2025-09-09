from django.db import models
from django.utils import timezone

class ContactMessage(models.Model):
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
