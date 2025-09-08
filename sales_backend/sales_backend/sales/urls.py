from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ModelProfileViewSet, DailySaleViewSet, 
    StatsView, PDFReportView, AdminUserViewSet, AdminModelProfileViewSet, AdminDailySaleViewSet,
    UserViewSet, current_user
)

router = DefaultRouter()
router.register(r'modelprofiles', ModelProfileViewSet, basename='modelprofile')
router.register(r'dailysales', DailySaleViewSet, basename='dailysale')
router.register(r'users', UserViewSet, basename='user')

# Routes d'administration
router.register(r'admin/models', AdminModelProfileViewSet, basename='admin-model')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
router.register(r'admin/sales', AdminDailySaleViewSet, basename='admin-sales')

urlpatterns = [
    # Authentification JWT
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Endpoint pour l'utilisateur courant
    path('users/me/', current_user, name='current-user'),
    
    path('', include(router.urls)),
    
    path('dailysales/stats/', StatsView.as_view(), name='stats'),
    path('dailysales/stats/pdf/', PDFReportView.as_view(), name='stats-pdf'),
    
    # Routes pour les résumés
    path('dailysales/summary/daily/', StatsView.as_view(), name='daily-summary'),
    path('dailysales/summary/weekly/', StatsView.as_view(), name='weekly-summary'),
    path('dailysales/summary/monthly/', StatsView.as_view(), name='monthly-summary'),
    
    # Routes admin (accès complet pour les admins) - supprimées car maintenant dans le router
    
]