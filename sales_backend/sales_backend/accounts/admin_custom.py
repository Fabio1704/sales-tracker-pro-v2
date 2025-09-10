from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import models
from .models import ContactMessage, ClientInvitation

class CustomUserAdmin(BaseUserAdmin):
    """Admin personnalisé pour les utilisateurs avec isolation des données"""
    
    def get_queryset(self, request):
        """Filtrer les utilisateurs selon les permissions hiérarchiques"""
        qs = super().get_queryset(request)
        
        # Super admin voit tout
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return qs
        
        # Les admins clients voient leur propre compte + les utilisateurs qu'ils ont créés
        from .models import UserProfile
        created_users = UserProfile.objects.filter(created_by=request.user).values_list('user_id', flat=True)
        return qs.filter(models.Q(id=request.user.id) | models.Q(id__in=created_users))
    
    def has_add_permission(self, request):
        """Tous les admins peuvent ajouter des utilisateurs"""
        return request.user.is_staff
    
    def has_delete_permission(self, request, obj=None):
        """Les admins peuvent supprimer les utilisateurs qu'ils ont créés"""
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return True
        if obj and hasattr(obj, 'profile') and obj.profile.created_by == request.user:
            return True
        return False
    
    def has_change_permission(self, request, obj=None):
        """Les admins peuvent modifier leur compte et ceux qu'ils ont créés"""
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            return True
        if obj and obj.id == request.user.id:
            return True
        if obj and hasattr(obj, 'profile') and obj.profile.created_by == request.user:
            return True
        return False

class CustomContactMessageAdmin(admin.ModelAdmin):
    """Admin personnalisé pour les messages de contact - seul le super admin peut voir"""
    
    list_display = ['name', 'email', 'subject', 'created_at', 'read']
    list_filter = ['read', 'created_at']
    search_fields = ['name', 'email', 'subject']
    ordering = ['-created_at']
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected']
    
    def mark_as_read(self, request, queryset):
        """Marquer les messages sélectionnés comme lus"""
        updated = queryset.update(read=True)
        self.message_user(request, f'{updated} message(s) marqué(s) comme lu(s).')
    mark_as_read.short_description = "Marquer comme lu"
    
    def mark_as_unread(self, request, queryset):
        """Marquer les messages sélectionnés comme non lus"""
        updated = queryset.update(read=False)
        self.message_user(request, f'{updated} message(s) marqué(s) comme non lu(s).')
    mark_as_unread.short_description = "Marquer comme non lu"
    
    def delete_selected(self, request, queryset):
        """Supprimer définitivement les messages sélectionnés"""
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f'{count} message(s) supprimé(s) définitivement.')
    delete_selected.short_description = "Supprimer définitivement"
    
    def has_module_permission(self, request):
        """Seul le super admin peut voir les messages de contact"""
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_view_permission(self, request, obj=None):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_add_permission(self, request):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_change_permission(self, request, obj=None):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_delete_permission(self, request, obj=None):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'

class CustomClientInvitationAdmin(admin.ModelAdmin):
    """Admin personnalisé pour les invitations client - seul le super admin peut voir"""
    
    list_display = ['contact_name', 'contact_email', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'invitation_type', 'created_at']
    search_fields = ['contact_name', 'contact_email', 'contact_subject']
    ordering = ['-created_at']
    
    def has_module_permission(self, request):
        """Seul le super admin peut voir les invitations"""
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_view_permission(self, request, obj=None):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_add_permission(self, request):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_change_permission(self, request, obj=None):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'
    
    def has_delete_permission(self, request, obj=None):
        return request.user.email == 'tahiantsoaFabio17@gmail.com'

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
