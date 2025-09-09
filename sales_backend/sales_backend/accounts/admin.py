from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from django.utils.html import format_html
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import UserProfile, LoginAttempt, SecurityEvent, ClientInvitation, ContactMessage
from .admin_filters import (
    FilteredUserAdmin, FilteredClientInvitationAdmin, FilteredUserProfileAdmin,
    FilteredLoginAttemptAdmin, FilteredSecurityEventAdmin
)
from .validators_simple import validate_real_email

# Désenregistrer le modèle User par défaut
admin.site.unregister(User)

class CustomUserCreationForm(UserCreationForm):
    """Formulaire de création d'utilisateur avec validation email"""
    
    email = forms.EmailField(
        required=True,
        help_text="Seuls les emails Gmail réalistes sont acceptés"
    )
    
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            try:
                validate_real_email(email)
            except Exception as e:
                raise forms.ValidationError(str(e))
        return email
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.username = self.cleaned_data["email"]  # Utiliser l'email comme username
        if commit:
            user.save()
        return user

class CustomUserChangeForm(UserChangeForm):
    """Formulaire de modification d'utilisateur avec validation email"""
    
    email = forms.EmailField(required=True)
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            try:
                validate_real_email(email)
            except Exception as e:
                raise forms.ValidationError(str(e))
        return email

class UserProfileInline(admin.StackedInline):
    """Profil utilisateur intégré dans l'admin User"""
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profil de sécurité'
    
    fields = (
        'two_factor_enabled', 'email_verified', 'phone_number', 'phone_verified',
        'firebase_uid', 'fcm_token', 'failed_login_attempts', 'account_locked_until'
    )
    readonly_fields = ('firebase_uid', 'failed_login_attempts', 'account_locked_until')

class CustomUserAdmin(BaseUserAdmin):
    """Administration personnalisée des utilisateurs"""
    
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'get_2fa_status', 'get_account_status')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'profile__two_factor_enabled')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    inlines = [UserProfileInline]
    
    def get_2fa_status(self, obj):
        """Affiche le statut 2FA"""
        if hasattr(obj, 'profile') and obj.profile.two_factor_enabled:
            return "✅ Activé"
        return "❌ Désactivé"
    get_2fa_status.short_description = "2FA"
    
    def get_account_status(self, obj):
        """Affiche le statut du compte"""
        if hasattr(obj, 'profile') and obj.profile.is_account_locked():
            return "🔒 Verrouillé"
        return "🔓 Actif"
    get_account_status.short_description = "Statut"

# Enregistrer le modèle User personnalisé avec filtrage
admin.site.register(User, FilteredUserAdmin)

@admin.register(ClientInvitation)
class ClientInvitationAdmin(FilteredClientInvitationAdmin):
    """Administration des invitations clients"""
    
    list_display = ('contact_name', 'contact_email', 'status', 'created_at', 'expires_at', 'sent_by', 'get_actions')
    list_filter = ('status', 'created_at', 'expires_at')
    search_fields = ('contact_name', 'contact_email', 'contact_subject')
    readonly_fields = ('invitation_token', 'created_at', 'used_at', 'created_user', 'ip_address_used', 'user_agent_used')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Informations du contact', {
            'fields': ('contact_name', 'contact_email', 'contact_subject', 'contact_message')
        }),
        ('Invitation', {
            'fields': ('invitation_token', 'status', 'expires_at', 'sent_by')
        }),
        ('Utilisation', {
            'fields': ('used_at', 'created_user', 'ip_address_used', 'user_agent_used'),
            'classes': ('collapse',)
        }),
    )
    
    def get_actions(self, obj):
        """Affiche les actions disponibles"""
        actions = []
        
        if obj.status == 'pending' and not obj.is_expired():
            # Bouton pour envoyer l'invitation
            send_url = reverse('admin:send_invitation', args=[obj.pk])
            actions.append(f'<a href="{send_url}" class="button">📧 Envoyer</a>')
            
            # Bouton pour copier le lien
            copy_link = f'<button onclick="copyInvitationLink(\'{obj.get_invitation_url()}\')">🔗 Copier lien</button>'
            actions.append(copy_link)
        
        if obj.status == 'pending':
            # Bouton pour annuler
            cancel_url = reverse('admin:cancel_invitation', args=[obj.pk])
            actions.append(f'<a href="{cancel_url}" class="button" style="background-color: #dc3545;">❌ Annuler</a>')
        
        return format_html(' '.join(actions)) if actions else '-'
    
    get_actions.short_description = 'Actions'
    get_actions.allow_tags = True
    
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:invitation_id>/send/', self.admin_site.admin_view(self.send_invitation_view), name='send_invitation'),
            path('<int:invitation_id>/cancel/', self.admin_site.admin_view(self.cancel_invitation_view), name='cancel_invitation'),
        ]
        return custom_urls + urls
    
    def send_invitation_view(self, request, invitation_id):
        """Vue pour envoyer une invitation"""
        try:
            invitation = ClientInvitation.objects.get(pk=invitation_id)
            
            if not invitation.is_valid():
                messages.error(request, "Cette invitation n'est plus valide.")
                return HttpResponseRedirect(reverse('admin:accounts_clientinvitation_changelist'))
            
            # Ici vous pouvez ajouter la logique d'envoi d'email
            # Pour l'instant, on simule l'envoi
            messages.success(request, f"Invitation envoyée à {invitation.contact_email}")
            
        except ClientInvitation.DoesNotExist:
            messages.error(request, "Invitation introuvable.")
        
        return HttpResponseRedirect(reverse('admin:accounts_clientinvitation_changelist'))
    
    def cancel_invitation_view(self, request, invitation_id):
        """Vue pour annuler une invitation"""
        try:
            invitation = ClientInvitation.objects.get(pk=invitation_id)
            invitation.status = 'cancelled'
            invitation.save()
            messages.success(request, f"Invitation pour {invitation.contact_email} annulée.")
            
        except ClientInvitation.DoesNotExist:
            messages.error(request, "Invitation introuvable.")
        
        return HttpResponseRedirect(reverse('admin:accounts_clientinvitation_changelist'))
    
    class Media:
        js = ('admin/js/invitation_actions.js',)

@admin.register(LoginAttempt)
class LoginAttemptAdmin(FilteredLoginAttemptAdmin):
    """Administration des tentatives de connexion"""
    
    list_display = ('email', 'success', 'ip_address', 'timestamp', 'failure_reason')
    list_filter = ('success', 'timestamp')
    search_fields = ('email', 'ip_address')
    readonly_fields = ('user', 'email', 'ip_address', 'user_agent', 'success', 'timestamp', 'failure_reason')
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        return False

@admin.register(SecurityEvent)
class SecurityEventAdmin(FilteredSecurityEventAdmin):
    """Administration des événements de sécurité"""
    
    list_display = ('user', 'event_type', 'ip_address', 'timestamp')
    list_filter = ('event_type', 'timestamp')
    search_fields = ('user__email', 'description', 'ip_address')
    readonly_fields = ('user', 'event_type', 'description', 'ip_address', 'timestamp', 'metadata')
    ordering = ('-timestamp',)
    
    def has_add_permission(self, request):
        return False

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """Administration des messages de contact"""
    
    list_display = ('name', 'email', 'subject', 'created_at', 'read', 'is_recent')
    list_filter = ('read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at', 'is_recent')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Informations du contact', {
            'fields': ('name', 'email', 'subject')
        }),
        ('Message', {
            'fields': ('message',)
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'read', 'is_recent'),
            'classes': ('collapse',)
        }),
    )
    
    def mark_as_read(self, request, queryset):
        """Action pour marquer les messages comme lus"""
        updated = queryset.update(read=True)
        self.message_user(request, f'{updated} message(s) marqué(s) comme lu(s).')
    mark_as_read.short_description = "Marquer comme lu"
    
    def mark_as_unread(self, request, queryset):
        """Action pour marquer les messages comme non lus"""
        updated = queryset.update(read=False)
        self.message_user(request, f'{updated} message(s) marqué(s) comme non lu(s).')
    mark_as_unread.short_description = "Marquer comme non lu"
    
    actions = ['mark_as_read', 'mark_as_unread']

# Enregistrer UserProfile avec filtrage
@admin.register(UserProfile)
class UserProfileAdmin(FilteredUserProfileAdmin):
    """Administration des profils utilisateurs avec isolation"""
    pass
