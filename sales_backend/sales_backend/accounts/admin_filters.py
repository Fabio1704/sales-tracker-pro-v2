from django.contrib import admin
from django.contrib.auth.models import User
from django.db.models import Q
from .models import UserProfile, ClientInvitation, LoginAttempt, SecurityEvent


class AdminDataFilterMixin:
    """Mixin pour filtrer les données par admin propriétaire"""
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        
        # Si c'est un superuser, voir toutes les données
        if request.user.is_superuser:
            return qs
        
        # Sinon, filtrer par propriétaire/créateur
        if hasattr(self.model, 'created_by'):
            return qs.filter(created_by=request.user)
        elif hasattr(self.model, 'owner'):
            return qs.filter(owner=request.user)
        elif hasattr(self.model, 'sent_by'):
            return qs.filter(sent_by=request.user)
        elif self.model == User:
            # L'admin voit son propre compte ET les utilisateurs qu'il a créés
            from .models import UserProfile
            user_profiles_created = UserProfile.objects.filter(created_by=request.user).values_list('user_id', flat=True)
            return qs.filter(Q(id=request.user.id) | Q(id__in=user_profiles_created))
        
        return qs
    
    def has_change_permission(self, request, obj=None):
        """Vérifier les permissions de modification"""
        if not super().has_change_permission(request, obj):
            return False
        
        if obj is None or request.user.is_superuser:
            return True
        
        # Vérifier la propriété
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        elif hasattr(obj, 'owner') and obj.owner == request.user:
            return True
        elif hasattr(obj, 'sent_by') and obj.sent_by == request.user:
            return True
        elif isinstance(obj, User) and hasattr(obj, 'profile') and obj.profile.created_by == request.user:
            return True
        elif obj == request.user:  # L'admin peut modifier son propre compte
            return True
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Vérifier les permissions de suppression - seuls les superusers peuvent supprimer des admins"""
        if not super().has_delete_permission(request, obj):
            return False
        
        # Seuls les superusers peuvent supprimer des utilisateurs
        if not request.user.is_superuser:
            return False
        
        return True


class UserProfileInline(admin.TabularInline):
    model = UserProfile
    extra = 0
    readonly_fields = ('firebase_uid', 'created_by', 'last_password_change')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(created_by=request.user)


class FilteredUserAdmin(AdminDataFilterMixin, admin.ModelAdmin):
    """Admin des utilisateurs avec filtrage par propriétaire"""
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'date_joined', 'get_created_by')
    list_filter = ('is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    inlines = [UserProfileInline]
    
    def get_created_by(self, obj):
        """Afficher qui a créé cet utilisateur"""
        if hasattr(obj, 'profile') and obj.profile.created_by:
            return obj.profile.created_by.email
        return "Système"
    get_created_by.short_description = "Créé par"
    
    def save_model(self, request, obj, form, change):
        """Assigner le créateur lors de la création"""
        super().save_model(request, obj, form, change)
        
        # Créer ou mettre à jour le profil avec le créateur
        if not change:  # Nouveau utilisateur
            # Donner les permissions staff aux nouveaux utilisateurs créés par un admin
            if not obj.is_superuser:
                obj.is_staff = True
                obj.save()
            
            profile, created = UserProfile.objects.get_or_create(
                user=obj,
                defaults={'created_by': request.user}
            )
            if not created and not profile.created_by:
                profile.created_by = request.user
                profile.save()


class FilteredClientInvitationAdmin(AdminDataFilterMixin, admin.ModelAdmin):
    """Admin des invitations avec filtrage par propriétaire"""
    list_display = ('contact_email', 'contact_name', 'status', 'created_at', 'sent_by', 'owner')
    list_filter = ('status', 'created_at')
    search_fields = ('contact_email', 'contact_name')
    readonly_fields = ('invitation_token', 'created_at', 'used_at', 'sent_by', 'owner')


class FilteredUserProfileAdmin(AdminDataFilterMixin, admin.ModelAdmin):
    """Admin des profils utilisateurs avec filtrage par propriétaire"""
    list_display = ('user', 'created_by', 'two_factor_enabled', 'email_verified', 'firebase_uid')
    list_filter = ('two_factor_enabled', 'email_verified')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('firebase_uid', 'created_by', 'last_password_change')


class FilteredLoginAttemptAdmin(AdminDataFilterMixin, admin.ModelAdmin):
    """Admin des tentatives de connexion avec filtrage"""
    list_display = ('email', 'success', 'timestamp', 'ip_address')
    list_filter = ('success', 'timestamp')
    search_fields = ('email', 'ip_address')
    readonly_fields = ('user', 'email', 'ip_address', 'user_agent', 'success', 'timestamp', 'failure_reason')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Filtrer par les utilisateurs créés par cet admin
        return qs.filter(
            Q(user__profile__created_by=request.user) |
            Q(user=request.user)
        )


class FilteredSecurityEventAdmin(AdminDataFilterMixin, admin.ModelAdmin):
    """Admin des événements de sécurité avec filtrage"""
    list_display = ('user', 'event_type', 'timestamp', 'ip_address')
    list_filter = ('event_type', 'timestamp')
    search_fields = ('user__email', 'description')
    readonly_fields = ('user', 'event_type', 'description', 'ip_address', 'timestamp', 'metadata')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Filtrer par les utilisateurs créés par cet admin
        return qs.filter(
            Q(user__profile__created_by=request.user) |
            Q(user=request.user)
        )
