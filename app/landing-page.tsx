"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Euro,
  Shield,
  ArrowRight,
  Star,
  CheckCircle,
  Zap,
  Target,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { PublicBackground, PublicHeader, PublicFooter } from "@/components/public-shell"

interface LandingPageProps {
  onLoginClick: () => void
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    setMounted(true)
    if (user && !authLoading) {
      router.push("/dashboard")
    }
  }, [user, authLoading, router])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offsetPosition = element.offsetTop - 96
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PublicBackground />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PublicBackground />
      <PublicHeader
        onLoginClick={onLoginClick}
        showLandingNav
        onScrollTo={scrollToSection}
      />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 border border-violet-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                Bienvenue sur Sales Tracker Pro
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.06] tracking-tight text-slate-900 dark:text-white">
                Là où l&apos;Expertise{" "}
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  Propulse Vos Ventes
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 max-w-xl leading-relaxed">
                Transformez votre suivi commercial avec notre plateforme d&apos;analytics avancée.
                Suivez vos ventes brutes, commissions et revenus nets en temps réel.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={onLoginClick}
                  className="inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-full pl-6 pr-2.5 py-2.5 shadow-xl shadow-violet-600/25 hover:scale-[1.02] transition-all"
                >
                  <span>Découvrir la plateforme</span>
                  <span className="w-8 h-8 rounded-full bg-white text-violet-700 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>

                <button
                  onClick={() => scrollToSection("features")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium bg-white/80 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200 dark:border-white/15 backdrop-blur-md hover:bg-white dark:hover:bg-white/15 transition-all"
                >
                  Voir les fonctionnalités
                </button>
              </div>

              {/* Trust / Rating Row */}
              <div className="pt-4 flex flex-wrap items-center gap-6">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-slate-500 dark:text-gray-400 ml-1">(4.9/5)</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    4.9 <span className="text-xs font-normal text-slate-500 dark:text-gray-400">Avis vérifiés</span>
                  </p>
                </div>

                <div className="h-10 w-px bg-slate-200 dark:bg-white/15 hidden sm:block" />

                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mb-1.5">Équipes actives</p>
                  <div className="flex -space-x-2">
                    {["MJ", "TL", "SM", "FA"].map((init, idx) => (
                      <div
                        key={init}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-white shadow"
                        style={{
                          background: [
                            "linear-gradient(135deg,#7c3aed,#a855f7)",
                            "linear-gradient(135deg,#db2777,#f43f5e)",
                            "linear-gradient(135deg,#9333ea,#c026d3)",
                            "linear-gradient(135deg,#1e1b4b,#4c1d95)",
                          ][idx],
                        }}
                      >
                        {init}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                      +
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Mockup Card */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-[#161224] text-white rounded-[2rem] p-6 border border-white/15 shadow-2xl transform lg:rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-gray-400">Revenus Nets (80%)</p>
                      <p className="text-3xl font-bold text-emerald-400 mt-1">$1,543.00</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      +18.4%
                    </span>
                  </div>

                  {/* Mini SVG Chart */}
                  <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/5">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>Performance Hebdomadaire</span>
                      <span className="text-amber-400 font-medium">Temps réel</span>
                    </div>
                    <svg viewBox="0 0 280 80" className="w-full h-20 overflow-visible">
                      <defs>
                        <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 65 Q 40 50, 70 55 T 140 35 T 210 25 T 280 10 L 280 80 L 0 80 Z"
                        fill="url(#violetGrad)"
                      />
                      <path
                        d="M0 65 Q 40 50, 70 55 T 140 35 T 210 25 T 280 10"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="280" cy="10" r="5" fill="#f59e0b" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-gray-400">Ventes Brutes</p>
                      <p className="text-lg font-bold text-white mt-0.5">$1,928.75</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-gray-400">Commission (20%)</p>
                      <p className="text-lg font-bold text-rose-400 mt-0.5">$385.75</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-5 -right-2 sm:right-4 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-2xl px-5 py-3 shadow-xl border border-white/20">
                  <p className="text-2xl font-extrabold leading-none">24/7</p>
                  <p className="text-xs font-semibold text-rose-100 mt-1">Suivi Automatisé</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dark 3-Column Feature Strip */}
          <div className="mt-16 bg-[#161224]/95 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="flex items-start gap-4 pt-2 md:pt-0">
                <div className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Analytics Temps Réel</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Visualisez vos performances quotidiennes, hebdomadaires et mensuelles instantanément.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-6 md:pt-0 md:pl-6">
                <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <Euro className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Calculs Automatisés</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Commissions (20%) et revenus nets (80%) calculés sans aucune erreur.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-6 md:pt-0 md:pl-6">
                <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sécurité Maximale</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Accès multi-utilisateurs sécurisé, chiffrement SSL et contrôle des permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Mission + Big KPI Numbers */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="bg-white/80 dark:bg-[#1c162e]/85 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-slate-200/70 dark:border-white/10 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300">
                  À propos de nous
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                  La Référence pour Piloter Vos Modèles & Revenus
                </h2>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                  Sales Tracker Pro centralise le suivi de vos modèles, automatise vos rapports financiers et donne à vos équipes une vision claire de chaque dollar généré.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Notre Mission</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        Simplifier la gestion commerciale au quotidien.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Notre Vision</h4>
                      <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                        Des décisions rapides guidées par des données fiables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark CTA Banner */}
              <div className="bg-[#161224] text-white rounded-3xl p-8 space-y-6 border border-white/10">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-400">
                  <CheckCircle className="h-4 w-4" />
                  Prêt en moins de 2 minutes
                </div>
                <h3 className="text-2xl font-bold leading-snug">
                  Rejoignez les équipes qui optimisent leurs ventes chaque jour
                </h3>
                <p className="text-sm text-gray-400">
                  Créez vos modèles, saisissez vos ventes quotidiennes et exportez vos bilans mensuels en un clic.
                </p>
                <button
                  onClick={onLoginClick}
                  className="inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-full pl-5 pr-2 py-2 transition-all"
                >
                  <span>Accéder au tableau de bord</span>
                  <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </div>
            </div>

            {/* 4 Big Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-10 mt-10 border-t border-slate-200 dark:border-white/10">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  24<span className="text-violet-600 dark:text-violet-400">/7</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Disponibilité temps réel</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  150K<span className="text-emerald-600 dark:text-emerald-400">+</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Ventes suivies</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  98<span className="text-rose-600 dark:text-rose-400">%</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Satisfaction client</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  80<span className="text-amber-600 dark:text-amber-400">%</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Calcul net automatisé</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-3">
                Fonctionnalités
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Des Outils Conçus Pour la Croissance
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-300 max-w-md">
              Chaque module a été pensé pour offrir une lecture claire et rapide de vos chiffres.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                color: "text-violet-400",
                title: "Analytics en temps réel",
                desc: "Visualisez vos performances avec des graphiques interactifs et des rapports générés automatiquement.",
              },
              {
                icon: TrendingUp,
                color: "text-emerald-400",
                title: "Analyses avancées",
                desc: "Suivez vos tendances hebdomadaires et mensuelles avec une précision chirurgicale.",
              },
              {
                icon: Users,
                color: "text-rose-400",
                title: "Collaboration d'équipe",
                desc: "Administrez vos utilisateurs et modèles avec des permissions granulaires.",
              },
              {
                icon: Calendar,
                color: "text-amber-400",
                title: "Vues Semaine & Mois",
                desc: "Basculez entre saisie quotidienne, vue hebdomadaire et bilan mensuel en un clic.",
              },
              {
                icon: Euro,
                color: "text-emerald-400",
                title: "Calculs intelligents",
                desc: "Commissions (20%) et revenus nets (80%) calculés automatiquement sur chaque vente.",
              },
              {
                icon: Shield,
                color: "text-rose-400",
                title: "Sécurité entreprise",
                desc: "Authentification sécurisée, tokens chiffrés et protection stricte de vos données.",
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div
                key={title}
                className="bg-white/80 dark:bg-[#1c162e]/85 backdrop-blur-xl rounded-3xl p-7 border border-slate-200/70 dark:border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl bg-[#161224] ${color} flex items-center justify-center mb-5 shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-3">
              Témoignages
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Ils Nous Font Confiance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Une révolution dans notre gestion commerciale. L'interface est claire et les chiffres sont toujours à jour.",
                name: "Marie Dubois",
                role: "Directrice Commerciale, TechCorp",
                initials: "MD",
              },
              {
                quote:
                  "Les vues hebdomadaires et mensuelles nous donnent un avantage décisif pour suivre chaque modèle.",
                name: "Thomas Laurent",
                role: "CEO, InnovSales",
                initials: "TL",
              },
              {
                quote:
                  "Fini les calculs manuels ! Le calcul automatique des commissions nous fait gagner 15h par semaine.",
                name: "Sophie Martin",
                role: "Fondatrice, AgencePro",
                initials: "SM",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-white/80 dark:bg-[#1c162e]/85 backdrop-blur-xl rounded-3xl p-7 border border-slate-200/70 dark:border-white/10 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <div className="w-10 h-10 rounded-full bg-[#161224] text-violet-400 flex items-center justify-center font-bold text-xs">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-3">
              Tarifs
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Tarifs Transparents
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white/80 dark:bg-[#1c162e]/85 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 dark:border-white/10 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Starter</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Parfait pour débuter</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-6">Gratuit</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 mb-6">14 jours d&apos;essai</p>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-500" /> Jusqu&apos;à 3 modèles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-500" /> Rapports de base
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-500" /> Support email
                  </li>
                </ul>
              </div>
              <button
                onClick={onLoginClick}
                className="w-full py-3 rounded-full font-semibold text-sm bg-[#161224] text-white hover:bg-slate-800 transition-colors"
              >
                Commencer gratuitement
              </button>
            </div>

            {/* Pro */}
            <div className="bg-[#161224] text-white rounded-3xl p-8 border-2 border-violet-500 shadow-2xl relative flex flex-col justify-between">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-violet-600 text-white">
                Populaire
              </span>
              <div>
                <h3 className="text-xl font-bold">Pro</h3>
                <p className="text-sm text-gray-400 mt-1">Pour les équipes en croissance</p>
                <p className="text-4xl font-bold text-violet-400 mt-6">
                  29€<span className="text-base font-normal text-gray-400">/mois</span>
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-6">Facturé annuellement</p>
                <ul className="space-y-3 text-sm text-gray-200 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-400" /> Modèles illimités
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-400" /> Rapports avancés
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-400" /> Collaboration équipe
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-400" /> Support prioritaire
                  </li>
                </ul>
              </div>
              <button
                onClick={onLoginClick}
                className="w-full py-3 rounded-full font-semibold text-sm bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                Choisir Pro
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white/80 dark:bg-[#1c162e]/85 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 dark:border-white/10 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Pour les grandes organisations</p>
                <p className="text-4xl font-bold text-slate-900 dark:text-white mt-6">Sur mesure</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 mb-6">Contactez-nous</p>
                <ul className="space-y-3 text-sm text-slate-700 dark:text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-500" /> Tout du plan Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-500" /> API personnalisée
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-violet-500" /> Support dédié 24/7
                  </li>
                </ul>
              </div>
              <button
                onClick={() => router.push("/contact")}
                className="w-full py-3 rounded-full font-semibold text-sm bg-[#161224] text-white hover:bg-slate-800 transition-colors"
              >
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
