"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { PublicBackground, PublicHeader } from "@/components/public-shell"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const uid = searchParams.get("uid")
  const token = searchParams.get("token")

  useEffect(() => {
    if (!uid || !token) {
      setError("Lien de réinitialisation invalide")
    }
  }, [uid, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uid || !token) {
      setError("Lien de réinitialisation invalide")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)
    setError("")

    try {
      await apiService.resetPassword(uid, token, password)
      setSuccess(true)
      toast.success("Mot de passe réinitialisé avec succès")
    } catch (error: any) {
      setError(error.message || "Erreur lors de la réinitialisation")
      toast.error("Erreur lors de la réinitialisation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PublicBackground />
      <PublicHeader actionLabel="Connexion" onActionClick={() => router.push("/")} />

      <div className="min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {success ? (
            <div className="bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 bg-violet-500/15 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Mot de passe réinitialisé !
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-300">
                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full h-12 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-full shadow-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Aller à la connexion
              </button>
            </div>
          ) : (
            <div className="bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#161224] text-violet-400 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-1">
                    Sécurité
                  </span>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Nouveau mot de passe
                  </h1>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                    Nouveau mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
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

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-full shadow-lg shadow-violet-600/25 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Réinitialisation...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Réinitialiser</span>
                      <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full h-11 rounded-full border border-slate-200 dark:border-white/15 text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              </form>

              <div className="p-3.5 rounded-2xl bg-[#161224]/90 text-gray-300 text-xs border border-white/10">
                <strong className="text-violet-400">Exigences :</strong> Minimum 8 caractères pour votre sécurité.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <PublicBackground />
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
