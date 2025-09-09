# sales_tracker/urls.py (le fichier principal)
from django.urls import include, path
from django.contrib import admin
from django.views.static import serve
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf.urls.static import static
from django.http import JsonResponse

# Vue simple pour la page d'accueil
def home_view(request):
    return JsonResponse({
        'message': 'Sales Tracker API',
        'version': '1.0',
        'endpoints': {
            'api': '/api/',
            'admin': '/admin/',
            'docs': '/api/docs/'
        }
    })

urlpatterns = [
    path('', home_view, name='home'),  # Page d'accueil
    path('api/', include('sales.urls')),  # Inclut toutes les routes API
    path('api/accounts/', include('accounts.urls')),  # Routes des comptes et invitations
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('admin/', admin.site.urls),
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Servir les fichiers statiques en production
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)