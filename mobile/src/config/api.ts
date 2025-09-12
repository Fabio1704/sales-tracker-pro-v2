import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration API - même backend que l'app web
const API_BASE_URL = 'https://sales-tracker-pro-v2.onrender.com/api';

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur récupération token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, supprimer les tokens stockés
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      // Rediriger vers login (sera géré par le contexte d'auth)
    }
    return Promise.reject(error);
  }
);

// Services API adaptés pour React Native
export const apiService = {
  // Authentification
  async login(email: string, password: string) {
    const response = await apiClient.post('/accounts/login/', {
      email,
      password,
    });
    
    if (response.data.access) {
      // Stocker les tokens localement
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
  },

  async logout() {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  },

  async getCurrentUser() {
    const response = await apiClient.get('/accounts/users/me/');
    return response.data;
  },

  // Modèles
  async getModels() {
    const response = await apiClient.get('/modelprofiles/');
    return response.data;
  },

  async createModel(data: { first_name: string; last_name: string }) {
    const response = await apiClient.post('/modelprofiles/', data);
    return response.data;
  },

  async deleteModel(id: number) {
    const response = await apiClient.delete(`/modelprofiles/${id}/`);
    return response.data;
  },

  async getModelStats(id: number) {
    const response = await apiClient.get(`/modelprofiles/${id}/stats/`);
    return response.data;
  },

  // Ventes
  async getDailySales(modelId: number) {
    const response = await apiClient.get(`/modelprofiles/${modelId}/daily-sales/`);
    return response.data;
  },

  async createDailySale(modelId: number, data: { date: string; amount_usd: number }) {
    const response = await apiClient.post(`/modelprofiles/${modelId}/daily-sales/`, data);
    return response.data;
  },

  async updateDailySale(modelId: number, saleId: number, data: { date: string; amount_usd: number }) {
    const response = await apiClient.put(`/modelprofiles/${modelId}/daily-sales/${saleId}/`, data);
    return response.data;
  },

  async deleteDailySale(modelId: number, saleId: number) {
    const response = await apiClient.delete(`/modelprofiles/${modelId}/daily-sales/${saleId}/`);
    return response.data;
  },

  // Upload photo
  async uploadPhoto(modelId: number, imageUri: string) {
    const formData = new FormData();
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await apiClient.post(`/modelprofiles/${modelId}/upload_photo/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Mot de passe oublié
  async requestPasswordReset(email: string) {
    const response = await apiClient.post('/accounts/password-reset/', { email });
    return response.data;
  },

  async resetPassword(uid: string, token: string, newPassword: string) {
    const response = await apiClient.post('/accounts/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

export default apiService;
