"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { apiService } from "@/lib/api"
import { PublicBackground, PublicHeader } from "@/components/public-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await apiService.requestPasswordReset(email)
      setSent(true)
      toast.success("Email de réinitialisation envoyé")
    } catch (error: any) {
      setError(error.message || "Erreur lors de l'envoi de l'email")
      toast.error("Erreur lors de l'envoi")
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
          {sent ? (
            <div className="bg-white/85 dark:bg-[#132a35]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 bg-[#c8f560]/25 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-[#c8f560]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Email envoyé !
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-300">
                Un email de réinitialisation a été envoyé à :
              </p>
              <p className="font-semibold text-slate-900 dark:text-white">{email}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Vérifiez également votre dossier spam
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#c8f560] hover:bg-[#b8eb47] text-[#0d1f26] font-semibold rounded-full shadow-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </button>
            </div>
          ) : (
            <div className="bg-white/85 dark:bg-[#132a35]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#10222b] text-[#c8f560] flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#c8f560]/30 text-slate-900 dark:text-[#c8f560] mb-1">
                    Récupération
                  </span>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Mot de passe oublié
                  </h1>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-gray-300">
                Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé.
              </p>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl bg-slate-50 dark:bg-[#0d1f26] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-[#c8f560] hover:bg-[#b8eb47] disabled:opacity-60 text-[#0d1f26] font-semibold rounded-full shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0d1f26]/30 border-t-[#0d1f26] rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Envoyer le lien</span>
                      <span className="w-7 h-7 rounded-full bg-[#0d1f26] text-[#c8f560] flex items-center justify-center">
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
                  Retour à la connexion
                </button>
              </form>

              <div className="p-3.5 rounded-2xl bg-[#10222b]/90 text-gray-300 text-xs border border-white/10">
                <strong className="text-[#c8f560]">Note :</strong> Seuls les utilisateurs invités et enregistrés peuvent réinitialiser leur mot de passe.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
