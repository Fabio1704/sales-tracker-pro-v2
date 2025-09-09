from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Créer la migration pour le modèle ContactMessage'

    def handle(self, *args, **options):
        self.stdout.write('Création de la migration pour ContactMessage...')
        
        try:
            call_command('makemigrations', 'accounts', verbosity=2)
            self.stdout.write(
                self.style.SUCCESS('Migration créée avec succès')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de la création de la migration: {e}')
            )
