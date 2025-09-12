from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_invitation_email_async(self, invitation_id, invitation_url, custom_message=''):
    """
    Tâche Celery pour envoi asynchrone d'emails d'invitation
    Garantit un envoi rapide et fiable avec retry automatique
    """
    try:
        from .models import ClientInvitation
        
        # Récupérer l'invitation
        invitation = ClientInvitation.objects.get(id=invitation_id)
        
        # Préparer le contenu de l'email
        subject = f"Invitation à rejoindre Sales Tracker Pro - {invitation.contact_subject}"
        
        # Template HTML professionnel
        html_context = {
            'contact_name': invitation.contact_name,
            'invitation_url': invitation_url,
            'custom_message': custom_message,
            'contact_subject': invitation.contact_subject,
            'expires_at': invitation.expires_at,
        }
        
        html_message = render_to_string('accounts/invitation_email.html', html_context)
        
        # Message texte brut
        plain_message = f"""
Bonjour {invitation.contact_name},

Vous êtes invité(e) à rejoindre Sales Tracker Pro pour gérer vos ventes et commissions.

Sujet de votre demande: {invitation.contact_subject}

{custom_message if custom_message else ''}

Pour créer votre compte, cliquez sur ce lien:
{invitation_url}

Ce lien expire le {invitation.expires_at.strftime('%d/%m/%Y à %H:%M')}.

Cordialement,
L'équipe Sales Tracker Pro
        """.strip()
        
        # Log de début d'envoi
        logger.info(f"🚀 [ASYNC] Envoi email à {invitation.contact_email} (ID: {invitation_id})")
        
        # Créer et envoyer l'email
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[invitation.contact_email]
        )
        email.attach_alternative(html_message, "text/html")
        
        # Envoi immédiat
        result = email.send()
        
        # Mettre à jour le statut de l'invitation
        invitation.status = 'sent'
        invitation.sent_at = timezone.now()
        invitation.save()
        
        logger.info(f"✅ [ASYNC] Email envoyé avec succès à {invitation.contact_email}")
        
        return {
            'success': True,
            'email': invitation.contact_email,
            'sent_at': timezone.now().isoformat(),
            'result': result
        }
        
    except ClientInvitation.DoesNotExist:
        logger.error(f"❌ [ASYNC] Invitation {invitation_id} introuvable")
        return {'success': False, 'error': 'Invitation introuvable'}
        
    except Exception as exc:
        logger.error(f"❌ [ASYNC] Erreur envoi email (tentative {self.request.retries + 1}): {str(exc)}")
        
        # Retry automatique avec délai exponentiel
        if self.request.retries < self.max_retries:
            # Délai: 10s, 30s, 90s
            countdown = 10 * (3 ** self.request.retries)
            logger.info(f"🔄 [ASYNC] Nouvelle tentative dans {countdown}s...")
            raise self.retry(countdown=countdown, exc=exc)
        
        # Échec définitif après 3 tentatives
        logger.error(f"💥 [ASYNC] Échec définitif après {self.max_retries} tentatives")
        return {
            'success': False, 
            'error': str(exc),
            'retries_exhausted': True
        }

@shared_task
def send_bulk_invitations_async(invitation_ids):
    """
    Envoi en lot d'invitations pour optimiser les performances
    """
    results = []
    
    for invitation_id in invitation_ids:
        try:
            from .models import ClientInvitation
            invitation = ClientInvitation.objects.get(id=invitation_id)
            invitation_url = invitation.get_invitation_url()
            
            # Lancer l'envoi asynchrone
            task_result = send_invitation_email_async.delay(invitation_id, invitation_url)
            results.append({
                'invitation_id': invitation_id,
                'task_id': task_result.id,
                'email': invitation.contact_email
            })
            
        except Exception as e:
            results.append({
                'invitation_id': invitation_id,
                'error': str(e)
            })
    
    return results
