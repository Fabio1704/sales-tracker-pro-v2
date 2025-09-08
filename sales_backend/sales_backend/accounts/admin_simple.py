from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms
from .validators_simple import validate_real_email

User = get_user_model()

class SimpleUserAdmin(BaseUserAdmin):
    """Admin simplifié pour éviter les conflits"""
    
    # Ajouter les nouveaux champs à l'affichage
    list_display = BaseUserAdmin.list_display + ('two_factor_enabled', 'email_verified', 'firebase_uid')
    
    # Ajouter les champs dans les fieldsets
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Sécurité avancée', {
            'fields': ('two_factor_enabled', 'firebase_uid', 'fcm_token', 'failed_login_attempts', 'account_locked_until')
        }),
        ('Vérifications', {
            'fields': ('email_verified', 'phone_number', 'phone_verified')
        }),
    )

# Enregistrer l'admin personnalisé
admin.site.register(User, SimpleUserAdmin)
