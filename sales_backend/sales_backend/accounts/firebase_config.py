import os
import firebase_admin
from firebase_admin import credentials, auth, messaging
from django.conf import settings
import json

class FirebaseConfig:
    """Configuration Firebase pour les notifications push uniquement (authentification désactivée)"""
    
    _app = None
    
    @classmethod
    def initialize_firebase(cls):
        """Initialise Firebase avec les credentials"""
        if cls._app is None:
            try:
                # Chemin vers le fichier de credentials Firebase
                cred_path = os.path.join(settings.BASE_DIR, 'firebase-credentials.json')
                
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    cls._app = firebase_admin.initialize_app(cred)
                else:
                    # Alternative: utiliser les variables d'environnement
                    firebase_config = {
                        "type": os.getenv('FIREBASE_TYPE', 'service_account'),
                        "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                        "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                        "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                        "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                        "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                    
                    if firebase_config['project_id']:
                        cred = credentials.Certificate(firebase_config)
                        cls._app = firebase_admin.initialize_app(cred)
                    else:
                        print("⚠️ Firebase non configuré - Ajoutez firebase-credentials.json ou les variables d'environnement")
                        
            except Exception as e:
                print(f"❌ Erreur initialisation Firebase: {e}")
        
        return cls._app
    
    @classmethod
    def verify_firebase_token(cls, id_token):
        """Authentification Firebase désactivée - utilisateurs gérés uniquement dans Django"""
        print("⚠️ Authentification Firebase désactivée - utilisez l'authentification Django")
        return None
    
    @classmethod
    def send_push_notification(cls, token, title, body, data=None):
        """Envoie une notification push via Firebase"""
        try:
            cls.initialize_firebase()
            if cls._app:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    data=data or {},
                    token=token,
                )
                
                response = messaging.send(message)
                return response
            return None
        except Exception as e:
            print(f"❌ Erreur envoi notification: {e}")
            return None

# Initialiser Firebase au démarrage
FirebaseConfig.initialize_firebase()
