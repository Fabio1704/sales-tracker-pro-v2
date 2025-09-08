# 🔥 Vérification Firebase Console - Authentication

## 📍 **Ce que vous devez voir dans Firebase Authentication**

### 1. **Aller dans Firebase Console**
- URL : [https://console.firebase.google.com/](https://console.firebase.google.com/)
- Sélectionner votre projet : **"sales-tracker-app-ca876"**

### 2. **Section Authentication**
- **Menu gauche** → **Authentication**
- **Onglet "Users"** : Liste des utilisateurs (vide au début)
- **Onglet "Sign-in method"** : Méthodes d'authentification activées

### 3. **Sign-in method - Ce qui DOIT être activé :**

#### ✅ **Email/Password**
- **Statut :** Activé (Enabled)
- **Description :** "Allow users to sign up and sign in with their email address and password"

#### ✅ **Google (optionnel mais recommandé)**
- **Statut :** Peut être activé
- **Description :** "Allow users to sign in with their Google account"

### 4. **Settings (Paramètres)**
- **Authorized domains :** 
  - `localhost` (pour développement)
  - `sales-tracker-app-ca876.firebaseapp.com`
  - Votre domaine de production (si applicable)

### 5. **Templates (Modèles d'email)**
- **Email verification** : Modèle pour vérification email
- **Password reset** : Modèle pour réinitialisation mot de passe
- **Email address change** : Modèle pour changement email

## 🔍 **Vérifications importantes :**

### ✅ **Authentication activé**
Si vous voyez "Get started" → Cliquer pour activer Authentication

### ✅ **Email/Password activé**
Dans "Sign-in method" → Email/Password doit être "Enabled"

### ✅ **Domaines autorisés**
Dans "Settings" → "Authorized domains" doit inclure localhost

## 📱 **Test rapide**
Une fois configuré, vous pouvez tester la création d'utilisateur via :
```javascript
// Dans votre frontend
import { signUpUser } from './firebase-config-frontend.js';
signUpUser('test@gmail.com', 'MonMotDePasse123!');
```

L'utilisateur devrait apparaître dans l'onglet "Users" de Firebase Authentication.
