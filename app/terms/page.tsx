"use client"

import { FileText, AlertTriangle, Users, CreditCard, Shield, Gavel } from "lucide-react"
import { useRouter } from "next/navigation"
import { PublicBackground, PublicHeader, PublicFooter } from "@/components/public-shell"

export default function TermsPage() {
  const router = useRouter()

  const sections = [
    {
      icon: Gavel,
      title: "Conditions Générales d'Utilisation",
      subtitle: "Nos engagements et vos droits",
      content: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
          <p>
            Bienvenue sur Sales Tracker Pro. En utilisant notre plateforme, vous acceptez d&apos;être lié par les présentes conditions d&apos;utilisation.
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            <strong>Dernière mise à jour :</strong> 4 septembre 2025
          </p>
        </div>
      ),
    },
    {
      icon: AlertTriangle,
      title: "Acceptation des Conditions",
      subtitle: "Vos engagements en utilisant notre service",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-gray-300">
          <li>Vous avez lu, compris et accepté ces conditions d&apos;utilisation</li>
          <li>Vous êtes âgé d&apos;au moins 18 ans ou avez l&apos;autorisation parentale</li>
          <li>Vous avez la capacité juridique de conclure un contrat contraignant</li>
          <li>Votre utilisation respectera toutes les lois applicables</li>
        </ul>
      ),
    },
    {
      icon: Users,
      title: "Description du Service & Comptes",
      subtitle: "Ce que nous offrons et vos responsabilités",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-gray-300">
          <li>Suivi en temps réel des performances commerciales et calculs automatisés</li>
          <li>Génération de rapports hebdomadaires et mensuels détaillés</li>
          <li>Gestion multi-utilisateurs avec différents niveaux d&apos;accès</li>
          <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
        </ul>
      ),
    },
    {
      icon: Shield,
      title: "Utilisation Acceptable",
      subtitle: "Règles d'usage de la plateforme",
      content: (
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-gray-300">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Autorisé</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Suivi légitime de vos ventes</li>
              <li>Génération de rapports professionnels</li>
              <li>Collaboration avec votre équipe</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Interdit</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Activités illégales ou frauduleuses</li>
              <li>Tentative d&apos;accès non autorisé</li>
              <li>Revente du service sans autorisation</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: CreditCard,
      title: "Paiements et Facturation",
      subtitle: "Modalités financières",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-gray-300">
          <li>Les frais d&apos;abonnement sont facturés à l&apos;avance</li>
          <li>Les prix peuvent être modifiés avec un préavis de 30 jours</li>
          <li>L&apos;essai gratuit de 14 jours ne nécessite pas de carte bancaire</li>
        </ul>
      ),
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PublicBackground />
      <PublicHeader actionLabel="Connexion" onActionClick={() => router.push("/")} />

      <section className="relative pt-32 pb-12 text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 border border-violet-500/30">
            <Shield className="h-3.5 w-3.5" />
            Usage responsable
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Conditions{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              d&apos;Utilisation
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300">
            Les règles et conditions qui régissent l&apos;utilisation de Sales Tracker Pro.
          </p>
        </div>
      </section>

      <section className="relative py-8 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map(({ icon: Icon, title, subtitle, content }) => (
            <div
              key={title}
              className="bg-white/85 dark:bg-[#1c162e]/90 backdrop-blur-xl rounded-3xl p-7 sm:p-8 border border-slate-200/80 dark:border-white/10 shadow-xl"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-[#161224] text-violet-400 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{subtitle}</p>
                </div>
              </div>
              {content}
            </div>
          ))}

          <div className="bg-[#161224] text-white rounded-3xl p-7 sm:p-8 border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-bold">Contact Juridique</h2>
            </div>
            <div className="text-sm space-y-1 text-gray-200">
              <p><strong className="text-violet-400">E-mail :</strong> contact@salestrackerpro.com</p>
              <p><strong className="text-violet-400">Téléphone :</strong> +33 1 23 45 67 89</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
