"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { TrendingUp, Sun, Moon, ArrowRight, Menu, X } from "lucide-react"

interface PublicShellProps {
  children: React.ReactNode
  onLoginClick?: () => void
  showLandingNav?: boolean
  onScrollTo?: (id: string) => void
  actionLabel?: string
  onActionClick?: () => void
}

export function PublicBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/35 to-fuchsia-100/40 dark:from-slate-950 dark:via-purple-950/30 dark:to-fuchsia-950/35" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(168, 85, 247, 0.16) 0%, transparent 55%)",
        }}
      />
      <div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
          left: "10%",
          top: "20%",
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl animate-float-delayed"
        style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          right: "10%",
          top: "40%",
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl animate-float-slow"
        style={{
          background: "linear-gradient(135deg, #c084fc 0%, #e879f9 100%)",
          left: "20%",
          bottom: "20%",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          maskImage:
            "radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)",
        }}
      />
    </div>
  )
}

export function PublicHeader({
  onLoginClick,
  showLandingNav = false,
  onScrollTo,
  actionLabel,
  onActionClick,
}: Omit<PublicShellProps, "children">) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : false

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 bg-white/85 dark:bg-[#161224]/90 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 rounded-full px-4 py-2 shadow-lg hover:scale-[1.02] transition-transform"
          >
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
              Sales Tracker Pro
            </span>
          </button>

          {/* Center Floating Pill Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-[#161224]/90 dark:bg-[#161224]/95 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5 shadow-xl text-sm text-gray-300">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
            >
              Accueil
            </button>
            {showLandingNav && onScrollTo ? (
              <>
                <button
                  onClick={() => onScrollTo("features")}
                  className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => onScrollTo("testimonials")}
                  className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  Témoignages
                </button>
                <button
                  onClick={() => onScrollTo("pricing")}
                  className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  Tarifs
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/privacy")}
                  className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  Confidentialité
                </button>
                <button
                  onClick={() => router.push("/terms")}
                  className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  Conditions
                </button>
              </>
            )}
            <button
              onClick={() => router.push("/contact")}
              className="px-4 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Changer de thème"
              className="w-10 h-10 rounded-full bg-white/85 dark:bg-[#161224]/90 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-lg hover:scale-105 transition-transform text-slate-700 dark:text-amber-300"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {onLoginClick ? (
              <button
                onClick={onLoginClick}
                className="hidden sm:inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-full pl-4 pr-2 py-1.5 shadow-lg shadow-violet-600/25 hover:scale-105 transition-all"
              >
                <span>Se connecter</span>
                <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ) : (
              <button
                onClick={onActionClick || (() => router.push("/"))}
                className="hidden sm:inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-full pl-4 pr-2 py-1.5 shadow-lg shadow-violet-600/25 hover:scale-105 transition-all"
              >
                <span>{actionLabel || "Connexion"}</span>
                <span className="w-7 h-7 rounded-full bg-white text-violet-700 flex items-center justify-center">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-white/85 dark:bg-[#161224]/90 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-lg text-slate-800 dark:text-white"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-20 left-4 right-4 bg-[#161224] text-white rounded-3xl p-6 border border-white/10 shadow-2xl space-y-2">
            <button
              onClick={() => {
                router.push("/")
                setMobileMenuOpen(false)
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 font-medium"
            >
              Accueil
            </button>
            {showLandingNav && onScrollTo && (
              <>
                <button
                  onClick={() => {
                    onScrollTo("features")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 font-medium"
                >
                  Fonctionnalités
                </button>
                <button
                  onClick={() => {
                    onScrollTo("testimonials")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 font-medium"
                >
                  Témoignages
                </button>
                <button
                  onClick={() => {
                    onScrollTo("pricing")
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 font-medium"
                >
                  Tarifs
                </button>
              </>
            )}
            <button
              onClick={() => {
                router.push("/contact")
                setMobileMenuOpen(false)
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 font-medium"
            >
              Contact
            </button>
            <div className="pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  if (onLoginClick) onLoginClick()
                  else if (onActionClick) onActionClick()
                  else router.push("/")
                }}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold rounded-full py-3"
              >
                <span>{onLoginClick ? "Se connecter" : actionLabel || "Connexion"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function PublicFooter() {
  const router = useRouter()
  return (
    <footer className="relative bg-[#161224] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Sales Tracker Pro</h2>
              <p className="text-xs text-gray-400">© 2025 Tous droits réservés</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
            <button onClick={() => router.push("/privacy")} className="hover:text-violet-400 transition-colors">
              Confidentialité
            </button>
            <button onClick={() => router.push("/terms")} className="hover:text-violet-400 transition-colors">
              Conditions
            </button>
            <button onClick={() => router.push("/contact")} className="hover:text-violet-400 transition-colors">
              Contact
            </button>
            <button onClick={() => router.push("/")} className="hover:text-violet-400 transition-colors">
              Accueil
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
