from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Corrige l\'isolation des administrateurs - chaque admin ne voit que son propre compte'

    def handle(self, *args, **options):
        self.stdout.write('Correction de l\'isolation des administrateurs...')
        
        # Vérifier tous les utilisateurs staff
        staff_users = User.objects.filter(is_staff=True, is_superuser=False)
        
        self.stdout.write(f'Utilisateurs staff trouvés: {staff_users.count()}')
        
        for user in staff_users:
            self.stdout.write(f'- {user.email} (ID: {user.id})')
            
            # Vérifier si le profil existe
            try:
                profile = user.profile
                self.stdout.write(f'  Profil: créé par {profile.created_by.email if profile.created_by else "Système"}')
                
                # Corriger le created_by si nécessaire
                if not profile.created_by:
                    profile.created_by = user
                    profile.save()
                    self.stdout.write(f'  ✓ Profil corrigé: created_by = {user.email}')
                    
            except UserProfile.DoesNotExist:
                # Créer le profil manquant
                profile = UserProfile.objects.create(
                    user=user,
                    created_by=user
                )
                self.stdout.write(f'  ✓ Profil créé: created_by = {user.email}')
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS('Correction terminée! Chaque admin ne voit maintenant que son propre compte.')
        )
        self.stdout.write('Redémarrez le serveur Django pour appliquer les changements.')
