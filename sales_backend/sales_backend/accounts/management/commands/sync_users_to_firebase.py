from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile
# Firebase désactivé - utilisateurs gérés uniquement dans Django
# from accounts.firebase_config import FirebaseConfig
# from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'COMMANDE DÉSACTIVÉE - Firebase Authentication désactivé, utilisateurs gérés uniquement dans Django'

    def handle(self, *args, **options):
        """Commande désactivée - Firebase Authentication n'est plus utilisé"""
        self.stdout.write(self.style.WARNING('⚠️ Cette commande est désactivée.'))
        self.stdout.write(self.style.WARNING('🔒 Firebase Authentication a été désactivé.'))
        self.stdout.write(self.style.SUCCESS('✅ Les utilisateurs sont maintenant gérés uniquement dans Django.'))
        self.stdout.write(self.style.SUCCESS('📱 Seules les notifications push Firebase restent actives.'))
        
        # Afficher les statistiques Django uniquement
        users = User.objects.all()
        self.stdout.write(f'\n📊 Statistiques Django:')
        self.stdout.write(f'   👥 Total utilisateurs Django: {users.count()}')
        
        # Compter les profils
        try:
            profiles = UserProfile.objects.all()
            self.stdout.write(f'   📋 Profils utilisateurs: {profiles.count()}')
        except:
            self.stdout.write(f'   📋 Profils utilisateurs: Non disponible')
        
        self.stdout.write(f'\n💡 Pour gérer les utilisateurs, utilisez l\'interface admin Django:')
