"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, User, BarChart3, Moon, Sun, Home, Shield, Loader2, Upload, X, RefreshCw, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, ModelProfile } from "@/lib/api"
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

export default function DashboardPage() {
  const [models, setModels] = useState<ModelProfile[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      loadModels();
    }
  }, [user, authLoading, router])

  const loadModels = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token non trouvé');
      }

      console.log('🔄 Chargement des modèles...');
      const modelsData = await apiService.getModels();
      setModels(modelsData);
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des modèles:', err);
      
      if (err.message.includes('authentification') || 
          err.message.includes('401') || 
          err.message.includes('Token')) {
        setError('Session expirée. Redirection...');
        logout();
        setTimeout(() => router.push('/'), 2000);
      } else {
        setError(err.message || 'Erreur lors du chargement des modèles');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      setIsDeleting(modelId);
      setError(null);
      
      // Appel à l'API pour supprimer le modèle
      await apiService.deleteModel(modelId);
      
      // Mettre à jour l'état local
      setModels(models.filter(model => model.id !== modelId));
      
      // Afficher un message de succès
      setSuccess("Modèle supprimé avec succès");
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error('❌ Erreur lors de la suppression du modèle:', err);
      setError(err.message || 'Erreur lors de la suppression du modèle');
    } finally {
      setIsDeleting(null);
    }
  };


  const handleCreateModel = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError("Le prénom et le nom sont obligatoires")
      return
    }

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      // Créer le modèle avec les données de base
      const newModel = await apiService.createModel({
        first_name: formData.first_name,
        last_name: formData.last_name
      })

      // Réinitialiser le formulaire
      setFormData({ first_name: "", last_name: "" });
      setShowCreateForm(false);
      
      // Rafraîchir la liste des modèles
      await loadModels();
      setSuccess(`Modèle ${newModel.first_name} ${newModel.last_name} créé avec succès !`);

    } catch (error: any) {
      console.error('❌ Erreur lors de la création du modèle:', error);
      setError(error.message || "Erreur lors de la création du modèle");
    } finally {
      setIsCreating(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Apple-style Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950/50"></div>
        
        {/* Interactive mesh gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
          }}
        ></div>
        
        {/* Floating orbs with Apple-style blur */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            left: '10%',
            top: '20%'
          }}
        ></div>
        <div 
          className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl animate-float-delayed"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            right: '10%',
            top: '40%'
          }}
        ></div>
        <div 
          className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl animate-float-slow"
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            left: '20%',
            bottom: '20%'
          }}
        ></div>
        
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)'
          }}
        ></div>
      </div>

      {/* Apple-style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-black/10 dark:border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gestion de vos modèles</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')} 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Accueil</span>
              </Button>
              
              {user?.is_staff && (
                <Button
                  variant="ghost"
                  onClick={() => (window.location.href = "/admin")}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105"
                  title="Administration"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Admin</span>
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
              
              <Button 
                variant="ghost"
                size="icon"
                onClick={logout}
                className="w-10 h-10 rounded-full border-2 border-red-200 dark:border-red-800 hover:border-red-600 dark:hover:border-red-600 bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/30 hover:scale-105"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Tableau de bord
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Créez et gérez vos modèles de suivi des ventes avec une interface moderne et intuitive
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadModels}
              disabled={isRefreshing}
              className="glass dark:glass-dark rounded-full p-3 hover:scale-110 transition-all duration-300"
            >
              {isRefreshing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </Button>
          </div>

          {error && (
            <div className="mb-8 p-4 glass dark:glass-dark rounded-2xl border border-red-200 dark:border-red-800 animate-fade-in-up">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-8 p-4 glass dark:glass-dark rounded-2xl border border-green-200 dark:border-green-800 animate-fade-in-up">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="text-center mb-16 animate-fade-in-up animate-delay-800">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer un modèle
            </Button>
          </div>

          {/* Create Model Form */}
          {showCreateForm && (
            <div className="max-w-2xl mx-auto mb-16 glass dark:glass-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-white/10 animate-fade-in-up animate-delay-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                  Créer un nouveau modèle
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ajoutez les informations du modèle de suivi
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Entrez le prénom"
                      required
                      className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Entrez le nom"
                      required
                      className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30"
                    />
                  </div>
                </div>
                
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Un avatar sera généré automatiquement
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={handleCreateModel} 
                    disabled={isCreating} 
                    className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer le modèle"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      setFormData({ first_name: "", last_name: "" })
                      setError(null);
                    }} 
                    className="flex-1 h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/70 dark:hover:bg-black/30 transition-all duration-300"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}


          {/* Models Grid */}
          {models.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {models
                .sort((a, b) => {
                  const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                  const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                  return nameA.localeCompare(nameB);
                })
                .map((model, index) => (
                <div
                  key={model.id}
                  className="glass dark:glass-dark rounded-3xl p-6 cursor-pointer relative group hover:scale-[1.02] transition-all duration-300 shadow-lg animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => router.push(`/model/${model.id}`)}
                >
                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isDeleting === model.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass dark:glass-dark border border-white/20 dark:border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Supprimer le modèle</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer {model.first_name} {model.last_name} ? 
                          Cette action est irréversible et supprimera également toutes ses données de vente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteModel(model.id)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-lg font-semibold text-white">
                        {model.first_name?.[0]}{model.last_name?.[0]}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {model.first_name} {model.last_name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Modèle de suivi des ventes
                      {model.owner && model.owner.id !== user?.id && (
                        <span className="block text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Créé par: {model.owner.first_name} {model.owner.last_name}
                        </span>
                      )}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                      <User className="h-3 w-3" />
                      Actif
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in-up animate-delay-400">
              <div className="glass dark:glass-dark rounded-3xl p-12 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aucun modèle créé</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Commencez par créer votre premier modèle de suivi des ventes
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)} 
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl px-6 py-3 hover:scale-105 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier modèle
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}