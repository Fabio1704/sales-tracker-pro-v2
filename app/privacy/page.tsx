"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Shield, Eye, Lock, Users, Database, Cookie, Mail, TrendingUp, Moon, Sun, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export default function PrivacyPage() {
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
                Politique de Confidentialité
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles.
              </p>
              <div className="flex items-center justify-center gap-2 glass rounded-full px-6 py-3">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Conforme RGPD</span>
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
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Introduction</h3>
                  <p className="text-gray-600 dark:text-gray-300">Nos engagements envers votre vie privée</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  Chez Sales Tracker Pro, nous nous engageons à protéger votre vie privée et vos données personnelles. 
                  Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons 
                  vos informations lorsque vous utilisez notre plateforme.
                </p>
                <p className="text-sm">
                  <strong>Dernière mise à jour :</strong> 4 septembre 2025
                </p>
              </div>
            </div>

            {/* Données collectées */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Données que nous collectons</h3>
                  <p className="text-gray-600 dark:text-gray-300">Types d'informations recueillies</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Informations d'identification</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Nom et prénom</li>
                    <li>Adresse e-mail</li>
                    <li>Mot de passe (chiffré)</li>
                    <li>Photo de profil (optionnelle)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Données commerciales</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Informations sur vos ventes et transactions</li>
                    <li>Données de performance commerciale</li>
                    <li>Statistiques d'utilisation de la plateforme</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Données techniques</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Adresse IP et informations de connexion</li>
                    <li>Type de navigateur et système d'exploitation</li>
                    <li>Cookies et données de session</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Utilisation des données */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Comment nous utilisons vos données</h3>
                  <p className="text-gray-600 dark:text-gray-300">Finalités du traitement</p>
                </div>
              </div>
              <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300">
                <li>Fournir et améliorer nos services de suivi des ventes</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Générer des rapports et analyses de performance</li>
                <li>Assurer la sécurité et prévenir la fraude</li>
                <li>Vous contacter concernant votre compte ou nos services</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
            </div>

            {/* Protection des données */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Protection de vos données</h3>
                  <p className="text-gray-600 dark:text-gray-300">Sécurité et confidentialité</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Mesures de sécurité</h4>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Chiffrement SSL/TLS pour toutes les communications</li>
                    <li>Chiffrement des mots de passe avec bcrypt</li>
                    <li>Authentification à deux facteurs disponible</li>
                    <li>Surveillance continue des accès et activités</li>
                    <li>Sauvegardes régulières et sécurisées</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Accès aux données</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Seuls les employés autorisés ont accès à vos données, et uniquement dans le cadre 
                    de leurs fonctions. Tous nos employés sont tenus par des accords de confidentialité stricts.
                  </p>
                </div>
              </div>
            </div>

            {/* Vos droits */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Vos droits</h3>
                  <p className="text-gray-600 dark:text-gray-300">Conformité RGPD</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Conformément au RGPD et aux lois sur la protection des données, vous disposez des droits suivants :
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300">
                  <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> Corriger des données inexactes ou incomplètes</li>
                  <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                  <li><strong>Droit de limitation :</strong> Demander la limitation du traitement</li>
                </ul>
              </div>
            </div>

            {/* Cookies */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Politique des cookies</h3>
                  <p className="text-gray-600 dark:text-gray-300">Gestion des cookies</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300">
                  <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site</li>
                  <li><strong>Cookies de performance :</strong> Nous aident à améliorer nos services</li>
                  <li><strong>Cookies de préférences :</strong> Mémorisent vos paramètres</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300">
                  Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="glass-dark rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nous contacter</h3>
                  <p className="text-gray-600 dark:text-gray-300">Questions et exercice des droits</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits :
                </p>
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-2xl p-6 space-y-2">
                  <p className="text-gray-900 dark:text-white"><strong>E-mail :</strong> contact@salestrackerpro.com</p>
                  <p className="text-gray-900 dark:text-white"><strong>Adresse :</strong> Sales Tracker Pro, Service Protection des Données</p>
                  <p className="text-gray-900 dark:text-white"><strong>Délégué à la Protection des Données :</strong> contact@salestrackerpro.com</p>
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
