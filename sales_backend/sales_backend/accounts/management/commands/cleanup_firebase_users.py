from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile
from accounts.firebase_config import FirebaseConfig
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Supprime tous les utilisateurs de Firebase Authentication et nettoie les firebase_uid'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirme la suppression (obligatoire pour exécuter)',
        )

    def handle(self, *args, **options):
        """Nettoie complètement Firebase Authentication"""
        
        if not options['confirm']:
            self.stdout.write(self.style.ERROR('⚠️ ATTENTION: Cette commande va supprimer TOUS les utilisateurs de Firebase Authentication!'))
            self.stdout.write(self.style.WARNING('Pour confirmer, utilisez: python manage.py cleanup_firebase_users --confirm'))
            return
        
        self.stdout.write(self.style.WARNING('🧹 Début du nettoyage Firebase Authentication...'))
        
        # Initialiser Firebase
        try:
            FirebaseConfig.initialize_firebase()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur initialisation Firebase: {e}'))
            return
        
        users_deleted = 0
        profiles_cleaned = 0
        
        # 1. Supprimer tous les utilisateurs de Firebase Authentication
        try:
            # Lister tous les utilisateurs Firebase
            page = auth.list_users()
            firebase_users = []
            
            while page:
                firebase_users.extend(page.users)
                page = page.get_next_page()
            
            self.stdout.write(f'📊 Trouvé {len(firebase_users)} utilisateurs dans Firebase Authentication')
            
            # Supprimer chaque utilisateur Firebase
            for firebase_user in firebase_users:
                try:
                    auth.delete_user(firebase_user.uid)
                    self.stdout.write(f'🗑️  Supprimé Firebase user: {firebase_user.email} (UID: {firebase_user.uid})')
                    users_deleted += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'❌ Erreur suppression {firebase_user.email}: {e}'))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur lors de la liste des utilisateurs Firebase: {e}'))
        
        # 2. Nettoyer les firebase_uid dans les profils Django
        try:
            profiles_with_firebase = UserProfile.objects.exclude(firebase_uid__isnull=True).exclude(firebase_uid='')
            
            for profile in profiles_with_firebase:
                old_uid = profile.firebase_uid
                profile.firebase_uid = None
                profile.save()
                self.stdout.write(f'🧽 Nettoyé firebase_uid pour {profile.user.email} (ancien UID: {old_uid})')
                profiles_cleaned += 1
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erreur nettoyage profils: {e}'))
        
        # Résumé
        self.stdout.write(self.style.SUCCESS(f'\n✅ Nettoyage Firebase terminé:'))
        self.stdout.write(f'   🗑️  Utilisateurs Firebase supprimés: {users_deleted}')
        self.stdout.write(f'   🧽 Profils Django nettoyés: {profiles_cleaned}')
        self.stdout.write(self.style.SUCCESS(f'\n🔒 Firebase Authentication est maintenant complètement vide'))
        self.stdout.write(self.style.SUCCESS(f'📱 Seules les notifications push Firebase restent actives'))
        
        # Vérification finale
        try:
            remaining_users = auth.list_users()
            if len(list(remaining_users.users)) == 0:
                self.stdout.write(self.style.SUCCESS(f'✅ Vérification: Firebase Authentication est vide'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️ Il reste {len(list(remaining_users.users))} utilisateurs dans Firebase'))
        except:
            pass
