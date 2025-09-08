from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from .models import UserProfile, ClientInvitation, LoginAttempt, SecurityEvent
from sales.models import ModelProfile, DailySale

def create_admin_permissions():
    """Crée les permissions spécifiques pour les administrateurs clients"""
    
    # Permissions pour les modèles accounts
    accounts_models = [UserProfile, ClientInvitation, LoginAttempt, SecurityEvent]
    sales_models = [ModelProfile, DailySale]
    
    permissions_to_create = []
    
    # Permissions pour les modèles accounts
    for model in accounts_models:
        content_type = ContentType.objects.get_for_model(model)
        permissions_to_create.extend([
            f'view_{model._meta.model_name}',
            f'add_{model._meta.model_name}',
            f'change_{model._meta.model_name}',
            f'delete_{model._meta.model_name}',
        ])
    
    # Permissions pour les modèles sales
    for model in sales_models:
        content_type = ContentType.objects.get_for_model(model)
        permissions_to_create.extend([
            f'view_{model._meta.model_name}',
            f'add_{model._meta.model_name}',
            f'change_{model._meta.model_name}',
            f'delete_{model._meta.model_name}',
        ])
    
    # Créer le groupe "Client Admin"
    client_admin_group, created = Group.objects.get_or_create(
        name='Client Admin',
        defaults={'name': 'Client Admin'}
    )
    
    # Assigner toutes les permissions au groupe
    for perm_codename in permissions_to_create:
        try:
            # Trouver le modèle correspondant
            model_name = perm_codename.split('_', 1)[1]
            for model in accounts_models + sales_models:
                if model._meta.model_name == model_name:
                    content_type = ContentType.objects.get_for_model(model)
                    permission, created = Permission.objects.get_or_create(
                        codename=perm_codename,
                        content_type=content_type,
                        defaults={'name': f'Can {perm_codename.split("_")[0]} {model._meta.verbose_name}'}
                    )
                    client_admin_group.permissions.add(permission)
                    break
        except Exception as e:
            print(f"Erreur création permission {perm_codename}: {e}")
    
    return client_admin_group

def assign_client_admin_permissions(user):
    """Assigne les permissions d'admin client à un utilisateur"""
    try:
        client_admin_group = create_admin_permissions()
        user.groups.add(client_admin_group)
        user.is_staff = True
        user.save()
        return True
    except Exception as e:
        print(f"Erreur assignation permissions à {user.email}: {e}")
        return False
