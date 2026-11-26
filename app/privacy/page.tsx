"use client"

import { FileText, Shield, Eye, Lock, Users, Database } from "lucide-react"
import { useRouter } from "next/navigation"
import { PublicBackground, PublicHeader, PublicFooter } from "@/components/public-shell"

export default function PrivacyPage() {
  const router = useRouter()

  const sections = [
    {
      icon: Eye,
      title: "Introduction",
      subtitle: "Nos engagements envers votre vie privée",
      content: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
          <p>
            Chez Sales Tracker Pro, nous nous engageons à protéger votre vie privée et vos données personnelles.
            Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations.
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            <strong>Dernière mise à jour :</strong> 4 septembre 2025
          </p>
        </div>
      ),
    },
    {
      icon: Database,
      title: "Données que nous collectons",
      subtitle: "Types d'informations recueillies",
      content: (
        <div className="grid sm:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-gray-300">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Identification</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Mot de passe (chiffré)</li>
              <li>Photo de profil (optionnelle)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Données commerciales</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ventes et transactions</li>
              <li>Performance commerciale</li>
              <li>Statistiques d&apos;utilisation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Données techniques</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse IP et connexion</li>
              <li>Navigateur et OS</li>
              <li>Cookies et session</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: Users,
      title: "Comment nous utilisons vos données",
      subtitle: "Finalités du traitement",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-gray-300">
          <li>Fournir et améliorer nos services de suivi des ventes</li>
          <li>Personnaliser votre expérience utilisateur</li>
          <li>Générer des rapports et analyses de performance</li>
          <li>Assurer la sécurité et prévenir la fraude</li>
          <li>Respecter nos obligations légales et réglementaires</li>
        </ul>
      ),
    },
    {
      icon: Lock,
      title: "Protection de vos données",
      subtitle: "Sécurité et confidentialité",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 dark:text-gray-300">
          <li>Chiffrement SSL/TLS pour toutes les communications</li>
          <li>Chiffrement des mots de passe avec bcrypt</li>
          <li>Surveillance continue des accès et activités</li>
          <li>Sauvegardes régulières et sécurisées</li>
        </ul>
      ),
    },
    {
      icon: FileText,
      title: "Vos droits & Cookies",
      subtitle: "Conformité RGPD",
      content: (
        <div className="space-y-3 text-sm text-slate-600 dark:text-gray-300">
          <p>
            Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de portabilité et d&apos;opposition.
          </p>
          <p>
            Nous utilisons des cookies essentiels, de performance et de préférences, gérables depuis votre navigateur.
          </p>
        </div>
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
            Conforme RGPD
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Politique de{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Confidentialité
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300">
            Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles.
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
            <h2 className="text-lg font-bold mb-2">Nous contacter</h2>
            <p className="text-sm text-gray-300 mb-4">
              Pour toute question concernant cette politique ou pour exercer vos droits :
            </p>
            <div className="text-sm space-y-1 text-gray-200">
              <p><strong className="text-violet-400">E-mail :</strong> contact@salestrackerpro.com</p>
              <p><strong className="text-violet-400">DPO :</strong> contact@salestrackerpro.com</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
