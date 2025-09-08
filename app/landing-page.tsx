"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Calendar, Euro, Shield, ArrowRight, Star, CheckCircle, Target, Moon, Sun, Sparkles, Zap, Globe, Lock, ChevronDown, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

// Ajoutez l'interface pour les props
interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [visibleElements, setVisibleElements] = useState(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Intersection Observer for scroll animations
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setVisibleElements(prev => new Set(prev).add(entry.target.id))
      }
    })
  }, [])

  useEffect(() => {
    setMounted(true)
    // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
    if (user && !authLoading) {
      router.push('/dashboard');
    }

    // Smooth parallax scroll effect with throttling
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    
    // Optimized mouse tracking with throttling
    let mouseTicking = false
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseTicking) {
        requestAnimationFrame(() => {
          setMousePosition({ x: e.clientX, y: e.clientY })
          mouseTicking = false
        })
        mouseTicking = true
      }
    }

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '50px'
    })

    // Observe elements
    const elementsToObserve = [heroRef, featuresRef, testimonialsRef, ctaRef]
    elementsToObserve.forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      observer.disconnect()
    }
  }, [user, authLoading, router, observerCallback])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80 // Hauteur du header fixe
      const elementPosition = element.offsetTop
      const offsetPosition = elementPosition - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
          }}
        ></div>
        
        {/* Floating orbs with Apple-style blur */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            left: '10%',
            top: '20%',
            transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)`
          }}
        ></div>
        <div 
          className="absolute w-80 h-80 rounded-full opacity-25 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            right: '15%',
            top: '40%',
            transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.03}deg)`
          }}
        ></div>
        <div 
          className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            left: '60%',
            bottom: '30%',
            transform: `translateY(${scrollY * 0.08}px) rotate(${scrollY * 0.02}deg)`
          }}
        ></div>
        
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
            transform: `translateY(${scrollY * 0.02}px)`,
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)'
          }}
        ></div>
      </div>
      
      {/* Apple-style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-black/10 dark:border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Témoignages
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Tarifs
              </button>
            </nav>

            <div className="flex items-center gap-3">
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
                onClick={onLoginClick} 
                className="hidden sm:flex bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg px-6 py-2"
              >
                Se connecter
              </Button>

              {/* Menu Hamburger Mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-l border-gray-200/20 dark:border-gray-700/20 shadow-2xl">
            <div className="flex flex-col h-full pt-20 px-6">
              <nav className="flex flex-col gap-6">
                <button 
                  onClick={() => {
                    scrollToSection('features')
                    setMobileMenuOpen(false)
                  }}
                  className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-3 border-b border-gray-200/50 dark:border-gray-700/50 w-full text-left"
                >
                  Fonctionnalités
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('testimonials')
                    setMobileMenuOpen(false)
                  }}
                  className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-3 border-b border-gray-200/50 dark:border-gray-700/50 w-full text-left"
                >
                  Témoignages
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('pricing')
                    setMobileMenuOpen(false)
                  }}
                  className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-3 border-b border-gray-200/50 dark:border-gray-700/50 w-full text-left"
                >
                  Tarifs
                </button>
              </nav>
              
              <div className="mt-8">
                <Button 
                  onClick={() => {
                    onLoginClick()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg py-3"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Se connecter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apple-style Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-20"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Main headline with Apple typography and staggered animations */}
            <div className="space-y-6 sm:space-y-8">
              <div className="overflow-hidden px-2">
                <h1 className="text-[clamp(2.5rem,10vw,6rem)] font-bold leading-[0.95] tracking-tight">
                  <div className="animate-text-reveal animate-delay-200">
                    <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                      Révolutionnez
                    </span>
                  </div>
                  <div className="animate-text-reveal animate-delay-400">
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      vos ventes
                    </span>
                  </div>
                </h1>
              </div>
              
              <div className="animate-fade-in-up animate-delay-600 px-2">
                <p className="text-[clamp(1.125rem,2.5vw,1.5rem)] text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed" style={{ animationDelay: '0.4s' }}>
                  Transformez votre approche commerciale avec notre plateforme d'analytics avancée.
                  Prenez des décisions éclairées et boostez vos performances.
                </p>
              </div>
            </div>

            {/* Apple-style feature badges with staggered animations */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 py-6 sm:py-8 px-2">
              <div className="animate-fade-in-scale animate-delay-800 flex items-center gap-2 glass rounded-full px-4 sm:px-6 py-2 sm:py-3 hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Analytics Avancés</span>
              </div>
              <div className="animate-fade-in-scale animate-delay-900 flex items-center gap-2 glass rounded-full px-4 sm:px-6 py-2 sm:py-3 hover:scale-105 transition-transform duration-300">
                <Lock className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Sécurité maximale</span>
              </div>
              <div className="animate-fade-in-scale animate-delay-1000 flex items-center gap-2 glass rounded-full px-4 sm:px-6 py-2 sm:py-3 hover:scale-105 transition-transform duration-300">
                <Globe className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Accès mondial</span>
              </div>
            </div>

            {/* Apple-style CTA with enhanced animations */}
            <div className="space-y-4 sm:space-y-6 animate-fade-in-up animate-delay-1000 px-2">
              <div className="group">
                <Button 
                  onClick={onLoginClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-semibold transition-all duration-500 hover:scale-105 hover:-translate-y-1 shadow-2xl hover:shadow-blue-500/30 group-hover:shadow-blue-500/40 w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Découvrir Sales Tracker Pro</span>
                  <span className="sm:hidden">Découvrir STP</span>
                  <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up animate-delay-1000">
                Essai gratuit • Sans engagement • Configuration en 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Features Section */}
      <section 
        ref={featuresRef}
        id="features"
        className="relative section-padding bg-white/50 dark:bg-black/50 backdrop-blur-sm"
        style={{
          transform: `translateY(${scrollY * 0.05}px)`
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-16 sm:mb-20 fade-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''} px-2">
            <h2 className="text-[clamp(1.75rem,4.5vw,2.5rem)] font-bold leading-tight mb-6 sm:mb-8 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Conçu pour l'excellence
            </h2>
            <p className="text-[clamp(1rem,2.2vw,1.25rem)] text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Chaque fonctionnalité a été pensée pour vous offrir une expérience exceptionnelle
            </p>
          </div>

          {/* Apple-style feature grid with enhanced animations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-2">
            <div className="group relative glass-dark rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl scale-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''}" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 gpu-accelerated">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-subheadline mb-4 text-gray-900 dark:text-white">
                Analytics en temps réel
              </h3>
              <p className="text-caption text-gray-600 dark:text-gray-300">
                Visualisez vos performances avec des graphiques interactifs et des rapports détaillés générés automatiquement.
              </p>
            </div>

            <div className="group relative glass-dark rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl scale-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''}" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 gpu-accelerated">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-subheadline mb-4 text-gray-900 dark:text-white">
                Analyses avancées
              </h3>
              <p className="text-caption text-gray-600 dark:text-gray-300">
                Anticipez les tendances avec nos analyses statistiques qui génèrent des rapports de ventes précis et des données de confiance.
              </p>
            </div>

            <div className="group relative glass-dark rounded-3xl p-8 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl scale-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''}" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 gpu-accelerated">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-subheadline mb-4 text-gray-900 dark:text-white">
                Collaboration d'équipe
              </h3>
              <p className="text-caption text-gray-600 dark:text-gray-300">
                Travaillez ensemble avec des permissions granulaires et un partage sécurisé.
              </p>
            </div>

            <div className="group relative glass-dark rounded-3xl p-8 hover:border-orange-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl scale-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''}" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 gpu-accelerated">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-subheadline mb-4 text-gray-900 dark:text-white">
                Automatisation complète
              </h3>
              <p className="text-caption text-gray-600 dark:text-gray-300">
                Rapports automatiques, notifications intelligentes et workflows personnalisés.
              </p>
            </div>

            <div className="group relative glass-dark rounded-3xl p-8 hover:border-yellow-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl scale-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''}" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 gpu-accelerated">
                <Euro className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-subheadline mb-4 text-gray-900 dark:text-white">
                Calculs intelligents
              </h3>
              <p className="text-caption text-gray-600 dark:text-gray-300">
                Commissions, taxes et bénéfices calculés automatiquement avec une précision parfaite.
              </p>
            </div>

            <div className="group relative glass-dark rounded-3xl p-8 hover:border-red-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl scale-in-on-scroll ${visibleElements.has('features') ? 'visible' : ''}" style={{ animationDelay: '0.6s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 gpu-accelerated">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-subheadline mb-4 text-gray-900 dark:text-white">
                Sécurité de niveau entreprise
              </h3>
              <p className="text-caption text-gray-600 dark:text-gray-300">
                Chiffrement end-to-end, authentification multi-facteurs et conformité RGPD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Testimonials Section */}
      <section className="relative py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20 px-2">
            <h2 className="text-[clamp(1.75rem,4.5vw,2.5rem)] font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Ils nous font confiance
            </h2>
            <p className="text-[clamp(1rem,2.2vw,1.25rem)] text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Découvrez comment Sales Tracker Pro transforme les entreprises
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-2">
            <div className="group relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Une révolution dans notre gestion commerciale. L'interface est d'une élégance rare et les insights sont d'une précision chirurgicale."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-semibold text-white text-sm">MJ</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Marie Dubois</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Directrice Commerciale, TechCorp</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Les analyses détaillées et les rapports automatiques nous donnent un avantage concurrentiel décisif. Nous anticipons les tendances avec une précision étonnante."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-semibold text-white text-sm">TP</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Thomas Laurent</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CEO, InnovSales</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Fini les calculs manuels ! L'automatisation nous fait économiser 15 heures par semaine. Un investissement qui se rentabilise immédiatement."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-semibold text-white text-sm">SL</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sophie Martin</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fondatrice, AgencePro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section 
        ref={testimonialsRef}
        id="testimonials"
        className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Découvrez comment Sales Tracker Pro transforme les entreprises
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="group relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Sales Tracker Pro a révolutionné notre approche commerciale. Nos ventes ont augmenté de 40% en 3 mois grâce aux insights précis."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-semibold text-white text-sm">TL</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Thomas Laurent</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CEO, InnovSales</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Fini les calculs manuels ! L'automatisation nous fait économiser 15 heures par semaine. Un investissement qui se rentabilise immédiatement."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-semibold text-white text-sm">SM</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Sophie Martin</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fondatrice, AgencePro</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="flex items-center mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                "Interface intuitive et rapports détaillés. Nos équipes ont adopté l'outil en quelques jours. Performance exceptionnelle !"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-semibold text-white text-sm">MD</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Marc Dubois</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Directeur Commercial, TechCorp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section 
        id="pricing"
        className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Tarifs transparents
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Starter */}
            <div className="relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Parfait pour débuter</p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  Gratuit
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">14 jours d'essai</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Jusqu'à 3 modèles</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Rapports de base</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Support email</span>
                </li>
              </ul>
              
              <Button 
                onClick={onLoginClick}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg py-3"
              >
                Commencer gratuitement
              </Button>
            </div>

            {/* Plan Pro */}
            <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Pour les équipes en croissance</p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  29€
                  <span className="text-lg text-gray-500 dark:text-gray-400">/mois</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Facturé annuellement</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Modèles illimités</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Rapports avancés</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Collaboration équipe</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Support prioritaire</span>
                </li>
              </ul>
              
              <Button 
                onClick={onLoginClick}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg py-3"
              >
                Choisir Pro
              </Button>
            </div>

            {/* Plan Enterprise */}
            <div className="relative bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Pour les grandes organisations</p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  Sur mesure
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Contactez-nous</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Tout du plan Pro</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">API personnalisée</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Support dédié 24/7</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Formation sur site</span>
                </li>
              </ul>
              
              <Button 
                onClick={onLoginClick}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full font-medium transition-all duration-200 hover:scale-105 shadow-lg py-3"
              >
                Nous contacter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style CTA Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 px-2">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-[clamp(1.75rem,5vw,3rem)] font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Prêt pour l'excellence ?
              </h2>
              <p className="text-[clamp(1.125rem,2.5vw,1.5rem)] text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Rejoignez les leaders qui ont déjà transformé leur approche commerciale
              </p>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 py-8 sm:py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Essai gratuit 14 jours</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Découvrez toutes les fonctionnalités sans engagement</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Configuration express</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Opérationnel en moins de 2 minutes</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Support premium</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Assistance dédiée 24h/24, 7j/7</p>
                </div>
              </div>
            </div>

            {/* Main CTA */}
            <div className="space-y-4 sm:space-y-6">
              <Button 
                onClick={onLoginClick}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-black/25 dark:hover:shadow-white/25 w-full sm:w-auto"
              >
                Commencer maintenant
                <ArrowRight className="h-5 sm:h-6 w-5 sm:w-6 ml-2 sm:ml-3" />
              </Button>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune carte bancaire requise • Annulation à tout moment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Footer */}
      <footer className="relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-6 sm:space-y-0 px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Sales Tracker Pro
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 Tous droits réservés</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-8">
              <Button 
                variant="ghost" 
                onClick={() => window.open('/privacy', '_blank')} 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
              >
                Confidentialité
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.open('/terms', '_blank')} 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
              >
                Conditions
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.open('/contact', '_blank')} 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
              >
                Contact
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}