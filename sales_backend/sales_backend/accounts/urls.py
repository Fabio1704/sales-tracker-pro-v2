from django.urls import path
from . import views
from . import views_invitation
from . import views_contact_messages
from . import views_contact_invitations
from . import views_client_signup

urlpatterns = [
    # Authentification
    path('users/me/', views.MeView.as_view(), name='current_user'),
    path('users/', views.AdminUserView.as_view(), name='user-list-create'),
    
    # Admin endpoints
    path('admin/users/', views.AdminUserView.as_view(), name='admin-user-list'),
    path('admin/users/<int:user_id>/', views.AdminUserView.as_view(), name='admin-user-delete'),
    
    # Réinitialisation de mot de passe
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Messages de contact
    path('contact-messages/', views_contact_messages.ContactMessageCreateView.as_view(), name='contact-message-create'),
    path('contact-messages/list/', views_contact_messages.ContactMessageListView.as_view(), name='contact-message-list'),
    path('contact-messages/<int:message_id>/read/', views_contact_messages.mark_message_as_read, name='mark-message-read'),
    path('contact-messages/<int:message_id>/', views_contact_messages.delete_message, name='delete-message'),
    path('contact-messages/unread-count/', views_contact_messages.unread_messages_count, name='unread-messages-count'),
    
    # Invitations clients (simplified)
    path('invitations/send/', views_invitation.send_client_invitation, name='send-client-invitation'),
    
    # Création d'invitations depuis contact
    path('create-contact-invitation/', views_contact_invitations.create_contact_invitation, name='create-contact-invitation'),
    
    # Inscription client avec token
    path('signup/<str:token>/', views_client_signup.client_signup_with_token, name='client-signup-with-token'),
]
    # Firebase et 2FA (désactivé)
    # path('enable-2fa/', views_firebase.enable_2fa, name='enable_2fa'),
    # path('verify-2fa/', views_firebase.verify_2fa, name='verify_2fa'),
    # path('fcm-token/', views_firebase.save_fcm_token, name='save_fcm_token'),
    # path('send-notification/', views_firebase.send_notification, name='send_notification'),