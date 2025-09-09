from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Créer un compte admin personnalisé'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Email de l\'admin')
        parser.add_argument('--username', type=str, help='Nom d\'utilisateur')
        parser.add_argument('--password', type=str, help='Mot de passe')

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username') or email
        password = options.get('password')

        if not email or not password:
            self.stdout.write(
                self.style.ERROR('Email et mot de passe requis')
            )
            return

        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Utilisateur {email} mis à jour avec les permissions admin')
            )
        else:
            # Créer un nouvel utilisateur admin
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(f'Nouvel utilisateur admin créé: {email}')
            )

        self.stdout.write(
            self.style.SUCCESS(f'Vous pouvez maintenant vous connecter avec:')
        )
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Admin Django: https://sales-tracker-pro-v2.onrender.com/admin/')
