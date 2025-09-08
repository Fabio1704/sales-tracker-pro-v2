"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Calendar,
  Euro,
  TrendingUp,
  Calculator,
  BarChart3,
  Moon,
  Sun,
  Trash2,
  CalendarDays,
  PieChart,
  FileText,
  Loader2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, ModelProfile, DailySale, Stats } from "@/lib/api"
import { WeeklyView } from "@/components/weekly-view"
import { MonthlyView } from "@/components/monthly-view"
import { StatisticsReports } from "@/components/statistics-reports"

export default function ModelPage() {
  const params = useParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, logout, isLoading: authLoading } = useAuth()
  const [model, setModel] = useState<ModelProfile | null>(null)
  const [sales, setSales] = useState<DailySale[]>([])
  const [stats, setStats] = useState<Stats>({
    gross_usd: 0,
    fees_usd: 0,
    net_usd: 0,
    days_with_sales: 0
  });
  const [showAddForm, setShowAddForm] = useState(false)
  const [saleData, setSaleData] = useState({ date: "", amount: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

const toggleTheme = () => {
  setTheme(theme === "light" ? "dark" : "light")
}

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router, params.id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Vérification du token avant de charger les données
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/');
        return;
      }

      // Charger d'abord les données du modèle
      const modelData = await apiService.getModel(params.id as string);
      
      // Ensuite charger les ventes
      const salesData = await apiService.getSales(params.id as string);
      
      // Enfin essayer de charger les stats, mais gérer les erreurs spécifiquement
      let statsData: Stats;
      try {
        statsData = await apiService.getStats(params.id as string);
      } catch (statsError: any) {
        console.warn('Erreur lors du chargement des statistiques, utilisation de valeurs par défaut:', statsError);
        // Utiliser des valeurs par défaut si les stats échouent
        statsData = {
          gross_usd: 0,
          fees_usd: 0,
          net_usd: 0,
          days_with_sales: 0
        };
      }

      setModel({
        ...modelData,
        initials: `${modelData.first_name[0]}${modelData.last_name[0]}`.toUpperCase()
      })
      setSales(salesData)
      setStats(statsData)
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error)
      if (error.message.includes('authentification') || 
          error.message.includes('401') || 
          error.message.includes('Token')) {
        logout();
        router.push('/');
      } else {
        setError(error.message || "Erreur lors du chargement des données")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStatsFromSales = (salesData: DailySale[]): Stats => {
  const gross_usd = salesData.reduce((sum, sale) => sum + Number(sale.amount_usd || 0), 0);
  const fees_usd = gross_usd * 0.2;
  const net_usd = gross_usd * 0.8;
  
  // Compter les jours uniques avec des ventes
  const uniqueDays = new Set(salesData.map(sale => sale.date));
  const days_with_sales = uniqueDays.size;

  return {
    gross_usd,
    fees_usd,
    net_usd,
    days_with_sales
  };
}

  const handleAddSale = async () => {
    if (saleData.date && saleData.amount && model) {
      try {
        const newSale = await apiService.createSale({
          model_profile: model.id,
          date: saleData.date,
          amount_usd: Number.parseFloat(saleData.amount)
        })
        
        const updatedSales = [...sales, newSale].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setSales(updatedSales)
        
        // Mettre à jour les stats
        const updatedStats = await apiService.getStats(model.id)
        setStats(updatedStats)
        
        setSaleData({ date: "", amount: "" })
        setShowAddForm(false)
      } catch (error: any) {
        setError(error.message || "Erreur lors de l'ajout de la vente")
        console.error('Erreur:', error)
      }
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    try {
      await apiService.deleteSale(saleId)
      const updatedSales = sales.filter((sale) => sale.id !== saleId)
      setSales(updatedSales)
      
      // Mettre à jour les stats
      if (model) {
        const updatedStats = await apiService.getStats(model.id)
        setStats(updatedStats)
      }
    } catch (error: any) {
      setError(error.message || "Erreur lors de la suppression de la vente")
      console.error('Erreur:', error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null; // La redirection est gérée par le useEffect
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Modèle non trouvé</h2>
          <Button onClick={() => router.back()}>Retour</Button>
        </div>
      </div>
    )
  }

  // Créer un objet compatible avec l'interface attendue par StatisticsReports
  const modelForReports = {
    id: model.id,
    nom: model.last_name,
    prenom: model.first_name,
    photo: model.profile_photo_url,
    initials: model.initials || `${model.first_name[0]}${model.last_name[0]}`.toUpperCase()
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
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 rounded-full px-4 py-2 backdrop-blur-sm">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-white/20 dark:ring-gray-700/20">
                  <AvatarImage src={model?.profile_photo_url} alt={`${model?.first_name} ${model?.last_name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {model?.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                  {model ? `${model.first_name} ${model.last_name}` : 'Chargement...'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Profil et statistiques
                </p>
              </div>
            </div>
          </div>

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
      </header>
      {/* Main Content */}
      <div className="container mx-auto px-4 pt-28 pb-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
            Tableau de Bord
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Suivez vos performances et gérez vos ventes en temps réel
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventes Brutes</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Euro className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {Number(stats?.gross_usd || 0).toFixed(2)} $
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total des ventes</p>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Honoraires (20%)</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {Number(stats?.fees_usd || 0).toFixed(2)} $
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Commission</p>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventes Nettes (80%)</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {Number(stats?.net_usd || 0).toFixed(2)} $
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Après commission</p>
          </div>

          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Jours avec Ventes</h3>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stats?.days_with_sales || 0}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Jours actifs</p>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="daily" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg p-2 h-auto">
            <TabsTrigger 
              value="daily" 
              className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Saisie Quotidienne</span>
              <span className="sm:hidden">Saisie</span>
            </TabsTrigger>
            <TabsTrigger 
              value="weekly" 
              className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            >
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Vue Hebdomadaire</span>
              <span className="sm:hidden">Semaine</span>
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            >
              <PieChart className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Résumé Mensuel</span>
              <span className="sm:hidden">Mois</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 px-3 lg:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Statistiques & Rapports</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Daily Tab */}
          <TabsContent value="daily" className="space-y-8">
            {/* Add Sale Section */}
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Saisie Quotidienne</h3>
                      <p className="text-gray-600 dark:text-gray-400">Ajoutez vos ventes jour par jour</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowAddForm(!showAddForm)} 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Ajouter une vente</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </div>

                {showAddForm && (
                  <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-gray-700/30 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={saleData.date}
                          onChange={(e) => setSaleData({ ...saleData, date: e.target.value })}
                          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/30 dark:border-gray-700/30 rounded-xl transition-all duration-300 focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Montant ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={saleData.amount}
                          onChange={(e) => setSaleData({ ...saleData, amount: e.target.value })}
                          placeholder="0.00"
                          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/30 dark:border-gray-700/30 rounded-xl transition-all duration-300 focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <Button 
                        onClick={handleAddSale} 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        Ajouter
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)} 
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-xl transition-all duration-300"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sales List */}
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Liste des Ventes</h3>
                    <p className="text-gray-600 dark:text-gray-400">Historique de toutes vos ventes avec leurs dates</p>
                  </div>
                </div>
                {sales.length > 0 ? (
                  <div className="space-y-4">
                    {sales.map((sale, index) => (
                      <div
                        key={sale.id}
                        className="bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-gray-700/30 p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {new Date(sale.date).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ajouté le {new Date(sale.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Number(sale.amount_usd).toFixed(2)} $</p>
                              <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                                <span>Honoraires: {(Number(sale.amount_usd) * 0.2).toFixed(2)} $</span>
                                <span>Net: {(Number(sale.amount_usd) * 0.8).toFixed(2)} $</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSale(sale.id)}
                              className="bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/40 rounded-xl transition-all duration-300 hover:scale-105"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Aucune vente enregistrée</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Commencez par ajouter votre première vente pour voir vos statistiques
                    </p>
                    <Button 
                      onClick={() => setShowAddForm(true)} 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Ajouter ma première vente</span>
                      <span className="sm:hidden">Première vente</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Weekly View Tab */}
          <TabsContent value="weekly" className="space-y-8">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                <WeeklyView sales={sales} modelId={params.id as string} />
              </div>
            </div>
          </TabsContent>

          {/* Monthly View Tab */}
          <TabsContent value="monthly" className="space-y-8">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                <MonthlyView sales={sales} modelId={params.id as string} theme={theme} />
              </div>
            </div>
          </TabsContent>

          {/* Statistics & Reports Tab */}
          <TabsContent value="reports" className="space-y-8">
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
              <div className="p-8">
                <StatisticsReports 
                  sales={sales} 
                  model={modelForReports} 
                  theme={theme || "light"} 
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}