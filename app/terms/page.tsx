"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, AlertTriangle, Users, CreditCard, Shield, Gavel, Moon, Sun, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function TermsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [visibleElements, setVisibleElements] = useState(new Set())
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
    const elementsToObserve = [heroRef, contentRef]
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
  }, [observerCallback])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
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
          className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            right: '10%',
            top: '40%',
            transform: `translateY(${scrollY * -0.08}px) rotate(${scrollY * -0.03}deg)`
          }}
        ></div>
        <div 
          className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            left: '20%',
            bottom: '20%',
            transform: `translateY(${scrollY * 0.06}px) rotate(${scrollY * 0.02}deg)`
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/')} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 rounded-full px-4 py-2 hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105">
              <ArrowLeft className="h-4 w-4" />
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

      {/* Apple-style Hero Section */}
      <section ref={heroRef} id="hero" className="relative pt-24 pb-16 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`max-w-4xl mx-auto space-y-8 transition-all duration-1000 ${visibleElements.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="space-y-6">
              <h2 className="text-[clamp(2.5rem,6vw,4rem)] font-bold leading-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Conditions d'Utilisation
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Les règles et conditions qui régissent l'utilisation de Sales Tracker Pro.
              </p>
              <div className="flex items-center justify-center gap-2 glass rounded-full px-6 py-3">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Usage responsable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Content */}
      <section ref={contentRef} id="content" className="relative py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className={`space-y-8 transition-all duration-1000 delay-300 ${visibleElements.has('content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Introduction */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Conditions Générales d'Utilisation</h3>
                  <p className="text-gray-600 dark:text-gray-300">Nos engagements et vos droits</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  Bienvenue sur Sales Tracker Pro. En utilisant notre plateforme, vous acceptez d'être lié par les 
                  présentes conditions d'utilisation. Veuillez les lire attentivement avant d'utiliser nos services.
                </p>
                <p className="text-sm">
                  <strong>Dernière mise à jour :</strong> 4 septembre 2025
                </p>
              </div>
            </div>

            {/* Acceptation des conditions */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Acceptation des Conditions</h3>
                  <p className="text-gray-600 dark:text-gray-300">Vos engagements en utilisant notre service</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  En accédant à Sales Tracker Pro et en l'utilisant, vous confirmez que :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Vous avez lu, compris et accepté ces conditions d'utilisation</li>
                  <li>Vous êtes âgé d'au moins 18 ans ou avez l'autorisation parentale</li>
                  <li>Vous avez la capacité juridique de conclure un contrat contraignant</li>
                  <li>Votre utilisation respectera toutes les lois et réglementations applicables</li>
                </ul>
              </div>
            </div>

            {/* Description du service */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Description du Service</h3>
                  <p className="text-gray-600 dark:text-gray-300">Ce que nous offrons</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Sales Tracker Pro est une plateforme de gestion et de suivi des ventes qui offre :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Suivi en temps réel des performances commerciales</li>
                  <li>Génération de rapports et analyses détaillées</li>
                  <li>Gestion multi-utilisateurs avec différents niveaux d'accès</li>
                  <li>Calculs automatiques de commissions et bénéfices</li>
                  <li>Stockage sécurisé des données commerciales</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300">
                  Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie 
                  du service à tout moment, avec ou sans préavis.
                </p>
              </div>
            </div>

            {/* Comptes utilisateurs */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Comptes Utilisateurs</h3>
                  <p className="text-gray-600 dark:text-gray-300">Gestion et responsabilités</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Création de compte</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Vous devez fournir des informations exactes et complètes</li>
                    <li>Vous êtes responsable de maintenir la confidentialité de vos identifiants</li>
                    <li>Vous devez nous informer immédiatement de toute utilisation non autorisée</li>
                    <li>Un seul compte par personne est autorisé</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Responsabilités</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Vous êtes entièrement responsable de toutes les activités qui se produisent sous votre compte. 
                    Nous ne sommes pas responsables des pertes résultant de l'utilisation non autorisée de votre compte.
                  </p>
                </div>
              </div>
            </div>

            {/* Utilisation acceptable */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Utilisation Acceptable</h3>
                  <p className="text-gray-600 dark:text-gray-300">Règles d'usage</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Utilisations autorisées</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Suivi légitime de vos activités commerciales</li>
                    <li>Génération de rapports pour votre usage professionnel</li>
                    <li>Collaboration avec votre équipe commerciale</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Utilisations interdites</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Utilisation pour des activités illégales ou frauduleuses</li>
                    <li>Tentative d'accès non autorisé aux systèmes ou données</li>
                    <li>Transmission de virus, malwares ou codes malveillants</li>
                    <li>Utilisation excessive pouvant affecter les performances</li>
                    <li>Revente ou redistribution du service sans autorisation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Paiements et facturation */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Paiements et Facturation</h3>
                  <p className="text-gray-600 dark:text-gray-300">Modalités financières</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Abonnements</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Les frais d'abonnement sont facturés à l'avance</li>
                    <li>Les paiements sont non remboursables sauf disposition contraire</li>
                    <li>Les prix peuvent être modifiés avec un préavis de 30 jours</li>
                    <li>Le défaut de paiement peut entraîner la suspension du service</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Essai gratuit</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    L'essai gratuit de 14 jours ne nécessite pas de carte de crédit. À la fin de la période d'essai, 
                    votre compte sera automatiquement suspendu sauf si vous souscrivez à un abonnement payant.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contact</h3>
                  <p className="text-gray-600 dark:text-gray-300">Questions sur les conditions</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Pour toute question concernant ces conditions d'utilisation :
                </p>
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 space-y-2">
                  <p className="text-gray-900 dark:text-white"><strong>E-mail :</strong> contact@salestrackerpro.com</p>
                  <p className="text-gray-900 dark:text-white"><strong>Adresse :</strong> Sales Tracker Pro, Service Juridique</p>
                  <p className="text-gray-900 dark:text-white"><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
                </div>
              </div>
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
                onClick={() => window.open('/contact', '_blank')} 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
              >
                Contact
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')} 
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
              >
                Accueil
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
