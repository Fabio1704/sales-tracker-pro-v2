// Service Worker pour Firebase Cloud Messaging
// Ce fichier doit être placé à la racine de votre application web

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuration Firebase (même que dans votre app)
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
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png', // Remplacer par votre icône
    badge: '/badge-icon.png',   // Icône de badge
    tag: 'sales-tracker-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir l\'application'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Clic sur notification:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    // Ouvrir l'application
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
