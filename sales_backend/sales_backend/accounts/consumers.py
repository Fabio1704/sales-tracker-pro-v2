import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

class AdminNotificationConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket pour les notifications admin en temps réel"""
    
    async def connect(self):
        """Connexion WebSocket avec authentification JWT"""
        try:
            # Récupérer le token depuis les query parameters
            token = self.scope['query_string'].decode().split('token=')[-1]
            
            if not token:
                logger.warning("Connexion WebSocket refusée - pas de token")
                await self.close()
                return
            
            # Vérifier le token JWT
            try:
                UntypedToken(token)
                # Décoder le token pour obtenir l'utilisateur
                from rest_framework_simplejwt.tokens import AccessToken
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                
                # Récupérer l'utilisateur
                user = await self.get_user(user_id)
                if not user or not user.is_staff:
                    logger.warning(f"Connexion WebSocket refusée - utilisateur non autorisé: {user}")
                    await self.close()
                    return
                
                self.user = user
                
            except (InvalidToken, TokenError) as e:
                logger.warning(f"Token JWT invalide: {e}")
                await self.close()
                return
            
            # Rejoindre le groupe des notifications admin
            self.group_name = 'admin_notifications'
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
            logger.info(f"Admin {self.user.email} connecté aux notifications WebSocket")
            
        except Exception as e:
            logger.error(f"Erreur lors de la connexion WebSocket: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Déconnexion WebSocket"""
        try:
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
            
            if hasattr(self, 'user'):
                logger.info(f"Admin {self.user.email} déconnecté des notifications WebSocket")
                
        except Exception as e:
            logger.error(f"Erreur lors de la déconnexion WebSocket: {e}")
    
    async def receive(self, text_data):
        """Réception de messages du client (optionnel)"""
        try:
            data = json.loads(text_data)
            logger.info(f"Message reçu du client: {data}")
            
            # Répondre avec un ping/pong pour maintenir la connexion
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
                
        except Exception as e:
            logger.error(f"Erreur lors de la réception du message: {e}")
    
    async def send_notification(self, event):
        """Envoyer une notification au client"""
        try:
            message = event['message']
            
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'data': message
            }))
            
            logger.info(f"Notification envoyée à {self.user.email}: {message['type']}")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de notification: {e}")
    
    @database_sync_to_async
    def get_user(self, user_id):
        """Récupérer l'utilisateur de manière asynchrone"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
