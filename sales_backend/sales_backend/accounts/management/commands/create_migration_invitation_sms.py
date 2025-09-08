from django.core.management.base import BaseCommand
from django.db import migrations, models

class Command(BaseCommand):
    help = 'Crée une migration pour ajouter les champs SMS aux invitations'

    def handle(self, *args, **options):
        """Crée manuellement la migration pour les invitations SMS"""
        
        migration_content = '''# Generated manually for SMS invitations
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),  # Ajustez selon votre dernière migration
    ]

    operations = [
        migrations.AddField(
            model_name='clientinvitation',
            name='contact_phone',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='clientinvitation',
            name='invitation_type',
            field=models.CharField(choices=[('email', 'Email'), ('sms', 'SMS')], default='email', max_length=10),
        ),
        migrations.AlterField(
            model_name='clientinvitation',
            name='contact_email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
'''
        
        # Écrire le fichier de migration
        import os
        from django.conf import settings
        
        migrations_dir = os.path.join(settings.BASE_DIR, 'accounts', 'migrations')
        os.makedirs(migrations_dir, exist_ok=True)
        
        # Trouver le prochain numéro de migration
        existing_migrations = [f for f in os.listdir(migrations_dir) if f.startswith('0') and f.endswith('.py')]
        if existing_migrations:
            last_number = max([int(f.split('_')[0]) for f in existing_migrations])
            next_number = f"{last_number + 1:04d}"
        else:
            next_number = "0002"
        
        migration_file = os.path.join(migrations_dir, f'{next_number}_add_sms_invitation_fields.py')
        
        with open(migration_file, 'w', encoding='utf-8') as f:
            f.write(migration_content)
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Migration créée: {migration_file}')
        )
        self.stdout.write(
            self.style.WARNING('🔄 Exécutez maintenant: python manage.py migrate')
        )
