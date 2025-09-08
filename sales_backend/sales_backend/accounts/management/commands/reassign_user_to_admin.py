from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Réassigne un utilisateur d\'un admin à un autre'

    def add_arguments(self, parser):
        parser.add_argument('user_email', type=str, help='Email de l\'utilisateur à réassigner')
        parser.add_argument('new_admin_email', type=str, help='Email du nouvel admin')

    def handle(self, *args, **options):
        user_email = options['user_email']
        new_admin_email = options['new_admin_email']
        
        try:
            # Trouver l'utilisateur
            user = User.objects.get(email=user_email)
            profile = user.profile
            
            # Trouver le nouvel admin
            new_admin = User.objects.get(email=new_admin_email, is_staff=True)
            
            old_admin = profile.created_by.email if profile.created_by else "Aucun"
            
            # Réassigner
            profile.created_by = new_admin
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ {user_email} réassigné de {old_admin} vers {new_admin_email}'
                )
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Utilisateur ou admin introuvable')
            )
