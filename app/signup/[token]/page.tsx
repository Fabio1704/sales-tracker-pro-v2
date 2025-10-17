"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Moon,
  Sun,
  UserPlus,
  ArrowRight,
  Loader2
} from "lucide-react"

interface InvitationData {
  contact_name: string
  contact_email: string
  contact_subject: string
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

export default function ClientSignupPage() {
  const params = useParams()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  })

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  useEffect(() => {
    setMounted(true)
    
    const fetchInvitationData = async () => {
      try {
        const token = params.token as string
        const response = await fetch(`https://sales-tracker-backend-j0c0.onrender.com/api/accounts/signup/${token}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Erreur API - Status:', response.status)
          console.error('Erreur API - Response:', errorText)
          try {
            const errorData = JSON.parse(errorText)
            setErrors([errorData.error || 'Erreur lors de la récupération des données d\'invitation'])
          } catch {
            setErrors(['Cette invitation n\'est plus valide ou a expiré.'])
          }
          return
        }

        if (response.ok) {
          const data = await response.json()
          console.log('Data received:', data)
          const invitationData = {
            contact_name: data.contact_name,
            contact_email: data.contact_email,
            contact_subject: data.contact_subject
          }
          setInvitation(invitationData)
          setFormData(prev => ({ 
            ...prev, 
            email: data.contact_email || data.email || ''
          }))
          console.log('Email set to:', data.contact_email || data.email || '')
        } else {
          // Log de l'erreur pour debugging
          const errorText = await response.text()
          console.error('Erreur API - Status:', response.status)
          console.error('Erreur API - Response:', errorText)
          console.error('Erreur lors de la récupération des données d\'invitation')
          
          // Ne pas rediriger automatiquement, afficher l'erreur à l'utilisateur
          setErrors(['Cette invitation n\'est plus valide ou a expiré.'])
        }
      } catch (error) {
        console.error('Erreur réseau:', error)
        router.push('/') // Rediriger vers l'accueil en cas d'erreur
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchInvitationData()
  }, [params.token, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (!formData.first_name.trim()) {
      newErrors.push("Le prénom est requis")
    }
    if (!formData.last_name.trim()) {
      newErrors.push("Le nom est requis")
    }
    if (!formData.email.trim()) {
      newErrors.push("L'email est requis")
    }
    if (!formData.password.trim()) {
      newErrors.push("Le mot de passe est requis")
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.push("Les mots de passe ne correspondent pas")
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      const token = params.token as string
      const response = await fetch(`https://sales-tracker-backend-j0c0.onrender.com/api/accounts/signup/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur API - Status:', response.status)
        console.error('Erreur API - Response:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          setErrors([errorData.error || 'Erreur lors de la création du compte'])
        } catch {
          setErrors(['Une erreur inattendue s\'est produite. Veuillez réessayer.'])
        }
        return
      }

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Sauvegarder les tokens d'authentification
        if (data.access_token) {
          localStorage.setItem('authToken', data.access_token)
          localStorage.setItem('access_token', data.access_token)
        }
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token)
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        console.log('✅ Compte créé et connexion automatique réussie')
        
        // Rediriger vers la landing page pour se connecter
        router.push('/')
      } else {
        setErrors([data.error || 'Une erreur est survenue lors de la création du compte'])
      }
    } catch (error) {
      setErrors(["Une erreur inattendue s'est produite. Veuillez réessayer."])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || isLoading) {
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-indigo-950/30"></div>
        
        {/* Floating orbs with parallax */}
        <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl" 
             style={{
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               left: '10%',
               top: '20%',
               transform: 'translateY(0px) rotate(0deg)',
               animation: 'float 20s ease-in-out infinite'
             }}>
        </div>
        <div className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl"
             style={{
               background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
               right: '15%',
               top: '60%',
               transform: 'translateY(0px) rotate(0deg)',
               animation: 'float 25s ease-in-out infinite reverse'
             }}>
        </div>
        <div className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl"
             style={{
               background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
               left: '60%',
               top: '10%',
               transform: 'translateY(0px) rotate(0deg)',
               animation: 'float 30s ease-in-out infinite'
             }}>
        </div>
        
        {/* Interactive mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0"
               style={{
                 background: `
                   radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                   radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
                 `
               }}>
          </div>
        </div>
        
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '100px 100px',
            maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)',
            transform: 'translateY(0px)',
            animation: 'gridMove 20s ease-in-out infinite'
          }}
        ></div>
      </div>

      {/* Apple-style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-black/10 dark:border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Sales Tracker Pro
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inscription Client</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-700 dark:text-gray-300" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="w-full max-w-lg glass dark:glass-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-white/10 animate-fade-in-up">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                Créer votre compte
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Vous avez été invité à rejoindre Sales Tracker Pro
              </p>
            </div>
            
            {invitation && (
              <div className="mb-8 p-4 glass dark:glass-dark rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{invitation.contact_name}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{invitation.contact_email}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{invitation.contact_subject}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Prénom
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Votre prénom"
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nom
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Votre nom"
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  readOnly
                  value={formData.email}
                  className="h-12 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl cursor-not-allowed"
                  autoComplete="username"
                />
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Choisissez un mot de passe sécurisé"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30 pr-12"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                
                <div className="p-4 glass dark:glass-dark rounded-2xl border border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Le mot de passe doit contenir :</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Au moins 8 caractères
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Une majuscule et une minuscule
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Un chiffre
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Un caractère spécial (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="Confirmez votre mot de passe"
                    className="h-12 bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 focus:scale-[1.02] focus:bg-white/70 dark:focus:bg-black/30 pr-12"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Messages d'erreur */}
              {errors.length > 0 && (
                <div className="p-4 glass dark:glass-dark rounded-2xl border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        Erreurs de validation :
                      </h4>
                      <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-red-500 rounded-full" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Sécurité */}
              <div className="p-4 glass dark:glass-dark rounded-2xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <Shield className="h-4 w-4" />
                  <span>Connexion sécurisée avec chiffrement SSL</span>
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
                  Vos données sont protégées par un chiffrement de niveau bancaire
                </p>
              </div>

              {/* Aide */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Besoin d'aide ?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => router.push('/contact')}
                  >
                    Contactez l'administrateur
                  </Button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
