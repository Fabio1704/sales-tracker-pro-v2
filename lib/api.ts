const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://sales-tracker-pro-v2.onrender.com/api';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  date_joined?: string;
  total_models?: number;
  total_sales?: number;
  total_revenue?: number;
  last_activity?: string;
  name?: string;
  nom?: string;
  prenom?: string;
  role?: "admin" | "user";
  isActive?: boolean;
  lastLogin?: Date;
  last_login?: string;
}

export interface ModelProfile {
  id: string;
  owner: User;
  first_name: string;
  last_name: string;
  profile_photo?: string;
  profile_photo_url?: string;
  created_at: string;
  initials?: string;
  nom?: string;
  prenom?: string;
  userId?: string;
  totalSales?: number;
  totalAmount?: number;
  lastActivity?: Date;
}

export interface DailySale {
  id: string;
  model_profile: string;
  date: string;
  amount_usd: number;
  created_at: string;
}

export interface Stats {
  gross_usd: number;
  fees_usd: number;
  net_usd: number;
  days_with_sales: number;
}

export interface DailySummary {
  date: string;
  total: number;
}

export interface WeeklySummary {
  year: number;
  week: number;
  total: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total: number;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  staff_users: number;
  total_models: number;
  total_sales: number;
  total_revenue: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('API calls can only be made from the client side');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('authToken');

    console.log('🌐 API Request URL:', url);
    console.log('🌐 API Request method:', options.method || 'GET');
    console.log('🔐 Token found:', !!token);

    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      console.error('❌ Clés disponibles:', Object.keys(localStorage));
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    console.log('🔐 Request headers:', headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      console.log('📩 API Response status:', response.status, response.statusText);
      console.log('📩 API Response URL:', response.url);

      // Gestion des réponses sans contenu (204 No Content)
      if (response.status === 204) {
        return null;
      }

      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        
        // Gestion spécifique des erreurs 401 (Unauthorized)
        if (response.status === 401) {
          // Essayer de rafraîchir le token avant de déconnecter
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              console.log('🔄 Tentative de rafraîchissement du token...');
              const refreshResponse = await fetch(`${this.baseUrl}/token/refresh/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
              });

              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                localStorage.setItem('authToken', data.access);
                console.log('✅ Token rafraîchi avec succès');
                
                // Relancer la requête originale avec le nouveau token
                const retryResponse = await fetch(url, {
                  ...options,
                  headers: {
                    ...headers,
                    'Authorization': `Bearer ${data.access}`,
                  },
                  credentials: 'include',
                });

                if (retryResponse.ok) {
                  const retryText = await retryResponse.text();
                  return retryText ? JSON.parse(retryText) : null;
                }
              }
            }
          } catch (refreshError) {
            console.error('❌ Échec du rafraîchissement:', refreshError);
          }

          // Si le rafraîchissement échoue, déconnecter
          localStorage.removeItem('authToken');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          
          // Rediriger vers la page de connexion seulement si on n'est pas déjà sur la page de login
          if (typeof window !== 'undefined' && !window.location.pathname.includes('login') && window.location.pathname !== '/') {
            window.location.href = '/';
          }
        } else if (response.status === 404) {
          errorMessage = 'Endpoint non trouvé. Vérifiez que le backend est correctement configuré.';
        } else {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
          } catch {
            if (responseText) {
              errorMessage = `${errorMessage} - ${responseText}`;
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      // Parse JSON seulement si il y a du contenu
      try {
        return responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        throw new Error('Invalid JSON response from server');
      }

    } catch (error) {
      console.error('💥 Fetch error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le serveur est démarré.');
        }
        throw error;
      }
      throw new Error('Une erreur inconnue est survenue');
    }
  }

  // Authentification
  async login(identifier: string, password: string): Promise<LoginResponse> {
    // Détermine si l'identifiant est un email ou un nom d'utilisateur
    const isEmail = identifier.includes('@');
    
    const response = await fetch(`${this.baseUrl}/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: identifier, // Le backend Django accepte email ou username dans le champ username
        password 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Identifiants incorrects';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          // Messages d'erreur spécifiques selon le type d'identifiant
          if (errorData.detail.includes('Aucun compte trouvé avec cet email')) {
            errorMessage = 'Aucun compte trouvé avec cet email';
          } else if (errorData.detail.includes('Aucun compte trouvé avec ce nom d\'utilisateur')) {
            errorMessage = 'Aucun compte trouvé avec ce nom d\'utilisateur';
          } else if (errorData.detail.includes('Vérifiez vos identifiants')) {
            errorMessage = 'Vérifiez vos identifiants';
          } else if (errorData.detail.includes('No active account') || errorData.detail.includes('Aucun compte actif')) {
            errorMessage = isEmail 
              ? 'Aucun compte trouvé avec cet email' 
              : 'Aucun compte trouvé avec ce nom d\'utilisateur';
          } else if (errorData.detail.includes('credentials') || errorData.detail.includes('identifiants')) {
            errorMessage = 'Vérifiez vos identifiants';
          } else if (errorData.detail.includes('Unable to log in') || errorData.detail.includes('Impossible de se connecter')) {
            errorMessage = 'Vérifiez vos identifiants';
          } else {
            errorMessage = errorData.detail;
          }
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } catch {
        // En cas d'erreur de parsing, on garde le message par défaut
        if (response.status === 401) {
          errorMessage = 'Vérifiez vos identifiants';
        } else {
          errorMessage = `Erreur de connexion (${response.status})`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const tokens = await response.json();
    
    // Stockage des tokens
    localStorage.setItem('authToken', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    
    return tokens;
  }

  async refreshToken(refresh: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      throw new Error('Échec du rafraîchissement du token');
    }

    const tokens = await response.json();
    localStorage.setItem('authToken', tokens.access);
    return tokens;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // Récupérer l'utilisateur courant
  async getCurrentUser(): Promise<User> {
    return this.request('/users/me/');
  }

  async createUser(userData: {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password: string;
    is_staff?: boolean;
    is_active?: boolean;
  }): Promise<User> {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Récupérer tous les utilisateurs (admin only)
  async getUsers(): Promise<User[]> {
    // Ajouter un timestamp pour éviter le cache
    const timestamp = Date.now();
    const response = await this.request(`/admin/users/?t=${timestamp}`);
    console.log('🔍 API getUsers response:', response);
    return response;
  }

  async getAdminUsers(): Promise<User[]> {
    return this.request('/admin/users/');
  }

  // supprimer un utilisateur (admin only)
  async deleteUser(userId: string): Promise<void> {
    const response = await this.request(`/admin/users/${userId}/`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'utilisateur');
    }
  }

  async deleteGaelUser(): Promise<any> {
    const response = await this.request('/admin/users/6/', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de Gael');
    }
    
    return response.json();
  }

  // Récupérer les statistiques admin (admin only)
  async getAdminStats(): Promise<AdminStats> {
    return this.request('/users/stats/');
  }

  // Modèles
  async getModels(): Promise<ModelProfile[]> {
    return this.request('/modelprofiles/');
  }

  // Modèles pour admin (tous les modèles)
  async getAllModelsAdmin(): Promise<ModelProfile[]> {
    return this.request('/admin/models/');
  }

  // Ventes pour admin (toutes les ventes)
  async getAllSalesAdmin(modelId?: string): Promise<DailySale[]> {
    const params = modelId ? `?model_profile=${modelId}` : '';
    return this.request(`/admin/sales/${params}`);
  }

  async getModel(modelId: string): Promise<ModelProfile> {
    return this.request(`/modelprofiles/${modelId}/`);
  }

  async createModel(modelData: { first_name: string; last_name: string }): Promise<ModelProfile> {
    const result = await this.request('/modelprofiles/', {
      method: 'POST',
      body: JSON.stringify(modelData),
    });
    return result;
  }

  async updateModel(modelId: string, modelData: Partial<ModelProfile>): Promise<ModelProfile> {
    return this.request(`/modelprofiles/${modelId}/`, {
      method: 'PATCH',
      body: JSON.stringify(modelData),
    });
  }

  async deleteModel(modelId: string): Promise<void> {
    await this.request(`/modelprofiles/${modelId}/`, {
      method: 'DELETE',
    });
  }

  // Upload de photo
  async uploadModelPhoto(modelId: string, file: File): Promise<ModelProfile> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const formData = new FormData();
    formData.append('profile_photo', file);

    const response = await fetch(`${this.baseUrl}/modelprofiles/${modelId}/upload-photo/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de l'upload de la photo: ${response.status}`);
    }

    return response.json();
  }

  // Ventes
  async getSales(modelId: string): Promise<DailySale[]> {
    return this.request(`/dailysales/?model_profile=${modelId}`);
  }

  async createSale(saleData: Omit<DailySale, 'id' | 'created_at'>): Promise<DailySale> {
    return this.request('/dailysales/', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async deleteSale(saleId: string): Promise<void> {
    await this.request(`/dailysales/${saleId}/`, {
      method: 'DELETE',
    });
  }

  // Statistiques
  async getStats(modelId: string): Promise<Stats> {
    return this.request(`/modelprofiles/${modelId}/stats/`);
  }

  async getDailySummary(modelId: string): Promise<{daily: DailySummary[], totals: Stats}> {
    return this.request(`/dailysales/summary/daily/?model_id=${modelId}`);
  }

  async getWeeklySummary(modelId: string): Promise<{weekly: WeeklySummary[]}> {
    return this.request(`/dailysales/summary/weekly/?model_id=${modelId}`);
  }

  async getMonthlySummary(modelId: string): Promise<{monthly: MonthlySummary[]}> {
    return this.request(`/dailysales/summary/monthly/?model_id=${modelId}`);
  }

  async testUserMe() {
    try {
      const userData = await this.request('/users/me/');
      console.log('✅ /users/me/ response:', userData);
      console.log('✅ is_staff value:', userData.is_staff);
      return userData;
    } catch (error) {
      console.error('❌ /users/me/ error:', error);
      throw error;
    }
  }

  async downloadPDF(modelId: string): Promise<Blob> {
    if (typeof window === 'undefined') {
      throw new Error('PDF download can only be made from the client side');
    }

    const url = `${this.baseUrl}/dailysales/stats/pdf/?model_id=${modelId}`;
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Token d\'authentification manquant');
    }

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du PDF');
      }

      return response.blob();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Impossible de se connecter au serveur pour télécharger le PDF');
        }
        throw error;
      }
      throw new Error('Erreur inconnue lors du téléchargement du PDF');
    }
  }

  // Réinitialisation de mot de passe
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/accounts/password-reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Erreur lors de la demande de réinitialisation';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.email) {
          errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Si le parsing JSON échoue, utiliser le message par défaut
      }
      
      throw new Error(errorMessage);
    }
  }

  async resetPassword(uid: string, token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/accounts/password-reset/confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        uid,
        token,
        password: newPassword 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Erreur lors de la réinitialisation du mot de passe';
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.password) {
          errorMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        } else if (errorData.token) {
          errorMessage = 'Lien de réinitialisation invalide ou expiré';
        }
      } catch {
        // Si le parsing JSON échoue, utiliser le message par défaut
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const apiService = new ApiService();