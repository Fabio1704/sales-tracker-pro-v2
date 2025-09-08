# 🎯 Guide Système d'Invitation Clients

## 📋 **Vue d'ensemble**

Système complet permettant de transformer les messages de contact en invitations sécurisées pour l'inscription de nouveaux clients.

## 🔄 **Workflow complet**

### 1. **Contact Client**
- Client remplit le formulaire de contact sur `/contact`
- Message stocké dans `contact-messages.json`
- Visible dans l'admin à `/admin/contact-messages`

### 2. **Génération d'invitation**
- Admin sélectionne un message de contact
- Clique sur "Inviter à s'inscrire"
- Système génère un token unique et sécurisé
- Crée une entrée `ClientInvitation` en base

### 3. **Envoi sécurisé**
- Lien d'invitation généré : `/api/accounts/client-signup/{token}/`
- Email automatique avec template personnalisé
- Lien expire après 7 jours
- Page masquée accessible uniquement par ce lien

### 4. **Inscription client**
- Client clique sur le lien reçu
- Page d'inscription sécurisée avec toutes les validations
- Email pré-rempli (non modifiable)
- Validation Gmail stricte + mot de passe sécurisé
- Création automatique dans Django + Firebase

## 🛡️ **Sécurité intégrée**

### **Validation email ultra-stricte**
- Seuls les emails Gmail réalistes acceptés
- Détection des patterns suspects (test@, fake@, etc.)
- Rejet des emails trop courts/longs
- Vérification de patterns authentiques

### **Mots de passe sécurisés**
- Minimum 8 caractères
- Majuscule + minuscule + chiffre + caractère spécial
- Interdiction des patterns communs
- Hashage PBKDF2 automatique

### **Tokens d'invitation**
- 64 caractères aléatoirement générés
- Usage unique (marqué comme utilisé après inscription)
- Expiration automatique après 7 jours
- Traçabilité IP et User-Agent

### **Intégration Firebase**
- Création automatique dans Firebase Authentication
- Synchronisation Django ↔ Firebase
- Notifications push prêtes
- Tokens JWT sécurisés

## 📱 **Interfaces utilisateur**

### **Admin Django** (`/admin/`)
- Gestion complète des invitations
- Statuts : En attente, Utilisée, Expirée, Annulée
- Actions : Envoyer, Copier lien, Annuler
- Historique complet avec métadonnées

### **Admin Messages** (`/admin/contact-messages`)
- Liste des messages de contact
- Bouton "Inviter à s'inscrire" sur chaque message
- Modal de création d'invitation
- Prévisualisation et envoi d'email

### **Page d'inscription masquée**
- URL unique : `/api/accounts/client-signup/{token}/`
- Design moderne et responsive
- Formulaire sécurisé avec validation temps réel
- Messages d'erreur explicites
- Redirection automatique après inscription

## 🔧 **API Endpoints**

### **Création d'invitation**
```
POST /api/accounts/create-invitation/
{
    "contact_name": "Nom du client",
    "contact_email": "client@gmail.com",
    "contact_subject": "Sujet du message",
    "contact_message": "Message original"
}
```

### **Envoi d'email**
```
POST /api/accounts/send-invitation/
{
    "invitation_id": 123,
    "custom_message": "Message personnalisé optionnel"
}
```

### **Liste des invitations**
```
GET /api/accounts/invitations/
```

## 📧 **Template email**

Email HTML professionnel avec :
- Design responsive et moderne
- Message original du client inclus
- Message personnalisé de l'admin
- Lien d'inscription sécurisé
- Informations de sécurité
- Date d'expiration claire
- Branding Sales Tracker Pro

## 🗄️ **Base de données**

### **Modèle ClientInvitation**
```python
class ClientInvitation(models.Model):
    # Informations contact
    contact_name = CharField(max_length=100)
    contact_email = EmailField()
    contact_subject = CharField(max_length=200)
    contact_message = TextField()
    
    # Token et statut
    invitation_token = CharField(max_length=64, unique=True)
    status = CharField(choices=STATUS_CHOICES)
    expires_at = DateTimeField()
    
    # Traçabilité
    sent_by = ForeignKey(User)
    created_user = ForeignKey(User, null=True)
    ip_address_used = GenericIPAddressField(null=True)
```

## 🚀 **Utilisation pratique**

### **Pour l'admin :**
1. Aller dans `/admin/contact-messages`
2. Sélectionner un message de contact
3. Cliquer "Inviter à s'inscrire"
4. Personnaliser le message (optionnel)
5. Créer l'invitation
6. Envoyer par email ou copier le lien

### **Pour le client :**
1. Recevoir l'email d'invitation
2. Cliquer sur le lien sécurisé
3. Remplir le formulaire d'inscription
4. Choisir un mot de passe sécurisé
5. Compte créé automatiquement
6. Connexion automatique vers le dashboard

## ✅ **Avantages du système**

- **Sécurité maximale** : Validation stricte + Firebase + JWT
- **UX fluide** : Process simple et guidé
- **Traçabilité complète** : Historique de toutes les actions
- **Automatisation** : Synchronisation Django/Firebase automatique
- **Évolutif** : Système extensible pour d'autres cas d'usage
- **Professionnel** : Interface moderne et emails branded

## 🔍 **Monitoring et debug**

- Logs détaillés dans Django
- Statuts d'invitation trackés
- Métadonnées de connexion sauvées
- Interface admin pour supervision
- Gestion des erreurs gracieuse

Le système est maintenant **opérationnel** et prêt pour la production !
