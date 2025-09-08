"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('authToken');
          const storedUser = localStorage.getItem('user');

          if (storedToken) {
            setToken(storedToken);
            
            // Si on a un user stocké, on l'utilise temporairement
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }

            // Récupère les données fraîches de l'utilisateur
            try {
              const userData = await apiService.getCurrentUser();
              
              // Créer l'objet utilisateur avec les bonnes propriétés
              const freshUser: User = {
                id: userData.id.toString(),
                email: userData.email,
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                is_staff: userData.is_staff,
                is_superuser: userData.is_superuser,
                is_active: userData.is_active,
                // Propriétés pour la rétrocompatibilité
                name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
                nom: userData.last_name,
                prenom: userData.first_name
              };
              
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            } catch (error) {
              console.error('Error fetching fresh user data:', error);
              // On garde l'utilisateur stocké si l'API échoue
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      setToken(data.access);
      localStorage.setItem('authToken', data.access);
      
      return data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Si le refresh échoue, déconnecter l'utilisateur
      logout();
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiService.login(email, password);
      
      setToken(data.access);
      
      // Récupérer les informations de l'utilisateur connecté
      const userData = await apiService.getCurrentUser();
      
      // Créer l'objet utilisateur avec les bonnes propriétés
      const user: User = {
        id: userData.id.toString(),
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_staff: userData.is_staff,
        is_superuser: userData.is_superuser,
        is_active: userData.is_active,
        // Propriétés pour la rétrocompatibilité
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
        nom: userData.last_name,
        prenom: userData.first_name
      };
      
      setUser(user);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.access);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Stocker aussi le refresh token si disponible
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Cette méthode dépend de votre API
      // Vous devrez peut-être l'ajouter à apiService
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'inscription');
      }

      const data = await response.json();
      
      // Après inscription, on login automatiquement
      await login(email, password);
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. ' +
      'Assurez-vous que votre application est encapsulée avec <AuthProvider> ' +
      'dans votre layout racine.');
  }
  
  return context;
};