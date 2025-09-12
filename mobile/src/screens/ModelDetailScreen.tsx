import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  ModelDetail: { model: any };
};

type ModelDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ModelDetail'>;
type ModelDetailScreenRouteProp = RouteProp<RootStackParamList, 'ModelDetail'>;

interface Props {
  navigation: ModelDetailScreenNavigationProp;
  route: ModelDetailScreenRouteProp;
}

const API_BASE_URL = 'https://sales-tracker-pro-v2.onrender.com/api';

const ModelDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { model } = route.params;
  const [sales, setSales] = useState<any[]>([]);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [newSaleAmount, setNewSaleAmount] = useState('');
  const [newSaleDate, setNewSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
    fetchModelSales();
  }, []);

  const loadTokens = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const refresh = await AsyncStorage.getItem('refreshToken');
      setUserToken(token);
      setRefreshToken(refresh);
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      navigation.navigate('Home');
      return null;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        setUserToken(data.access);
        await AsyncStorage.setItem('userToken', data.access);
        return data.access;
      } else {
        navigation.navigate('Home');
        return null;
      }
    } catch {
      navigation.navigate('Home');
      return null;
    }
  };

  const makeAuthenticatedRequest = async (url: string, options: any) => {
    let token = userToken;
    let response = await fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` },
    });
    if (response.status === 401) {
      token = await refreshAccessToken();
      if (token) {
        response = await fetch(url, {
          ...options,
          headers: { ...options.headers, 'Authorization': `Bearer ${token}` },
        });
      }
    }
    return response;
  };

  const fetchModelSales = async () => {
    if (!userToken) return;
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/dailysales/?model_profile=${model.id}`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setSales(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const addSale = async () => {
    if (!newSaleAmount || !newSaleDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setIsLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/dailysales/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_profile: model.id,
          amount_usd: parseFloat(newSaleAmount),
          date: newSaleDate,
        }),
      });
      if (response.ok) {
        const newSale = await response.json();
        setSales(prev => [...prev, newSale]);
        setNewSaleAmount('');
        setShowSalesModal(false);
        Alert.alert('Succès', 'Vente ajoutée avec succès !');
        fetchModelSales(); // Refresh sales list
      } else {
        const responseText = await response.text();
        let errorData = {};
        try { errorData = JSON.parse(responseText); } catch { }
        const errorMessage = (errorData as any).detail || (errorData as any).message || Object.values(errorData).join(', ') || `Erreur HTTP ${response.status}: ${responseText || 'Impossible d\'ajouter la vente'}`;
        Alert.alert('Erreur', `${errorMessage}`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Problème de connexion réseau');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSale = async (saleId: number) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cette vente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await makeAuthenticatedRequest(`${API_BASE_URL}/dailysales/${saleId}/`, {
                method: 'DELETE',
              });
              if (response.ok) {
                setSales(prev => prev.filter(sale => sale.id !== saleId));
                Alert.alert('Succès', 'Vente supprimée avec succès !');
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la vente');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Problème de connexion réseau');
            }
          },
        },
      ]
    );
  };

  const totalRevenue = sales.reduce((sum, sale) => {
    const amount = parseFloat(sale.amount_usd) || 0;
    return sum + amount;
  }, 0);
  const totalCommission = totalRevenue * (model.commission_rate || 10) / 100;
  const netRevenue = totalRevenue * 0.8;

  const renderSaleItem = ({ item }: { item: any }) => (
    <View style={styles.salesItem}>
      <View style={styles.salesItemIcon}>
        <Text style={styles.salesItemIconText}>📅</Text>
      </View>
      <View style={styles.salesItemContent}>
        <Text style={styles.salesItemDate}>{new Date(item.date).toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}</Text>
        <Text style={styles.salesItemSubDate}>Ajouté le {new Date(item.created_at || item.date).toLocaleDateString()}</Text>
        <Text style={styles.salesItemAmount}>{parseFloat(item.amount_usd).toFixed(2)} $</Text>
        <Text style={styles.salesItemBreakdown}>
          Honoraires: {(parseFloat(item.amount_usd) * 0.2).toFixed(2)} $ • 
          Net: {(parseFloat(item.amount_usd) * 0.8).toFixed(2)} $
        </Text>
      </View>
      <TouchableOpacity
        style={styles.salesItemDelete}
        onPress={() => deleteSale(item.id)}
      >
        <Text style={styles.salesItemDeleteText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#1e293b', '#334155', '#475569']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonContainer}>
            <Text style={styles.backButtonIcon}>←</Text>
            <Text style={styles.backButtonText}>Retour</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.modelAvatar}>
            <Text style={styles.modelAvatarText}>{model?.name?.substring(0, 2).toUpperCase() || 'MD'}</Text>
          </View>
          <View style={styles.modelInfo}>
            <Text style={styles.modelName}>{model?.name || 'Modèle'}</Text>
            <Text style={styles.modelSubtitle}>Profil et statistiques</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Dashboard Title */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Tableau de Bord</Text>
          <Text style={styles.dashboardSubtitle}>Suivez vos performances et gérez vos ventes en temps réel</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.greenCard]}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>€</Text>
            </View>
            <Text style={styles.statValue}>{totalRevenue.toFixed(2)} $</Text>
            <Text style={styles.statLabel}>Ventes Brutes</Text>
            <Text style={styles.statSubLabel}>Total des ventes</Text>
          </View>

          <View style={[styles.statCard, styles.orangeCard]}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📋</Text>
            </View>
            <Text style={styles.statValue}>{totalCommission.toFixed(2)} $</Text>
            <Text style={styles.statLabel}>Honoraires (20%)</Text>
            <Text style={styles.statSubLabel}>Commission</Text>
          </View>

          <View style={[styles.statCard, styles.purpleCard]}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📈</Text>
            </View>
            <Text style={styles.statValue}>{netRevenue.toFixed(2)} $</Text>
            <Text style={styles.statLabel}>Ventes Nettes (80%)</Text>
            <Text style={styles.statSubLabel}>Après commission</Text>
          </View>

          <View style={[styles.statCard, styles.pinkCard]}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📅</Text>
            </View>
            <Text style={styles.statValue}>{sales.length}</Text>
            <Text style={styles.statLabel}>Jours avec Ventes</Text>
            <Text style={styles.statSubLabel}>Jours actifs</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.primaryActionButton]}
            onPress={() => setShowSalesModal(true)}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonIcon}>+</Text>
              <Text style={styles.actionButtonText}>Saisie Quotidienne</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionIcon}>⏰</Text>
              <Text style={styles.secondaryActionText}>Vue Hebdomadaire</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionIcon}>📊</Text>
              <Text style={styles.secondaryActionText}>Résumé Mensuel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionIcon}>📈</Text>
              <Text style={styles.secondaryActionText}>Statistiques & Rapports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Entry Section */}
        <View style={styles.quickEntrySection}>
          <View style={styles.quickEntryHeader}>
            <View style={styles.quickEntryIconContainer}>
              <Text style={styles.quickEntryIcon}>+</Text>
            </View>
            <View style={styles.quickEntryInfo}>
              <Text style={styles.quickEntryTitle}>Saisie Quotidienne</Text>
              <Text style={styles.quickEntrySubtitle}>Ajoutez vos ventes jour par jour</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.quickEntryButton}
            onPress={() => setShowSalesModal(true)}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              style={styles.quickEntryButtonGradient}
            >
              <Text style={styles.quickEntryButtonText}>+ Ajouter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sales List */}
        <View style={styles.salesSection}>
          <View style={styles.salesHeader}>
            <View style={styles.salesHeaderIcon}>
              <Text style={styles.salesHeaderIconText}>📊</Text>
            </View>
            <View>
              <Text style={styles.salesSectionTitle}>Liste des Ventes</Text>
              <Text style={styles.salesSectionSubtitle}>Historique de toutes vos ventes avec leurs dates</Text>
            </View>
          </View>
          
          {sales.length > 0 ? (
            <FlatList
              data={sales}
              renderItem={renderSaleItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              style={styles.salesList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptySalesContainer}>
              <Text style={styles.emptySalesText}>Aucune vente enregistrée</Text>
              <Text style={styles.emptySalesSubtext}>Commencez par ajouter votre première vente</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Sale Modal */}
      <Modal
        visible={showSalesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSalesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une vente</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Montant ($)"
              value={newSaleAmount}
              onChangeText={setNewSaleAmount}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={newSaleDate}
              onChangeText={setNewSaleDate}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSalesModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addSale}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    flex: 1,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 5,
  },
  backButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  headerCenter: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modelAvatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modelInfo: {
    alignItems: 'center',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modelSubtitle: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  settingsButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingsIcon: {
    fontSize: 20,
    color: '#fbbf24',
  },
  dashboardHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  greenCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  orangeCard: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  purpleCard: {
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderColor: 'rgba(147, 51, 234, 0.3)',
  },
  pinkCard: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  primaryActionButton: {
    marginBottom: 15,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryActionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  secondaryActionText: {
    fontSize: 10,
    color: '#cbd5e1',
    textAlign: 'center',
    fontWeight: '500',
  },
  quickEntrySection: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  quickEntryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickEntryIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  quickEntryInfo: {
    flex: 1,
  },
  quickEntryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  quickEntrySubtitle: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  quickEntryButton: {
    alignSelf: 'flex-start',
  },
  quickEntryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  quickEntryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  salesSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  salesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  salesHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  salesHeaderIconText: {
    fontSize: 16,
  },
  salesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  salesSectionSubtitle: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  salesList: {
    maxHeight: 300,
  },
  salesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  salesItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  salesItemIconText: {
    fontSize: 14,
  },
  salesItemContent: {
    flex: 1,
  },
  salesItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  salesItemSubDate: {
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  salesItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  salesItemBreakdown: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  salesItemDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  salesItemDeleteText: {
    fontSize: 14,
    color: '#ffffff',
  },
  emptySalesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySalesText: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  emptySalesSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#cbd5e1',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ModelDetailScreen;
