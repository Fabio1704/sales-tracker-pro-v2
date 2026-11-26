"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Clock,
  Shield,
  HeadphonesIcon,
  Mail,
  Phone,
  MapPin,
  Send,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PublicBackground, PublicHeader, PublicFooter } from "@/components/public-shell"

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message")
      }

      setIsSubmitted(true)
      setFormData({ name: "", email: "", subject: "", message: "" })
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PublicBackground />
      <PublicHeader actionLabel="Connexion" onActionClick={() => router.push("/")} />

      <section className="relative pt-32 pb-12 text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 border border-violet-500/30">
            <Shield className="h-3.5 w-3.5" />
            Réponse garantie sous 24h
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Contactez Notre{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Équipe d&apos;Experts
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
            Notre équipe est là pour vous aider. Posez-nous vos questions ou demandez votre accès à la plateforme.
          </p>
        </div>
      </section>

      <section className="relative py-10 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#161224]/95 text-white rounded-3xl p-7 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                  <HeadphonesIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Support Technique</h3>
                  <p className="text-xs text-gray-400">Assistance et résolution de problèmes</p>
                </div>
              </div>
              <div className="space-y-2.5 text-sm text-gray-300 pt-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-violet-400" />
                  <span>support@salestrackerpro.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-violet-400" />
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-violet-400" />
                  <span>Lun-Ven 9h-18h (CET)</span>
                </div>
              </div>
            </div>

            <div className="bg-[#161224]/95 text-white rounded-3xl p-7 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Équipe Commerciale</h3>
                  <p className="text-xs text-gray-400">Tarifs et démonstrations</p>
                </div>
              </div>
              <div className="space-y-2.5 text-sm text-gray-300 pt-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-violet-400" />
                  <span>sales@salestrackerpro.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-violet-400" />
                  <span>+33 1 23 45 67 90</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-violet-400" />
                  <span>Lun-Ven 9h-19h (CET)</span>
                </div>
              </div>
            </div>

            <div className="bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-7 border border-slate-200/80 dark:border-white/10 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#161224] text-violet-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">Adresse</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                    Sales Tracker Pro
                    <br />
                    123 Avenue des Champs-Élysées
                    <br />
                    75008 Paris, France
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl">
              <div className="mb-7">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:text-violet-300 mb-3">
                  Message Direct
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Envoyez-nous un message
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                  Remplissez le formulaire et nous vous répondrons rapidement
                </p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-violet-500/15 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Message envoyé !
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-gray-300 max-w-md mx-auto">
                    Merci pour votre message. Notre équipe vous répondra sous 24h.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-full px-6 py-2.5 shadow-lg transition-all"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                        Nom complet
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Votre nom"
                        required
                        className="h-11 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="votre@email.com"
                        required
                        className="h-11 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                      Sujet
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sujet de votre message"
                      required
                      className="h-11 rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-xs font-semibold text-slate-700 dark:text-gray-300">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre demande..."
                      required
                      rows={4}
                      className="rounded-xl bg-slate-50 dark:bg-[#110d1b] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-full shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.01]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Envoyer le message</span>
                        <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-7 border border-slate-200/80 dark:border-white/10 shadow-xl space-y-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Questions Fréquentes
              </h3>
              <div className="grid sm:grid-cols-3 gap-5 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Mot de passe oublié ?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Utilisez le lien &ldquo;Mot de passe oublié&rdquo; sur la page de connexion.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Annulation ?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Résiliation possible à tout moment depuis les paramètres.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Sécurité des données ?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Chiffrement SSL/TLS de niveau bancaire sur toutes vos données.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
