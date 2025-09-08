from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Assigne les utilisateurs normaux à un admin spécifique'

    def add_arguments(self, parser):
        parser.add_argument('admin_email', type=str, help='Email de l\'admin qui a créé les utilisateurs')
        parser.add_argument('user_emails', nargs='+', help='Emails des utilisateurs à assigner')

    def handle(self, *args, **options):
        admin_email = options['admin_email']
        user_emails = options['user_emails']
        
        try:
            # Trouver l'admin
            admin_user = User.objects.get(email=admin_email, is_staff=True)
            self.stdout.write(f"Admin trouvé: {admin_user.email}")
            
            assigned_count = 0
            for user_email in user_emails:
                try:
                    user = User.objects.get(email=user_email)
                    profile = user.profile
                    
                    if profile.created_by is None:
                        profile.created_by = admin_user
                        profile.save()
                        assigned_count += 1
                        self.stdout.write(f"✓ {user_email} assigné à {admin_email}")
                    else:
                        self.stdout.write(f"⚠ {user_email} déjà assigné à {profile.created_by.email}")
                        
                except User.DoesNotExist:
                    self.stdout.write(f"✗ Utilisateur {user_email} introuvable")
            
            self.stdout.write(
                self.style.SUCCESS(f'Assignation terminée: {assigned_count} utilisateurs assignés')
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Admin {admin_email} introuvable ou pas staff')
            )
