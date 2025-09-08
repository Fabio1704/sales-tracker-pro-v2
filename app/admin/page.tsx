"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Shield,
  Activity,
  Trash2,
  Eye,
  BarChart3,
  Moon,
  Sun,
  Home,
  UserPlus,
  Settings,
  TrendingUp,
  Calendar,
  Euro,
  Loader2,
  MessageCircle,
  Bell,
  ArrowLeft,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, ModelProfile, DailySale, User as ApiUser } from "@/lib/api"
import { useRouter } from "next/navigation"

// Interface étendue pour User
interface User extends ApiUser {
  isActive?: boolean
  lastLogin?: Date
  last_login?: string
}

// Interface pour les modèles avec statistiques
interface ModelWithStats extends ModelProfile {
  userId: string
  totalSales: number
  totalAmount: number
  lastActivity?: Date
  initials: string
  total_sales?: number
  total_amount?: number
  last_activity?: string
}

interface ActivityLog {
  id: string
  userId: string
  modelId: string
  action: string
  details: string
  timestamp: Date
  userName?: string
  modelName?: string
}

export default function AdminPage() {
  const { theme, setTheme } = useTheme()
  const { user: currentUser, isLoading } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [models, setModels] = useState<ModelWithStats[]>([])
  const [allSales, setAllSales] = useState<DailySale[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ 
    email: "", 
    nom: "", 
    prenom: "", 
    password: "", 
    role: "user" as "admin" | "user" 
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

const toggleTheme = () => {
  setTheme(theme === "light" ? "dark" : "light")
}

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    console.log('🔐 ADMIN - Auth loading:', isLoading);
    console.log('🔐 ADMIN - Current user:', currentUser);
    console.log('🔐 ADMIN - is_staff value:', currentUser?.is_staff);

    if (isLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    if (currentUser && currentUser.username === 'fabio') {
      console.log('🛠️ TEMP: Bypassing staff check for user fabio');
      loadAdminData();
      return;
    }

    const isStaff = Boolean(currentUser?.is_staff);
    if (currentUser && !isStaff) {
      console.log('🚫 Redirecting to dashboard - user is not staff');
      router.push('/dashboard');
      return;
    }
    
    if (!currentUser) {
      console.log('🚫 Redirecting to login - no user');
      router.push('/');
      return;
    }

    console.log('✅ User is staff, loading admin data...');
    loadAdminData();
  }, [currentUser, router, isLoading]);

  // Rafraîchir les notifications quand on revient sur la page
  useEffect(() => {
    // Attendre que l'authentification soit chargée
    if (!isLoading && currentUser) {
      loadAdminData();
      loadUnreadMessages();
    }
  }, [isLoading, currentUser]);

  useEffect(() => {
    // Seulement démarrer les intervalles si l'utilisateur est chargé
    if (!isLoading && currentUser) {
      // Rafraîchir les données toutes les 30 secondes
      const interval = setInterval(() => {
        loadAdminData();
        loadUnreadMessages();
      }, 30000);

      // Rafraîchir quand la fenêtre reprend le focus
      const handleFocus = () => {
        loadAdminData();
        loadUnreadMessages();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
      };
    }
  }, [isLoading, currentUser]);

  // Charger les messages non lus (seulement pour les superusers)
  const loadUnreadMessages = async () => {
    try {
      console.log('🔍 Vérification superuser:', currentUser?.is_superuser);
      console.log('👤 Utilisateur actuel:', currentUser?.email);
      
      // Ne charger les messages que si l'utilisateur est superuser
      if (!currentUser?.is_superuser) {
        console.log('❌ Pas superuser, pas de messages');
        setUnreadMessages(0);
        return;
      }

      const token = localStorage.getItem('authToken');
      console.log('🔑 Token utilisé pour messages:', token?.substring(0, 20) + '...');
      console.log('🔑 Token trouvé:', !!token);
      
      const response = await fetch('/api/contact-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Réponse API:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];
        const unreadCount = messages.filter((msg: any) => !msg.read).length;
        console.log('📧 Messages non lus:', unreadCount);
        setUnreadMessages(unreadCount);
      } else {
        console.log('❌ Erreur API:', response.status);
        setUnreadMessages(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setUnreadMessages(0);
    }
  };

  const loadAdminData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      console.log('📊 Loading admin data...');
      
      // Charger les messages non lus
      await loadUnreadMessages();
      
      // Charger tous les utilisateurs avec endpoint admin
      let usersData: User[] = [];
      try {
        usersData = await apiService.getUsers();
        console.log('👥 Admin users data from API:', usersData);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        // Fallback: utiliser les utilisateurs normaux si l'endpoint admin n'existe pas
        usersData = await apiService.getUsers();
      }
      
      const usersWithStatus: User[] = usersData.map(user => {
        console.log(`👤 User ${user.username} (${user.first_name} ${user.last_name}):`, {
          id: user.id,
          last_login: user.last_login,
          is_active: user.is_active
        });
        return {
          ...user,
          isActive: user.is_active !== false,
          lastLogin: user.last_login ? new Date(user.last_login) : undefined,
          nom: user.last_name || user.username,
          prenom: user.first_name || 'Utilisateur',
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
        };
      });

      // Charger tous les modèles (endpoint admin)
      let modelsData: ModelProfile[] = [];
      try {
        modelsData = await apiService.getAllModelsAdmin();
        console.log('👗 All models data from admin API:', modelsData);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des modèles admin:', error);
        // Fallback vers l'endpoint normal si l'admin ne fonctionne pas
        try {
          modelsData = await apiService.getModels();
        } catch (fallbackError) {
          console.error('❌ Erreur fallback:', fallbackError);
          modelsData = [];
        }
      }
      
      const modelsWithStats: ModelWithStats[] = await Promise.all(
        modelsData.map(async (model) => {
          try {
            console.log(`📈 Loading sales for model ${model.id} (${model.first_name} ${model.last_name})...`);
            
            const sales = await apiService.getAllSalesAdmin(model.id);
            console.log(`📈 Sales for model ${model.id}:`, sales);
            
            // Filtrer les ventes pour ce modèle spécifique
            const salesForThisModel = sales.filter(sale => sale.model_profile === model.id);
            
            console.log(`🔍 Ventes filtrées pour le modèle ${model.id}:`, salesForThisModel.length);
            
            const totalSales = salesForThisModel.length;
            const totalAmount = salesForThisModel.reduce((sum, sale) => sum + (Number(sale.amount_usd) || 0), 0);
            
            let lastActivity: Date | undefined;
            if (salesForThisModel.length > 0) {
              const sortedSales = salesForThisModel.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              lastActivity = new Date(sortedSales[0].date);
            }
            
            const modelWithStats: ModelWithStats = {
              ...model,
              userId: typeof model.owner === 'object' ? model.owner.id : model.owner,
              owner: model.owner, // S'assurer que owner est bien présent
              totalSales,
              totalAmount,
              lastActivity,
              initials: `${model.first_name?.[0] || ''}${model.last_name?.[0] || ''}`.toUpperCase(),
              nom: model.last_name || '',
              prenom: model.first_name || ''
            };
            
            console.log(`📊 Model ${model.id} stats:`, modelWithStats);
            console.log(`🔍 Model owner ID: ${model.owner}, Users available:`, usersWithStatus.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}` })));
            return modelWithStats;
            
          } catch (error) {
            console.error(`❌ Erreur lors du chargement des ventes pour le modèle ${model.id}:`, error);
            return {
              ...model,
              userId: typeof model.owner === 'object' ? model.owner.id : model.owner,
              totalSales: 0,
              totalAmount: 0,
              initials: `${model.first_name?.[0] || ''}${model.last_name?.[0] || ''}`.toUpperCase(),
              nom: model.last_name || '',
              prenom: model.first_name || ''
            } as ModelWithStats;
          }
        })
      );

      // Charger toutes les ventes pour les activités récentes (endpoint admin)
      const allSalesData: DailySale[] = [];
      for (const model of modelsData) {
        try {
          const sales = await apiService.getAllSalesAdmin(model.id);
          // Filtrer les ventes pour ce modèle spécifique
          const filteredSales = sales.filter(sale => sale.model_profile === model.id);
          allSalesData.push(...filteredSales);
        } catch (error) {
          console.error(`❌ Erreur lors du chargement des ventes admin pour le modèle ${model.id}:`, error);
          // Fallback vers l'endpoint normal
          try {
            const fallbackSales = await apiService.getSales(model.id);
            const filteredFallbackSales = fallbackSales.filter(sale => sale.model_profile === model.id);
            allSalesData.push(...filteredFallbackSales);
          } catch (fallbackError) {
            console.error(`❌ Erreur fallback pour le modèle ${model.id}:`, fallbackError);
          }
        }
      }

      console.log('🛒 All sales data:', allSalesData);
      console.log('👥 Users data:', usersWithStatus);
      console.log('👗 Models data:', modelsWithStats);

      // Générer les activités récentes avec les noms des utilisateurs et modèles
      const recentActivities: ActivityLog[] = allSalesData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20)
        .map((sale, index) => {
          // Trouver le modèle correspondant
          const model = modelsWithStats.find(m => m.id === sale.model_profile);
          // Trouver l'utilisateur propriétaire du modèle
          const ownerId = typeof model?.owner === 'object' ? (model.owner as any)?.id : model?.owner;
          const user = usersWithStatus.find(u => u.id === ownerId);
          
          
          const userName = user ? `${user.first_name} ${user.last_name}`.trim() || user.username : 'Utilisateur inconnu';
          const modelName = model ? `${model.first_name} ${model.last_name}` : 'Modèle inconnu';
          
          return {
            id: `activity-${index}`,
            userId: typeof model?.owner === 'object' ? model.owner.id : (model?.owner || sale.model_profile),
            modelId: sale.model_profile,
            action: "Vente enregistrée",
            details: `Montant: ${sale.amount_usd} $ - ${new Date(sale.date).toLocaleDateString('fr-FR')}`,
            timestamp: new Date(sale.created_at),
            userName,
            modelName
          };
        });

      console.log('📋 Recent activities:', recentActivities);

      setUsers(usersWithStatus);
      setModels(modelsWithStats);
      setAllSales(allSalesData);
      
      // Force re-render to update UI
      console.log('🔄 Forcing component re-render with updated data');
      setActivities(recentActivities);
      setRefreshKey(prev => prev + 1);

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des données admin:', error);
      setError(error.message || "Erreur lors du chargement des données administrateur");
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (newUser.email && newUser.nom && newUser.prenom) {
      try {
        const password = newUser.password || Math.random().toString(36).slice(-8);
        
        const userDataToSend = {
          email: newUser.email,
          username: newUser.email.split('@')[0],
          first_name: newUser.prenom,
          last_name: newUser.nom,
          password: password,
          is_staff: newUser.role === "admin",
          is_active: true
        };
        
        console.log('📤 Données envoyées à l\'API:', userDataToSend);
        
        const userData = await apiService.createUser(userDataToSend);

        const user: User = {
          ...userData,
          isActive: userData.is_active,
          lastLogin: new Date(),
          nom: userData.last_name,
          prenom: userData.first_name,
          name: `${userData.first_name} ${userData.last_name}`
        };
        
        setUsers([...users, user]);
        setNewUser({ email: "", nom: "", prenom: "", password: "", role: "user" });
        setShowCreateUser(false);
        
        alert(`Utilisateur créé !\nEmail: ${newUser.email}\nMot de passe: ${password}\nL'utilisateur doit changer son mot de passe à la première connexion.`);
        
        setActivities(prev => [{
          id: `activity-${Date.now()}`,
          userId: currentUser?.id || 'admin',
          modelId: 'system',
          action: "Utilisateur créé",
          details: `Nouvel utilisateur: ${newUser.email} - Rôle: ${newUser.role}`,
          timestamp: new Date()
        }, ...prev]);
        
        await loadAdminData();
        
      } catch (error: any) {
        console.error('❌ Erreur complète:', error);
        console.error('❌ Message d\'erreur:', error.message);
        setError(error.message || "Erreur lors de la création de l'utilisateur");
      }
    }
  };

const handleDeleteUser = async (userId: string) => {
  try {
    // Appel à l'API pour supprimer l'utilisateur côté backend
    await apiService.deleteUser(userId);
    
    // Mise à jour de l'état local
    setUsers(users.filter((user) => user.id !== userId));
    setModels(models.filter((model) => model.userId !== userId));
    
    const deletedUser = users.find(u => u.id === userId);
    setActivities(prev => [{
      id: `activity-${Date.now()}`,
      userId: currentUser?.id || 'admin',
      modelId: 'system',
      action: "Utilisateur supprimé",
      details: `Utilisateur: ${deletedUser?.email}`,
      timestamp: new Date()
    }, ...prev]);
    
    // Recharger les données
    await loadAdminData();
    
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    setError("Erreur lors de la suppression de l'utilisateur");
  }
}

  const toggleUserStatus = async (userId: string) => {
    try {
      setUsers(users.map((user) => 
        user.id === userId ? { ...user, isActive: !user.isActive, is_active: !user.is_active } : user
      ))
      
      const updatedUser = users.find(u => u.id === userId)
      setActivities(prev => [{
        id: `activity-${Date.now()}`,
        userId: currentUser?.id || 'admin',
        modelId: 'system',
        action: "Statut utilisateur modifié",
        details: `Utilisateur: ${updatedUser?.email} - ${updatedUser?.isActive ? 'Désactivé' : 'Activé'}`,
        timestamp: new Date()
      }, ...prev])
      
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error)
      setError("Erreur lors de la modification du statut utilisateur")
    }
  }

  // Calculer les statistiques globales
  const totalUsers = users.filter((u) => !u.is_staff).length
  const activeUsers = users.filter((u) => !u.is_staff && u.is_active).length
  const totalModels = models.length
  const totalRevenue = Number(models.reduce((sum, model) => sum + (Number(model.totalAmount) || 0), 0))
  const totalSales = models.reduce((sum, model) => sum + (model.totalSales || 0), 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUser?.is_staff && currentUser?.username !== 'fabio') {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Apple-Style Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50"></div>
        
        {/* Floating gradient orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            left: '10%',
            top: '20%'
          }}
        ></div>
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float-delayed"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            right: '10%',
            top: '10%'
          }}
        ></div>
        <div 
          className="absolute w-80 h-80 rounded-full opacity-25 blur-3xl animate-float-slow"
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            left: '60%',
            bottom: '20%'
          }}
        ></div>
        <div 
          className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl animate-float-reverse"
          style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            left: '20%',
            bottom: '10%'
          }}
        ></div>
        
        {/* Interactive mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-gradient-x"></div>
        </div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-grid-move"></div>
      </div>

      {/* Fixed Apple-Style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Retour</span>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Administration
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Messages Icon with notification badge */}
            {!isLoading && currentUser?.is_superuser && (
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/contact-messages')}
                className="relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-green-500/50 hover:scale-105"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Messages</span>
                {unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">{unreadMessages}</span>
                  </div>
                )}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme}
              className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0 rounded-full w-10 h-10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Administration
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Gérez votre plateforme avec des outils puissants et une interface moderne
            </p>
          </div>

          {error && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl rounded-2xl border border-red-200/30 dark:border-red-800/30 p-6 text-red-800 dark:text-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Erreur</h3>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{users.length}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {users.filter(u => u.is_active).length} actifs • {users.filter(u => u.is_staff).length} admin
              </p>
            </div>

            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Modèles</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalModels}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Modèles de suivi</p>
            </div>

            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventes</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalSales}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
            </div>

            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Euro className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{totalRevenue.toFixed(0)} $</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total plateforme</p>
            </div>

            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Activité</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{activities.length}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actions récentes</p>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg p-2 h-auto">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Vue d'Ensemble</span>
                  <span className="sm:hidden">Aperçu</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Utilisateurs</span>
                  <span className="sm:hidden">Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="models" 
                  className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Modèles</span>
                  <span className="sm:hidden">Suivi</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                >
                  <Activity className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Activité</span>
                  <span className="sm:hidden">Activity</span>
                </TabsTrigger>
              </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="animate-fade-in-up">
                <CardHeader>
                  <CardTitle>Modèles les Plus Performants</CardTitle>
                  <CardDescription>Top des modèles par chiffre d'affaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models
                      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
                      .slice(0, 5)
                      .map((model, index) => (
                        <div key={model.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {model.first_name} {model.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{model.totalSales || 0} ventes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{(Number(model.totalAmount) || 0).toFixed(0)} $</p>
                            <p className="text-xs text-muted-foreground">
                              {model.lastActivity
                                ? `Actif ${Math.floor((Date.now() - model.lastActivity.getTime()) / (1000 * 60 * 60 * 24))}j`
                                : "Inactif"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-delay-100">
                <CardHeader>
                  <CardTitle>Utilisateurs Récents</CardTitle>
                  <CardDescription>Derniers utilisateurs créés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users
                      .filter((u) => !u.is_staff)
                      .sort((a, b) => new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime())
                      .slice(0, 5)
                      .map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-accent/10 text-accent">
                                  {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Actif" : "Inactif"}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {user.lastLogin ? user.lastLogin.toLocaleDateString("fr-FR") : "Jamais connecté"}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Gestion des Utilisateurs</CardTitle>
                    <CardDescription className="text-sm sm:text-base">Créer, modifier et supprimer des utilisateurs</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateUser(true)} className="w-full sm:w-auto text-sm sm:text-base">
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Créer Utilisateur</span>
                    <span className="sm:hidden">Créer</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showCreateUser && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 border rounded-lg bg-muted/50 animate-fade-in-up">
                    <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Créer un Nouvel Utilisateur</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="utilisateur@email.com"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-xs sm:text-sm">Rôle</Label>
                        <select
                          id="role"
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "user" })}
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm sm:text-base"
                        >
                          <option value="user">Utilisateur</option>
                          {currentUser?.is_superuser && (
                            <option value="admin">Administrateur</option>
                          )}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prenom" className="text-xs sm:text-sm">Prénom</Label>
                        <Input
                          id="prenom"
                          value={newUser.prenom}
                          onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
                          placeholder="Prénom"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom" className="text-xs sm:text-sm">Nom</Label>
                        <Input
                          id="nom"
                          value={newUser.nom}
                          onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                          placeholder="Nom"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="password" className="text-xs sm:text-sm">Mot de passe</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Mot de passe (laisser vide pour générer automatiquement)"
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button onClick={handleCreateUser} className="text-xs sm:text-sm">Créer</Button>
                      <Button variant="outline" onClick={() => setShowCreateUser(false)} className="text-xs sm:text-sm">
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                            <Badge variant={user.is_staff ? "default" : "secondary"} className="text-xs">
                              {user.is_staff ? "Admin" : "Utilisateur"}
                            </Badge>
                            <Badge variant={user.is_active ? "default" : "outline"} className="text-xs">
                              {user.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.is_staff}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/user/${user.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!user.is_staff && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer {user.first_name} {user.last_name} ? Cette action est
                                  irréversible et supprimera également tous ses modèles.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tracking Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle>Suivi des Modèles</CardTitle>
                <CardDescription>Activité et performances de tous les modèles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model) => {
                    const ownerId = typeof model.owner === 'object' ? (model.owner as any).id : model.owner;
                    const user = users.find((u) => u.id === ownerId) || 
                      (currentUser && currentUser.id === ownerId ? currentUser : null)
                    return (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={model.profile_photo_url} alt={`${model.first_name} ${model.last_name}`} />
                            <AvatarFallback className="bg-accent/10 text-accent">{model.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {model.first_name} {model.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Propriétaire: {user ? `${user.first_name} ${user.last_name}` : "Utilisateur inconnu"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Dernière activité:{" "}
                              {model.lastActivity ? model.lastActivity.toLocaleDateString("fr-FR") : "Aucune activité"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{(Number(model.totalAmount) || 0).toFixed(0)} $</p>
                          <p className="text-sm text-muted-foreground">{model.totalSales || 0} ventes</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/model/${model.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 sm:space-y-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Journal d'Activité</CardTitle>
                <CardDescription className="text-sm sm:text-base">Historique des actions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {activities.map((activity) => {
                    const user = users.find((u) => u.id === activity.userId)
                    const model = models.find((m) => m.id === activity.modelId)
                    return (
                      <div
                        key={activity.id}
                        className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-1 sm:mb-2">
                            <p className="font-medium text-sm sm:text-base">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp.toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">{activity.details}</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {activity.userName || "Utilisateur inconnu"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Modèle: {activity.modelName || "Modèle inconnu"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
)
}