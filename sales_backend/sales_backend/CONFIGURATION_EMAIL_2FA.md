# 📧 Configuration Email pour 2FA - Guide Complet

## ✅ Firebase configuré avec succès !

Le fichier `firebase-credentials.json` est maintenant correctement placé et renommé.

## 🔧 Configuration Email Gmail pour 2FA

### 1. **Activer l'authentification à 2 facteurs sur Gmail**

1. **Aller dans votre compte Google** : [myaccount.google.com](https://myaccount.google.com)
2. **Sécurité** → **Validation en 2 étapes**
3. **Activer** la validation en 2 étapes
4. **Suivre les instructions** (SMS, appel, etc.)

### 2. **Générer un mot de passe d'application**

1. **Toujours dans Sécurité** → **Mots de passe des applications**
2. **Sélectionner l'application** : "Autre (nom personnalisé)"
3. **Nom** : "Django Sales Tracker"
4. **Générer** → Noter le mot de passe (16 caractères)

### 3. **Configurer les variables d'environnement**

Ajouter dans votre fichier `.env` :

```env
# Configuration Email pour 2FA
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop  # Le mot de passe d'application généré
DEFAULT_FROM_EMAIL=votre-email@gmail.com

# Configuration Firebase (déjà dans firebase-credentials.json)
FIREBASE_PROJECT_ID=sales-tracker-app-ca876
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@sales-tracker-app-ca876.iam.gserviceaccount.com
```

### 4. **Prochaines étapes**

1. **Migrations base de données** :
```bash
python manage.py makemigrations accounts
python manage.py migrate
```

2. **Créer un superutilisateur** :
```bash
python manage.py createsuperuser
```

3. **Tester l'envoi d'emails** :
```bash
python manage.py shell
>>> from accounts.two_factor_auth import TwoFactorAuth
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.first()
>>> TwoFactorAuth.send_email_code(user, "123456")
```

## 🚀 Fonctionnalités disponibles après configuration

- **2FA par email** : Codes à 6 chiffres envoyés automatiquement
- **Authentification Firebase** : Tokens vérifiés côté serveur
- **Notifications push** : Via Firebase Cloud Messaging
- **Mots de passe sécurisés** : Validation stricte automatique
- **JWT rotatif** : Tokens de 15 min avec refresh automatique

## 🔒 Endpoints API disponibles

- `POST /api/accounts/enable-2fa/` - Activer 2FA par email
- `POST /api/accounts/verify-2fa/` - Vérifier code 2FA
- `POST /api/accounts/verify-firebase-token/` - Vérifier token Firebase
- `POST /api/accounts/send-notification/` - Envoyer notification push
- `POST /api/accounts/fcm-token/` - Sauvegarder token FCM

Le système est prêt ! Il ne reste plus qu'à configurer l'email Gmail.
