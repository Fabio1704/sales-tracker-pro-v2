# sales_tracker/urls.py (le fichier principal)
from django.urls import include, path
from django.contrib import admin
from django.views.static import serve
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView  # ⬅️ IMPORT AJOUTÉ
from django.conf.urls.static import static


urlpatterns = [
    path('api/', include('sales.urls')),  # Inclut toutes les routes API
    path('api/accounts/', include('accounts.urls')),  # Routes des comptes et invitations
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # ⬅️ LIGNE AJOUTÉE
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # ⬅️ LIGNE AJOUTÉE
    path('admin/', admin.site.urls),
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)