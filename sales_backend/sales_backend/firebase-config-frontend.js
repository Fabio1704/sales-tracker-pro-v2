// Configuration Firebase pour les notifications push uniquement (authentification désactivée)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Firebase Auth désactivé - utilisez l'authentification Django
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeL9FEFw1cY8zQqIAbpVMYmhvvH-EDLps",
  authDomain: "sales-tracker-app-ca876.firebaseapp.com",
  projectId: "sales-tracker-app-ca876",
  storageBucket: "sales-tracker-app-ca876.firebasestorage.app",
  messagingSenderId: "90048679737",
  appId: "1:90048679737:web:41a609126318d97cee62e8",
  measurementId: "G-Y6Y5CVC57Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication désactivé - utilisez l'authentification Django
// export const auth = getAuth(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

// Initialize Analytics
export const analytics = getAnalytics(app);

// Fonctions d'authentification DÉSACTIVÉES - utilisez l'API Django
/*
export const signInUser = async (email, password) => {
  console.warn("⚠️ Firebase Auth désactivé - utilisez l'API Django pour l'authentification");
  throw new Error("Firebase Authentication désactivé - utilisez /api/accounts/login/");
};

export const signUpUser = async (email, password) => {
  console.warn("⚠️ Firebase Auth désactivé - utilisez l'API Django pour l'inscription");
  throw new Error("Firebase Authentication désactivé - utilisez les invitations Django");
};

export const signOutUser = async () => {
  console.warn("⚠️ Firebase Auth désactivé - utilisez l'API Django pour la déconnexion");
  throw new Error("Firebase Authentication désactivé - utilisez /api/accounts/logout/");
};
*/

// Fonctions pour les notifications push
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permission accordée pour les notifications');
      
      // Obtenir le token FCM
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // À remplacer par votre clé VAPID
      });
      
      if (token) {
        console.log('Token FCM:', token);
        // Envoyer ce token à votre backend Django
        await sendTokenToBackend(token);
        return token;
      }
    } else {
      console.log('Permission refusée pour les notifications');
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
  }
};

// Envoyer le token FCM au backend Django
const sendTokenToBackend = async (token) => {
  try {
    const response = await fetch('/api/accounts/fcm-token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ fcm_token: token })
    });
    
    if (response.ok) {
      console.log('Token FCM envoyé au backend');
    }
  } catch (error) {
    console.error('Erreur envoi token au backend:', error);
  }
};

// Écouter les messages en arrière-plan
onMessage(messaging, (payload) => {
  console.log('Message reçu en premier plan:', payload);
  
  // Afficher une notification personnalisée
  if (payload.notification) {
    new Notification(payload.notification.title, {
      body: payload.notification.body,
      icon: '/firebase-logo.png' // Remplacer par votre icône
    });
  }
});

// Fonction pour obtenir le token ID Firebase DÉSACTIVÉE
/*
export const getFirebaseIdToken = async () => {
  console.warn("⚠️ Firebase Auth désactivé - pas de token ID disponible");
  return null;
};
*/

export default app;
