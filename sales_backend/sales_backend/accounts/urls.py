from django.urls import path
from . import views
from . import views_invitation
from . import views_contact_messages

urlpatterns = [
    # Authentification
    path('users/me/', views.current_user, name='current_user'),
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/stats/', views.admin_stats, name='admin-stats'),
    
    # Admin endpoints
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    
    # Réinitialisation de mot de passe
    path('accounts/password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('accounts/password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Messages de contact
    path('contact-messages/', views_contact_messages.ContactMessageCreateView.as_view(), name='contact-message-create'),
    path('contact-messages/list/', views_contact_messages.ContactMessageListView.as_view(), name='contact-message-list'),
    path('contact-messages/<int:message_id>/read/', views_contact_messages.mark_message_as_read, name='mark-message-read'),
    path('contact-messages/unread-count/', views_contact_messages.unread_messages_count, name='unread-messages-count'),
    
    # Invitations clients
    path('invitations/', views_invitation.ClientInvitationListCreateView.as_view(), name='client-invitation-list-create'),
    path('invitations/<int:pk>/', views_invitation.ClientInvitationDetailView.as_view(), name='client-invitation-detail'),
    path('invitations/<int:pk>/resend/', views_invitation.resend_invitation, name='resend-invitation'),
    path('invitations/signup/<str:token>/', views_invitation.client_signup, name='client_signup'),
    path('invitations/validate-token/<str:token>/', views_invitation.validate_invitation_token, name='validate_invitation_token'),
]
    # Firebase et 2FA (désactivé)
    # path('enable-2fa/', views_firebase.enable_2fa, name='enable_2fa'),
    # path('verify-2fa/', views_firebase.verify_2fa, name='verify_2fa'),
    # path('fcm-token/', views_firebase.save_fcm_token, name='save_fcm_token'),
    # path('send-notification/', views_firebase.send_notification, name='send_notification'),