"use client"

import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  TrendingUp,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: React.ElementType
  href?: string
  badge?: number
  adminOnly?: boolean
  superuserOnly?: boolean
}

interface AppSidebarProps {
  unreadMessages?: number
}

export function AppSidebar({ unreadMessages = 0 }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      label: "Utilisateurs",
      icon: Users,
      href: "/admin",
      adminOnly: true,
    },
    {
      label: "Messages",
      icon: MessageCircle,
      href: "/admin/contact-messages",
      badge: unreadMessages,
      superuserOnly: true,
    },
    {
      label: "Administration",
      icon: Shield,
      href: "/admin",
      adminOnly: true,
    },
  ]

  const isActive = (href?: string) => href && pathname === href

  const filteredNav = navItems.filter((item) => {
    if (item.superuserOnly && !user?.is_superuser) return false
    if (item.adminOnly && !user?.is_staff && user?.username !== "fabio") return false
    return true
  })

  const uniqueNav = filteredNav.filter(
    (item, index, self) => index === self.findIndex((t) => t.href === item.href)
  )

  const isDark = mounted ? resolvedTheme === "dark" : true

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex-shrink-0 z-40 flex flex-col transition-all duration-300",
        "bg-white dark:bg-[#1a1f2e] border-r border-slate-200 dark:border-white/5",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-slate-900 dark:text-white font-bold text-sm tracking-wide uppercase truncate">
            Sales Tracker
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex-shrink-0",
            collapsed ? "mx-auto mt-0" : "ml-auto"
          )}
          title={collapsed ? "Agrandir" : "Réduire"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {uniqueNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <button
              key={item.href || item.label}
              onClick={() => item.href && router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                active
                  ? "bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-500 dark:bg-green-400 rounded-r-full" />
              )}
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
              {collapsed && item.badge != null && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-200 dark:border-white/5 p-2 space-y-1">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200 transition-all duration-200"
        >
          {isDark ? (
            <Sun className="h-4 w-4 flex-shrink-0 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 flex-shrink-0 text-slate-600" />
          )}
          {!collapsed && <span>{isDark ? "Mode clair" : "Mode sombre"}</span>}
        </button>

        {/* User info */}
        <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg", collapsed && "justify-center px-0")}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.first_name?.[0] || user?.username?.[0] || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-900 dark:text-white font-medium truncate">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name || ""}`.trim()
                  : user?.username}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-500 truncate">
                {user?.is_staff ? "Admin" : "Utilisateur"}
              </p>
            </div>
          )}
        </div>

        {/* Logout button below profile */}
        <button
          onClick={logout}
          title="Déconnexion"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-500/10 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
