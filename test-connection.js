// Test simple de connexion au backend
const API_URL = 'https://sales-tracker-pro-v2.onrender.com/api';

async function testConnection() {
  try {
    console.log('🔍 Test de connexion au backend...');
    
    // Test endpoint racine
    const response = await fetch(`${API_URL}/`);
    console.log('📡 Status:', response.status);
    console.log('📡 URL:', response.url);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Backend accessible !');
      console.log('📄 Response:', data);
    } else {
      console.log('❌ Erreur:', response.statusText);
    }
    
  } catch (error) {
    console.error('💥 Erreur de connexion:', error.message);
  }
}

// Exécuter le test
testConnection();
