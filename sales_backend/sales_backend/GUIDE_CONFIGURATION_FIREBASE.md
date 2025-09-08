# 🔥 Guide de Configuration Firebase + Sécurité Avancée

## 🚀 Étapes de Configuration

### 1. Créer un Projet Firebase

1. **Aller sur [Firebase Console](https://console.firebase.google.com/)**
2. **Créer un nouveau projet** ou utiliser un existant
3. **Activer Authentication** dans la console
4. **Activer Cloud Messaging** pour les notifications push

### 2. Générer les Credentials

1. **Aller dans Paramètres du projet** → **Comptes de service**
2. **Générer une nouvelle clé privée** (fichier JSON)
3. **Télécharger le fichier** et le renommer `firebase-credentials.json`
4. **Placer le fichier** dans `d:\stat\sales_backend\sales_backend\`

### 3. Configuration Email Gmail

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Aller dans Paramètres Google → Sécurité
   - Mots de passe d'application
   - Créer un nouveau mot de passe pour "Django"
3. **Utiliser ce mot de passe** dans `EMAIL_HOST_PASSWORD`

### 4. Installation des Dépendances

```bash
cd d:\stat\sales_backend\sales_backend
pip install -r requirements_security.txt
```

### 5. Configuration .env

Copier `env_example.txt` vers `.env` et remplir :

```env
# Firebase
FIREBASE_PROJECT_ID=votre-projet-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@votre-projet.iam.gserviceaccount.com

# Email
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-application
```

### 6. Migrations Base de Données

```bash
python manage.py makemigrations accounts
python manage.py migrate
```

## 🔐 Fonctionnalités Implémentées

### ✅ Mots de Passe Sécurisés
- **Hashage automatique** (Django PBKDF2)
- **Règles strictes** : 8+ caractères, majuscule, minuscule, chiffre, caractère spécial
- **Validation anti-patterns** : pas de séquences communes, pas d'infos personnelles

### ✅ Authentification à Deux Facteurs (2FA)
- **Code par email** (6 chiffres, expire en 5 min)
- **Support Google Authenticator** (TOTP avec QR code)
- **Codes de sauvegarde** pour récupération

### ✅ JWT Sécurisé
- **Tokens courts** (15 min) avec refresh automatique
- **Rotation des tokens** pour sécurité maximale
- **Blacklist automatique** des anciens tokens

### ✅ Firebase Integration
- **Authentification Firebase** côté client
- **Vérification tokens** côté serveur Django
- **Notifications push** via FCM

### ✅ Sécurité Avancée
- **Verrouillage compte** après 5 tentatives échouées
- **Historique des connexions** avec IP et user-agent
- **Événements de sécurité** tracés et loggés

## 🧪 Test de la Sécurité

### Test Mot de Passe Fort
```python
# ❌ Rejetés
"password123"  # Trop commun
"12345678"     # Que des chiffres
"Password"     # Pas de caractère spécial

# ✅ Acceptés
"MySecure123!"
"P@ssw0rd2024"
```

### Test 2FA Email
1. **Créer un utilisateur** avec email Gmail valide
2. **Activer 2FA** dans le profil
3. **Tenter connexion** → Code envoyé par email
4. **Saisir le code** pour finaliser la connexion

## 🔧 Commandes Utiles

```bash
# Créer un superutilisateur
python manage.py createsuperuser

# Tester l'envoi d'emails
python manage.py shell
>>> from accounts.two_factor_auth import TwoFactorAuth
>>> TwoFactorAuth.send_email_code(user, "123456")

# Nettoyer les tokens expirés
python manage.py flushexpiredtokens
```

## 🚨 Sécurité en Production

1. **Changer SECRET_KEY** en production
2. **Utiliser HTTPS** obligatoirement
3. **Configurer un vrai serveur SMTP** (pas Gmail)
4. **Activer les logs de sécurité**
5. **Surveiller les tentatives de connexion**

Le système est maintenant **ultra-sécurisé** avec hashage des mots de passe, 2FA, JWT rotatif et Firebase !
