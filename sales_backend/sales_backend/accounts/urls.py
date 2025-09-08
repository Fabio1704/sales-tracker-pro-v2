from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, views_invitation, views_firebase, views_contact_invitations

urlpatterns = [
    
    # Authentification
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('validate-email/', views.validate_email, name='validate_email'),
    
    # Réinitialisation de mot de passe
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Invitations clients
    path('client-invitations/', views_invitation.create_client_invitation, name='create_client_invitation'),
    path('send-invitation/', views_invitation.send_client_invitation, name='send_client_invitation'),
    path('signup/<str:token>/', views_invitation.ClientSignupView.as_view(), name='client_signup'),
    
    # Invitations depuis contact (email/SMS)
    path('contact-invitations/', views_contact_invitations.create_contact_invitation, name='create_contact_invitation'),
    path('validate-token/<str:token>/', views_contact_invitations.validate_invitation_token, name='validate_invitation_token'),
    
    # Firebase et 2FA (désactivé)
    # path('enable-2fa/', views_firebase.enable_2fa, name='enable_2fa'),
    # path('verify-2fa/', views_firebase.verify_2fa, name='verify_2fa'),
    # path('fcm-token/', views_firebase.save_fcm_token, name='save_fcm_token'),
    # path('send-notification/', views_firebase.send_notification, name='send_notification'),
]