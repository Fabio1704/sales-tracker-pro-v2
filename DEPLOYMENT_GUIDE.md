# Guide de Déploiement - Sales Tracker Pro

Ce guide vous explique comment déployer votre application avec le frontend sur Vercel et le backend sur Render.

## 📋 Prérequis

- Compte GitHub
- Compte Vercel (gratuit)
- Compte Render (gratuit)

## 🚀 Étape 1: Déploiement du Backend sur Render

### 1.1 Préparation du Repository

1. Poussez votre code sur GitHub si ce n'est pas déjà fait
2. Assurez-vous que le dossier `sales_backend/sales_backend/` contient tous les fichiers nécessaires

### 1.2 Création du Service sur Render

1. Allez sur [render.com](https://render.com) et connectez-vous
2. Cliquez sur "New +" → "Web Service"
3. Connectez votre repository GitHub
4. Configurez le service :
   - **Name**: `sales-tracker-backend`
   - **Root Directory**: `sales_backend/sales_backend`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn sales_tracker.wsgi:application`

### 1.3 Configuration des Variables d'Environnement

Dans les paramètres de votre service Render, ajoutez ces variables :

```
DEBUG=False
SECRET_KEY=[généré automatiquement par Render]
ALLOWED_HOSTS=[votre-app].onrender.com
CORS_ALLOW_ALL_ORIGINS=False
FRONTEND_URL=https://[votre-app].vercel.app
DATABASE_URL=[fourni par la base de données Render]

# Variables optionnelles (si vous les utilisez)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=votre-email@gmail.com
EMAIL_HOST_PASSWORD=votre-mot-de-passe-app
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_PRIVATE_KEY=votre-private-key
FIREBASE_CLIENT_EMAIL=votre-client-email
```

### 1.4 Création de la Base de Données

1. Dans Render, cliquez sur "New +" → "PostgreSQL"
2. Nommez-la `sales-tracker-db`
3. Une fois créée, copiez l'URL de connexion
4. Ajoutez cette URL comme variable `DATABASE_URL` dans votre service web

## 🌐 Étape 2: Déploiement du Frontend sur Vercel

### 2.1 Déploiement via Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Cliquez sur "New Project"
3. Importez votre repository GitHub
4. Vercel détectera automatiquement que c'est un projet Next.js

### 2.2 Configuration des Variables d'Environnement

Dans les paramètres de votre projet Vercel, ajoutez :

```
NEXT_PUBLIC_API_URL=https://[votre-backend].onrender.com/api
```

Remplacez `[votre-backend]` par l'URL de votre service Render.

## 🔗 Étape 3: Configuration de la Connexion

### 3.1 Mise à Jour des URLs

1. **Backend**: Mettez à jour `FRONTEND_URL` dans Render avec l'URL Vercel
2. **Frontend**: Mettez à jour `NEXT_PUBLIC_API_URL` dans Vercel avec l'URL Render

### 3.2 Configuration CORS

Le CORS est déjà configuré dans `settings.py` pour accepter votre domaine Vercel.

## 🧪 Étape 4: Test de la Connexion

1. Ouvrez votre application Vercel
2. Essayez de vous connecter
3. Vérifiez que les API calls fonctionnent dans la console du navigateur

## 🔧 Dépannage

### Problèmes Courants

1. **Erreur CORS**: Vérifiez que `FRONTEND_URL` est correct dans Render
2. **Erreur 500**: Vérifiez les logs dans Render Dashboard
3. **Base de données**: Assurez-vous que `DATABASE_URL` est configurée
4. **Static files**: Les fichiers statiques sont gérés par `collectstatic`

### Logs

- **Render**: Dashboard → Votre service → Logs
- **Vercel**: Dashboard → Votre projet → Functions → Logs

## 📝 URLs Finales

Après déploiement, vous aurez :
- **Frontend**: `https://[votre-app].vercel.app`
- **Backend**: `https://[votre-backend].onrender.com`
- **API**: `https://[votre-backend].onrender.com/api`

## 🔄 Redéploiement

- **Vercel**: Se redéploie automatiquement à chaque push sur la branche principale
- **Render**: Se redéploie automatiquement à chaque push sur la branche principale

## 🛡️ Sécurité

- Les secrets sont stockés dans les variables d'environnement
- CORS est configuré pour votre domaine spécifique
- DEBUG est désactivé en production
