from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from .models import ContactMessage, ClientInvitation

class CustomUserAdmin(BaseUserAdmin):
    """Admin personnalisé pour les utilisateurs avec isolation des données"""
    
    def get_queryset(self, request):
        """Filtrer les utilisateurs selon les permissions"""
        qs = super().get_queryset(request)
        
        # Super admin voit tout
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return qs
        
        # Les autres admins ne voient que leur propre compte
        return qs.filter(id=request.user.id)
    
    def has_add_permission(self, request):
        """Seul le super admin peut ajouter des utilisateurs"""
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_delete_permission(self, request, obj=None):
        """Seul le super admin peut supprimer des utilisateurs"""
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_change_permission(self, request, obj=None):
        """Les admins peuvent modifier leur propre compte"""
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return True
        if obj and obj.id == request.user.id:
            return True
        return False

class CustomContactMessageAdmin(admin.ModelAdmin):
    """Admin personnalisé pour les messages de contact - seul le super admin peut voir"""
    
    list_display = ['name', 'email', 'subject', 'timestamp', 'read']
    list_filter = ['read', 'timestamp']
    search_fields = ['name', 'email', 'subject']
    ordering = ['-timestamp']
    
    def has_module_permission(self, request):
        """Seul le super admin peut voir les messages de contact"""
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_view_permission(self, request, obj=None):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_add_permission(self, request):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_change_permission(self, request, obj=None):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_delete_permission(self, request, obj=None):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'

class CustomClientInvitationAdmin(admin.ModelAdmin):
    """Admin personnalisé pour les invitations client - seul le super admin peut voir"""
    
    list_display = ['contact_name', 'contact_email', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'invitation_type', 'created_at']
    search_fields = ['contact_name', 'contact_email', 'contact_subject']
    ordering = ['-created_at']
    
    def has_module_permission(self, request):
        """Seul le super admin peut voir les invitations"""
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_view_permission(self, request, obj=None):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_add_permission(self, request):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_change_permission(self, request, obj=None):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'
    
    def has_delete_permission(self, request, obj=None):
        return request.user.email == 'tahiantsaoFabio17@gmail.com'

# Désenregistrer les modèles existants et enregistrer les nouveaux
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

# Réenregistrer les autres modèles avec les permissions personnalisées
try:
    admin.site.unregister(ContactMessage)
except admin.sites.NotRegistered:
    pass
admin.site.register(ContactMessage, CustomContactMessageAdmin)

try:
    admin.site.unregister(ClientInvitation)
except admin.sites.NotRegistered:
    pass
admin.site.register(ClientInvitation, CustomClientInvitationAdmin)
