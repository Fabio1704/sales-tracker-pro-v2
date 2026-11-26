"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams, useRouter } from "next/navigation"
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { PublicBackground, PublicHeader } from "@/components/public-shell"

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
  const [mounted, setMounted] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  })

  useEffect(() => {
    setMounted(true)

    const fetchInvitationData = async () => {
      try {
        const token = params.token as string
        const response = await fetch(
          `https://sales-tracker-backend-j0c0.onrender.com/api/accounts/signup/${token}/`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        )

        if (!response.ok) {
          const errorText = await response.text()
          try {
            const errorData = JSON.parse(errorText)
            setErrors([
              errorData.error ||
                "Erreur lors de la récupération des données d'invitation",
            ])
          } catch {
            setErrors(["Cette invitation n'est plus valide ou a expiré."])
          }
          return
        }

        const data = await response.json()
        setInvitation({
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          contact_subject: data.contact_subject,
        })
        setFormData((prev) => ({
          ...prev,
          email: data.contact_email || data.email || "",
        }))
      } catch {
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitationData()
  }, [params.token, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors.length > 0) setErrors([])
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []
    if (!formData.first_name.trim()) newErrors.push("Le prénom est requis")
    if (!formData.last_name.trim()) newErrors.push("Le nom est requis")
    if (!formData.email.trim()) newErrors.push("L'email est requis")
    if (!formData.password.trim()) newErrors.push("Le mot de passe est requis")
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
      const response = await fetch(
        `https://sales-tracker-backend-j0c0.onrender.com/api/accounts/signup/${token}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          setErrors([errorData.error || "Erreur lors de la création du compte"])
        } catch {
          setErrors(["Une erreur inattendue s'est produite. Veuillez réessayer."])
        }
        return
      }

      const data = await response.json()

      if (data.success) {
        if (data.access_token) {
          localStorage.setItem("authToken", data.access_token)
          localStorage.setItem("access_token", data.access_token)
        }
        if (data.refresh_token) {
          localStorage.setItem("refreshToken", data.refresh_token)
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        router.push("/")
      } else {
        setErrors([data.error || "Une erreur est survenue lors de la création du compte"])
      }
    } catch {
      setErrors(["Une erreur inattendue s'est produite. Veuillez réessayer."])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PublicBackground />
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PublicBackground />
      <PublicHeader actionLabel="Connexion" onActionClick={() => router.push("/")} />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/80 dark:border-white/10">
          <div className="text-center mb-7">
            <div className="w-14 h-14 mx-auto mb-4 bg-[#161224] text-violet-400 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="h-7 w-7" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-2">
              Invitation Client
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Créer votre compte
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Vous avez été invité à rejoindre Sales Tracker Pro
            </p>
          </div>

          {invitation && (
            <div className="mb-6 p-4 rounded-2xl bg-[#161224]/95 text-white border border-white/10">
              <div className="flex items-center gap-2.5 mb-1">
                <Mail className="h-4 w-4 text-violet-400" />
                <span className="font-semibold text-sm">{invitation.contact_name}</span>
              </div>
              <p className="text-xs text-gray-300">{invitation.contact_email}</p>
              <p className="text-xs text-violet-400 mt-1">{invitation.contact_subject}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Prénom
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Votre prénom"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Nom
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Votre nom"
                  className="h-11 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                readOnly
                value={formData.email}
                autoComplete="username"
                className="h-11 rounded-xl bg-slate-100 dark:bg-[#110d1b]/60 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Choisissez un mot de passe sécurisé"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                  required
                  className="h-11 pr-10 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#161224]/90 text-gray-300 text-xs space-y-1.5 border border-white/10">
                <p className="text-gray-400 font-medium mb-1">Le mot de passe doit contenir :</p>
                {[
                  "Au moins 8 caractères",
                  "Une majuscule et une minuscule",
                  "Un chiffre",
                  "Un caractère spécial (!@#$%^&*)",
                ].map((req) => (
                  <div key={req} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-violet-400" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Confirmer le mot de passe
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
                  autoComplete="new-password"
                  className="h-11 pr-10 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <ul className="space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-full shadow-lg shadow-violet-600/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-500 dark:text-gray-400 flex items-center justify-center gap-2 pt-2">
              <Shield className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span>Connexion sécurisée avec chiffrement SSL</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
