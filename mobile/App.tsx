import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ModelDetailScreen from './src/screens/ModelDetailScreen';

// Type definitions
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface ModelProfile {
  id: number;
  name: string;
  description: string;
  total_revenue: number;
  commission_rate: number;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

interface Sale {
  id: number;
  model_profile: number;
  amount_usd: string | number;
  date: string;
  created_at: string;
}

interface AnalyticsData {
  total_revenue: number;
  total_sales: number;
  average_sale: number;
  top_model: string;
  model_count: number;
}

const API_BASE_URL = 'https://sales-tracker-pro-v2.onrender.com/api';

type RootStackParamList = {
  Home: undefined;
  ModelDetail: { model: ModelProfile };
};

const Stack = createStackNavigator<RootStackParamList>();

function HomeScreen({ navigation }: any) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [userModels, setUserModels] = useState<ModelProfile[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [userStats, setUserStats] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [newSaleAmount, setNewSaleAmount] = useState('');
  const [newSaleDate, setNewSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedModel, setSelectedModel] = useState<ModelProfile | null>(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        await fetchUserData(token);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log('Erreur lors de la vérification du statut de connexion:', error);
    }
  };

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    let token = userToken;
    
    if (!token) {
      token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token available');
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            await AsyncStorage.setItem('userToken', refreshData.access);
            setUserToken(refreshData.access);
            
            return fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${refreshData.access}`,
              },
            });
          }
        }
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
      }
      
      await logout();
      throw new Error('Authentication failed');
    }

    return response;
  };

  const fetchUserData = async (token: string) => {
    try {
      console.log('Fetching user data with token:', token ? 'Token exists' : 'No token');
      
      const userResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/accounts/me/`);
      console.log('Response status for /accounts/me/:', userResponse.status);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('User data from /accounts/me/:', userData);
        setUser(userData);
      } else {
        console.log('Failed to fetch from /accounts/me/, status:', userResponse.status);
        console.log('Trying /user/profile/');
        
        // Try alternative endpoint
        const altResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/user/profile/`);
        console.log('Response status for /user/profile/:', altResponse.status);
        
        if (altResponse.ok) {
          const userData = await altResponse.json();
          console.log('User data from /user/profile/:', userData);
          setUser(userData);
        } else {
          console.log('Both user endpoints failed');
          console.log('/user/profile/ status:', altResponse.status);
          
          // Try one more endpoint that might work
          const meResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/me/`);
          console.log('Response status for /me/:', meResponse.status);
          
          if (meResponse.ok) {
            const userData = await meResponse.json();
            console.log('User data from /me/:', userData);
            setUser(userData);
          }
        }
      }

      const modelsResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/modelprofiles/`);
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log('Models data from API:', modelsData);
        setModels(modelsData);
        setUserModels(modelsData);
        
        // Extract user data from first model's owner field if user data is null
        if (!user && modelsData.length > 0 && modelsData[0].owner) {
          const ownerData = modelsData[0].owner;
          console.log('Extracting user data from model owner:', ownerData);
          setUser({
            id: ownerData.id,
            email: ownerData.email,
            first_name: ownerData.first_name,
            last_name: ownerData.last_name
          });
        }
      }

      const analyticsResponse = await makeAuthenticatedRequest(`${API_BASE_URL}/analytics/`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setUserStats(analyticsData);
      }
    } catch (error) {
      console.log('Erreur lors de la récupération des données utilisateur:', error);
      console.log('Error details:', error);
    }
  };

  const login = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, token data:', data);
        await AsyncStorage.setItem('userToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);
        setUserToken(data.access);
        console.log('About to fetch user data after login...');
        await fetchUserData(data.access);
        console.log('User data fetched, setting logged in to true');
        setIsLoggedIn(true);
        setUsername('');
        setPassword('');
      } else {
        Alert.alert('Erreur', 'Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Problème de connexion réseau');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUser(null);
      setUserToken(null);
      setModels([]);
      setUserModels([]);
      setSales([]);
      setUserStats(null);
    } catch (error) {
      console.log('Erreur lors de la déconnexion:', error);
    }
  };

  const createModel = async () => {
    if (!newModelName.trim() || !newModelDescription.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/modelprofiles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newModelName,
          description: newModelDescription,
          commission_rate: 10.0,
          base_price: 100.0,
          first_name: newModelName,
          last_name: "Model",
        }),
      });
      if (response.ok) {
        const newModel = await response.json();
        const completeModel = {
          ...newModel,
          id: newModel.id || Date.now(),
          total_revenue: newModel.total_revenue || 0,
          name: newModel.name || newModelName,
        };
        setModels(prev => [...prev, completeModel]);
        setUserModels(prev => [...prev, completeModel]);
        setNewModelName('');
        setNewModelDescription('');
        setShowCreateModal(false);
        Alert.alert('Succès', 'Modèle créé avec succès !');
        if (userToken) await fetchUserData(userToken);
      } else {
        const responseText = await response.text();
        let errorData = {};
        try { errorData = JSON.parse(responseText); } catch { }
        const errorMessage = (errorData as any).detail || (errorData as any).message || Object.values(errorData).join(', ') || `Erreur HTTP ${response.status}: ${responseText || 'Impossible de créer le modèle'}`;
        Alert.alert('Erreur', `${errorMessage}`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Problème de connexion réseau');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (modelId: number) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce modèle ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await makeAuthenticatedRequest(`${API_BASE_URL}/modelprofiles/${modelId}/`, {
                method: 'DELETE',
              });
              
              if (response.ok) {
                setModels(prev => prev.filter(model => model.id !== modelId));
                setUserModels(prev => prev.filter(model => model.id !== modelId));
                Alert.alert('Succès', 'Modèle supprimé avec succès !');
                if (userToken) await fetchUserData(userToken);
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer le modèle');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Problème de connexion réseau');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Sales Tracker Pro</Text>
          <Text style={styles.subtitle}>Connexion</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={login}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dashboardIcon}>
            <Text style={styles.dashboardIconText}>▣</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Gestion de vos modèles</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.modernIconButton}>
            <View style={styles.messageIconContainer}>
              <Text style={styles.messageIconText}>◑</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modernIconButton} onPress={logout}>
            <View style={styles.logoutIconContainer}>
              <Text style={styles.logoutIconText}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard */}
      <FlatList
        style={styles.content}
        data={userModels.slice(0, 3)}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                Bonjour, {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Utilisateur'} !
              </Text>
            </View>

            {/* Stats Cards */}
            {userStats && (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>${userStats.total_revenue}</Text>
                  <Text style={styles.statLabel}>Revenus totaux</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{userStats.total_sales}</Text>
                  <Text style={styles.statLabel}>Ventes totales</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{userModels.length}</Text>
                  <Text style={styles.statLabel}>Modèles actifs</Text>
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.actionButtonText}>+ Créer un modèle</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Models Header */}
            <View style={styles.modelsSection}>
              <Text style={styles.sectionTitle}>Vos modèles</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.modelCard}
            onPress={() => {
              navigation.navigate('ModelDetail', { model: item });
            }}
          >
            <View style={styles.modelCardHeader}>
              <View style={styles.modelAvatar}>
                <Text style={styles.modelAvatarText}>
                  {item?.name ? 
                    item.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2) :
                    item?.first_name ? 
                      (item.first_name.charAt(0) + (item.last_name ? item.last_name.charAt(0) : 'M')).toUpperCase() :
                      'MD'
                  }
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteModelButton}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteModel(item.id);
                }}
              >
                <Text style={styles.deleteModelIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modelCardContent}>
              <Text style={styles.modelName}>{item?.name || (item?.first_name ? item.first_name + ' Model' : 'Modèle')}</Text>
              <Text style={styles.modelDescription}>Modèle de suivi des ventes</Text>
              <Text style={styles.modelCreator}>
                Créé par: {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Utilisateur'}
              </Text>
              
              <View style={styles.modelStatusContainer}>
                <View style={styles.modelStatusIndicator}>
                  <Text style={styles.modelStatusDot}>•</Text>
                  <Text style={styles.modelStatusText}>Actif</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Create Model Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Créer un nouveau modèle</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nom du modèle"
              value={newModelName}
              onChangeText={setNewModelName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newModelDescription}
              onChangeText={setNewModelDescription}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewModelName('');
                  setNewModelDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={createModel}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ModelDetail" component={ModelDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6b7280',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dashboardIconText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 16,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modelsSection: {
    marginBottom: 20,
  },
  modelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  modelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteModelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModelIcon: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
  },
  modelCardContent: {
    padding: 16,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modelCreator: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  modelStatusContainer: {
    alignItems: 'flex-start',
  },
  modelStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modelStatusDot: {
    fontSize: 8,
    color: '#22c55e',
    marginRight: 4,
  },
  modelStatusText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  iconButton: {
    marginLeft: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modernIconButton: {
    padding: 8,
    marginLeft: 12,
  },
  modernIcon: {
    fontSize: 20,
    color: '#374151',
  },
  messageIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIconText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  logoutIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIconText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
});
