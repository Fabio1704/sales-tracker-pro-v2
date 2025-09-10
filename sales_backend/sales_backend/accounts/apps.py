from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
    
    def ready(self):
        # Importer les permissions admin personnalisées
        import accounts.admin_custom
        # Importer les signaux pour auto-création des profils
        try:
            import accounts.signals
        except ImportError:
            pass
