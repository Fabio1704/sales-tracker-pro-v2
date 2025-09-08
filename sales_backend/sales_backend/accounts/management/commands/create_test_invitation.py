from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import ClientInvitation
from accounts.utils import generate_invitation_token, get_invitation_expiry
import uuid

class Command(BaseCommand):
    help = 'Crée une invitation de test pour tester le système d\'inscription'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='test@gmail.com',
            help='Email pour l\'invitation de test'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='Test User',
            help='Nom pour l\'invitation de test'
        )

    def handle(self, *args, **options):
        email = options['email']
        name = options['name']
        
        # Créer un superuser temporaire si nécessaire
        admin_user, created = User.objects.get_or_create(
            username='admin_test',
            defaults={
                'email': 'admin@test.com',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Admin',
                'last_name': 'Test'
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Utilisateur admin créé: {admin_user.username}')
            )
        
        # Supprimer les anciennes invitations pour cet email
        ClientInvitation.objects.filter(contact_email=email).delete()
        
        # Créer une nouvelle invitation
        invitation = ClientInvitation.objects.create(
            contact_name=name,
            contact_email=email,
            contact_subject='Test d\'invitation',
            contact_message='Ceci est une invitation de test pour tester le système d\'inscription automatique.',
            invitation_token=generate_invitation_token(),
            expires_at=get_invitation_expiry(),
            sent_by=admin_user,
            owner=admin_user
        )
        
        # Afficher l'URL d'invitation
        invitation_url = f'http://localhost:8000/api/accounts/client-signup/{invitation.invitation_token}/'
        
        self.stdout.write(
            self.style.SUCCESS(f'Invitation créée avec succès!')
        )
        self.stdout.write(f'Email: {invitation.contact_email}')
        self.stdout.write(f'Token: {invitation.invitation_token}')
        self.stdout.write(f'Expire le: {invitation.expires_at}')
        self.stdout.write(f'URL d\'inscription: {invitation_url}')
        self.stdout.write('')
        self.stdout.write(
            self.style.WARNING('Copiez cette URL dans votre navigateur pour tester l\'inscription:')
        )
        self.stdout.write(invitation_url)
