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
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: React.ElementType
  href?: string
  onClick?: () => void
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
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

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

  // Dédupliquer par href
  const uniqueNav = filteredNav.filter(
    (item, index, self) => index === self.findIndex((t) => t.href === item.href)
  )

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300",
        "bg-[#1a1f2e] border-r border-white/5",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-sm tracking-wide uppercase">
            Sales Tracker
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
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
                  ? "bg-green-500/20 text-green-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-green-400 rounded-r-full" />
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
      <div className="border-t border-white/5 p-2 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all duration-200"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Moon className="h-4 w-4 flex-shrink-0" />
          )}
          {!collapsed && <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>}
        </button>

        {/* User info + logout */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.first_name?.[0] || user?.username?.[0] || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name || ""}`.trim()
                  : user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.is_staff ? "Admin" : "Utilisateur"}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            title="Déconnexion"
            className="text-gray-500 hover:text-red-400 transition-colors ml-auto"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
