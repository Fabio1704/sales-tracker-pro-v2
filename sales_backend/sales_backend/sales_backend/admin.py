from django.contrib import admin
from django.contrib.admin import AdminSite

class CustomAdminSite(AdminSite):
    """Site admin personnalisé avec titre dynamique selon l'utilisateur"""
    
    def each_context(self, request):
        """Personnaliser le contexte selon l'utilisateur connecté"""
        context = super().each_context(request)
        
        if request.user.email == 'tahiantsaoFabio17@gmail.com':
            context['site_title'] = 'Sales Tracker Pro - Super Admin'
            context['site_header'] = 'Administration Super Admin'
            context['index_title'] = 'Panneau Super Admin'
        else:
            # Pour les clients-admins
            user_name = f"{request.user.first_name} {request.user.last_name}".strip()
            if not user_name:
                user_name = request.user.username
            context['site_title'] = f'Sales Tracker Pro - {user_name}'
            context['site_header'] = f'Tableau de Bord - {user_name}'
            context['index_title'] = 'Mon Espace Client'
        
        return context

# Remplacer le site admin par défaut
admin_site = CustomAdminSite(name='custom_admin')
admin.site = admin_site
admin.sites.site = admin_site
