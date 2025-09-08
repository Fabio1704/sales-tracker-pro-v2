from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Corrige les profils utilisateurs existants pour assigner created_by correctement'

    def handle(self, *args, **options):
        # Récupérer tous les profils sans created_by
        profiles_without_creator = UserProfile.objects.filter(created_by__isnull=True)
        
        self.stdout.write(f"Trouvé {profiles_without_creator.count()} profils sans créateur")
        
        fixed_count = 0
        for profile in profiles_without_creator:
            user = profile.user
            
            # Si l'utilisateur est staff, il devient son propre créateur
            if user.is_staff:
                profile.created_by = user
                profile.save()
                fixed_count += 1
                self.stdout.write(f"✓ Admin {user.email} assigné comme son propre créateur")
            else:
                # Pour les utilisateurs normaux, essayer de trouver qui les a créés
                # En regardant les logs ou en demandant à l'admin de les réassigner
                self.stdout.write(f"⚠ Utilisateur normal {user.email} nécessite assignation manuelle")
        
        self.stdout.write(
            self.style.SUCCESS(f'Correction terminée: {fixed_count} profils corrigés')
        )
