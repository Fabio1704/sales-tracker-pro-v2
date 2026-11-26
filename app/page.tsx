"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import LandingPage from "./landing-page"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, TrendingUp, Users, AlertCircle, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PublicBackground, PublicHeader } from "@/components/public-shell"

export default function HomePage() {
  const [showContent, setShowContent] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)
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
      router.push("/dashboard")
    } else {
      const timer = setTimeout(() => setShowContent(true), 100)
      return () => clearTimeout(timer)
    }
  }, [user, authLoading, router])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await login(email, password)
      toast.success("Connexion réussie")
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Erreur de connexion")
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

  if (!mounted || authLoading || user || !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PublicBackground />
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (isLoginMode) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <PublicBackground />
        <PublicHeader actionLabel="Accueil" onActionClick={navigateToLanding} />

        <div className="min-h-screen flex items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl w-full mx-auto grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 border border-violet-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                Espace Membre
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
                Bienvenue sur{" "}
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  Sales Tracker Pro
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                Votre plateforme de suivi des ventes et d&apos;analyse avancée.
                Connectez-vous pour accéder à vos données en temps réel.
              </p>

              <div className="bg-[#161224]/95 text-white rounded-3xl p-6 border border-white/10 shadow-xl space-y-5">
                {[
                  { icon: TrendingUp, title: "Analytics Avancés", sub: "Suivez vos performances en temps réel" },
                  { icon: Users, title: "Gestion d'Équipe", sub: "Administrez vos utilisateurs et modèles" },
                  { icon: BarChart3, title: "Rapports Détaillés", sub: "Exportez et analysez vos données" },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{title}</h3>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/80 dark:border-white/10">
                <div className="mb-7">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-3">
                    Connexion
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Accédez à votre espace
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Entrez vos identifiants pour continuer
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                      Email ou nom d&apos;utilisateur
                    </Label>
                    <Input
                      id="email"
                      type="text"
                      name="username"
                      autoComplete="username"
                      placeholder="Email ou nom d'utilisateur"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-full shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Se connecter</span>
                        <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Besoin d&apos;aide ?{" "}
                      <a
                        href="/contact"
                        className="font-medium text-slate-900 dark:text-white hover:underline"
                      >
                        Contactez l&apos;administrateur
                      </a>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <LandingPage onLoginClick={navigateToLogin} />
}
