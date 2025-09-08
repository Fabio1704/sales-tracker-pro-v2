"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import LandingPage from "./landing-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Moon, Sun, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

export default function HomePage() {
  const [showContent, setShowContent] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { user, login, isLoading: authLoading } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (authLoading) return
    
    if (user) {
      router.push('/dashboard')
    } else {
      // Afficher le contenu après un court délai
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user, authLoading, router])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      await login(email, password)
      toast.success("Connexion réussie")
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || 'Erreur de connexion')
      toast.error("Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  const navigateToLanding = () => {
    setIsLoginMode(false)
    setError("")
  }

  const navigateToLogin = () => {
    setIsLoginMode(true)
    setError("")
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Afficher le formulaire de login ou la landing page selon le mode
  if (isLoginMode) {
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
              <Button 
                variant="ghost" 
                onClick={navigateToLanding}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span className="hidden sm:inline font-medium">Retour</span>
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Sales Tracker Pro
                  </h1>
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
          </div>
        </header>
        
        {/* Main Content - Apple-style Hero Section */}
        <div className="min-h-screen flex items-center justify-center pt-24 pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Side - Hero Content */}
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-6">
                  <div className="overflow-hidden">
                    <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[0.95] tracking-tight">
                      <div className="animate-text-reveal animate-delay-200">
                        <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                          Bienvenue sur
                        </span>
                      </div>
                      <div className="animate-text-reveal animate-delay-400">
                        <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                          Sales Tracker Pro
                        </span>
                      </div>
                    </h1>
                  </div>
                  
                  <div className="animate-fade-in-up animate-delay-600">
                    <p className="text-[clamp(1.125rem,2.5vw,1.5rem)] text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                      Votre plateforme de suivi des ventes et d'analyse avancée. 
                      Connectez-vous pour accéder à vos données en temps réel.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 animate-fade-in-up animate-delay-800">
                  <div className="glass dark:glass-dark rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Avancés</h3>
                        <p className="text-gray-600 dark:text-gray-300">Suivez vos performances en temps réel</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass dark:glass-dark rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestion d'Équipe</h3>
                        <p className="text-gray-600 dark:text-gray-300">Administrez vos utilisateurs et modèles</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass dark:glass-dark rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rapports Détaillés</h3>
                        <p className="text-gray-600 dark:text-gray-300">Exportez et analysez vos données</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            
              {/* Right Side - Login Form */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md animate-fade-in-up animate-delay-400">
                  {error && (
                    <div className="mb-6 p-4 glass dark:glass-dark rounded-2xl border border-red-200 dark:border-red-800 animate-fade-in-up">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="glass dark:glass-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-white/10">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                        Connexion
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Accédez à votre espace personnel
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email ou nom d'utilisateur
                        </Label>
                        <Input
                          id="email"
                          type="text"
                          placeholder="Email ou nom d'utilisateur"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mot de passe
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Entrez votre mot de passe"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30"
                        />
                      </div>
                      
                      <Button
                        className="w-full h-12 text-base font-semibold bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg"
                        onClick={handleLogin}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          <>
                            Se connecter
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      <div className="text-center pt-4 space-y-2">
                        <button 
                          onClick={() => router.push('/forgot-password')}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline transition-colors"
                        >
                          Mot de passe oublié ?
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Besoin d'aide ? 
                          <a 
                            href="/contact" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline transition-colors ml-1"
                          >
                            Contactez l'administrateur
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Afficher la landing page par défaut
  return <LandingPage onLoginClick={navigateToLogin} />
}