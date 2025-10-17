from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Crée un superutilisateur avec des credentials depuis les variables d\'environnement'

    def handle(self, *args, **options):
        # Récupère les credentials depuis les variables d'environnement
        username = os.getenv('ADMIN_USERNAME', 'admin')
        email = os.getenv('ADMIN_EMAIL', 'admin@salestracker.com')
        password = os.getenv('ADMIN_PASSWORD', 'Admin@123456')
        
        # Vérifie si l'utilisateur existe déjà
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'L\'utilisateur {username} existe déjà'))
            return
        
        try:
            # Crée le superuser
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(
                f'✅ Superutilisateur créé!\n'
                f'   Username: {username}\n'
                f'   Email: {email}\n'
                f'   Password: {password}'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur: {str(e)}'))
