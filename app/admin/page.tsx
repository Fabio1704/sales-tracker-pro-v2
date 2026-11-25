"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Users, Shield, Activity, Trash2, Eye, BarChart3,
  UserPlus, TrendingUp, Euro, Loader2, MessageCircle,
  Search, Filter, X, RefreshCw, ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, ModelProfile, DailySale, User as ApiUser } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { useWebSocket } from "@/hooks/useWebSocket"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User extends ApiUser {
  isActive?: boolean
  lastLogin?: Date
  last_login?: string
}

interface ModelWithStats extends ModelProfile {
  userId: string
  totalSales: number
  totalAmount: number
  lastActivity?: Date
  initials: string
}

interface ActivityLog {
  id: string
  userId: string
  modelId: string
  action: string
  details: string
  timestamp: Date
  userName?: string
  modelName?: string
}

export default function AdminPage() {
  const { user: currentUser, isLoading } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [models, setModels] = useState<ModelWithStats[]>([])
  const [allSales, setAllSales] = useState<DailySale[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "", nom: "", prenom: "", password: "", role: "user" as "admin" | "user"
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [userSearch, setUserSearch] = useState("")
  const [modelSearch, setModelSearch] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const { isConnected: wsConnected } = useWebSocket((deletedUserData) => {
    loadAdminData()
    setActivities(prev => [{
      id: `activity-${Date.now()}`, userId: "system", modelId: "system",
      action: "Utilisateur supprimé (sync)",
      details: "Synchronisation: Un utilisateur a été supprimé par un autre admin",
      timestamp: new Date()
    }, ...prev])
  })

  useEffect(() => {
    if (isLoading) return
    if (currentUser && currentUser.username === "fabio") { loadAdminData(); return }
    if (currentUser && !currentUser.is_staff) { router.push("/dashboard"); return }
    if (!currentUser) { router.push("/"); return }
    loadAdminData()
  }, [currentUser, router, isLoading])

  useEffect(() => {
    if (!isLoading && currentUser) {
      localStorage.removeItem("cached_users")
      loadAdminData()
      loadUnreadMessages()
    }
  }, [isLoading, currentUser])

  useEffect(() => {
    if (!isLoading && currentUser) {
      const interval = setInterval(() => { loadAdminData(); loadUnreadMessages() }, 30000)
      const handleFocus = () => { loadAdminData(); loadUnreadMessages() }
      window.addEventListener("focus", handleFocus)
      return () => { window.removeEventListener("focus", handleFocus); clearInterval(interval) }
    }
  }, [isLoading, currentUser])

  const loadUnreadMessages = async () => {
    try {
      if (!currentUser?.is_superuser) { setUnreadMessages(0); return }
      const token = localStorage.getItem("authToken")
      const response = await fetch(
        "https://sales-tracker-backend-j0c0.onrender.com/api/accounts/contact-messages/list/",
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )
      if (response.ok) {
        const messages = await response.json()
        setUnreadMessages(messages.filter((m: any) => !m.read).length)
      } else { setUnreadMessages(0) }
    } catch { setUnreadMessages(0) }
  }

  const loadAdminData = async () => {
    try {
      setDataLoading(true); setError(null)
      localStorage.removeItem("adminUsers"); localStorage.removeItem("cached_users")
      sessionStorage.clear()
      setUsers([]); setModels([]); setAllSales([]); setActivities([])

      const [usersResponse, modelsResponse] = await Promise.all([
        apiService.getUsers(), apiService.getModels()
      ])
      await loadUnreadMessages()

      const usersWithStatus: User[] = usersResponse.map((user: any) => ({
        ...user, isActive: user.is_active !== false,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined,
        nom: user.last_name || user.username,
        prenom: user.first_name || "Utilisateur",
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username
      }))

      let modelsData: ModelProfile[] = []
      try { modelsData = await apiService.getAllModelsAdmin() } catch {
        try { modelsData = await apiService.getModels() } catch { modelsData = [] }
      }

      const modelsWithStats: ModelWithStats[] = await Promise.all(
        modelsData.map(async (model) => {
          try {
            const sales = await apiService.getAllSalesAdmin(model.id)
            const salesForModel = sales.filter(s => s.model_profile === model.id)
            const totalSales = salesForModel.length
            const totalAmount = salesForModel.reduce((sum, s) => sum + (Number(s.amount_usd) || 0), 0)
            let lastActivity: Date | undefined
            if (salesForModel.length > 0) {
              const sorted = salesForModel.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              lastActivity = new Date(sorted[0].date)
            }
            return {
              ...model, userId: typeof model.owner === "object" ? model.owner.id : model.owner,
              totalSales, totalAmount, lastActivity,
              initials: `${model.first_name?.[0] || ""}${model.last_name?.[0] || ""}`.toUpperCase(),
              nom: model.last_name || "", prenom: model.first_name || ""
            } as ModelWithStats
          } catch {
            return {
              ...model, userId: typeof model.owner === "object" ? model.owner.id : model.owner,
              totalSales: 0, totalAmount: 0,
              initials: `${model.first_name?.[0] || ""}${model.last_name?.[0] || ""}`.toUpperCase(),
              nom: model.last_name || "", prenom: model.first_name || ""
            } as ModelWithStats
          }
        })
      )

      const allSalesData: DailySale[] = []
      for (const model of modelsData) {
        try {
          const sales = await apiService.getAllSalesAdmin(model.id)
          allSalesData.push(...sales.filter(s => s.model_profile === model.id))
        } catch {
          try {
            const fb = await apiService.getSales(model.id)
            allSalesData.push(...fb.filter(s => s.model_profile === model.id))
          } catch {}
        }
      }

      const recentActivities: ActivityLog[] = allSalesData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20)
        .map((sale, i) => {
          const model = modelsWithStats.find(m => m.id === sale.model_profile)
          const ownerId = typeof model?.owner === "object" ? (model.owner as any)?.id : model?.owner
          const user = usersWithStatus.find(u => u.id === ownerId)
          return {
            id: `activity-${i}`,
            userId: typeof model?.owner === "object" ? model.owner.id : (model?.owner || sale.model_profile),
            modelId: sale.model_profile,
            action: "Vente enregistrée",
            details: `Montant: ${sale.amount_usd} $ - ${new Date(sale.date).toLocaleDateString("fr-FR")}`,
            timestamp: new Date(sale.created_at),
            userName: user ? `${user.first_name} ${user.last_name}`.trim() || user.username : "Inconnu",
            modelName: model ? `${model.first_name} ${model.last_name}` : "Inconnu"
          }
        })

      setUsers(usersWithStatus); setModels(modelsWithStats); setAllSales(allSalesData)
      setActivities(recentActivities); setRefreshKey(p => p + 1)
    } catch (err: any) {
      setError(err.message || "Erreur chargement données admin")
    } finally {
      setDataLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (newUser.email && newUser.nom && newUser.prenom) {
      try {
        const password = newUser.password || Math.random().toString(36).slice(-8)
        const userData = await apiService.createUser({
          email: newUser.email,
          username: newUser.email.split("@")[0],
          first_name: newUser.prenom,
          last_name: newUser.nom,
          password,
          is_staff: newUser.role === "admin",
          is_active: true
        })
        setUsers(prev => [...prev, {
          ...userData, isActive: userData.is_active, lastLogin: new Date(),
          nom: userData.last_name, prenom: userData.first_name,
          name: `${userData.first_name} ${userData.last_name}`
        }])
        setNewUser({ email: "", nom: "", prenom: "", password: "", role: "user" })
        setShowCreateUser(false)
        alert(`Utilisateur créé !\nEmail: ${newUser.email}\nMot de passe: ${password}`)
        await loadAdminData()
      } catch (err: any) {
        setError(err.message || "Erreur création utilisateur")
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const deletedUser = users.find(u => u.id === userId)
      await apiService.deleteUser(userId)
      localStorage.removeItem("adminUsers"); localStorage.removeItem("cached_users")
      sessionStorage.clear()
      setUsers(prev => prev.filter(u => u.id !== userId))
      setModels([]); setAllSales([])
      setActivities(prev => [{
        id: `activity-${Date.now()}`, userId: currentUser?.id || "admin", modelId: "system",
        action: "Utilisateur supprimé", details: `Utilisateur: ${deletedUser?.email}`, timestamp: new Date()
      }, ...prev])
      await new Promise(r => setTimeout(r, 500))
      await loadAdminData()
      setRefreshKey(p => p + 1)
    } catch { setError("Erreur lors de la suppression de l'utilisateur") }
  }

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive, is_active: !u.is_active } : u))
  }

  // Stats
  const totalUsers = users.filter(u => !u.is_staff).length
  const activeUsers = users.filter(u => !u.is_staff && u.is_active).length
  const totalModels = models.length
  const totalRevenue = models.reduce((sum, m) => sum + (Number(m.totalAmount) || 0), 0)
  const totalSales = models.reduce((sum, m) => sum + (m.totalSales || 0), 0)

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return !q || u.email?.toLowerCase().includes(q) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
  })

  const filteredModels = models.filter(m => {
    const q = modelSearch.toLowerCase()
    return !q || m.first_name?.toLowerCase().includes(q) || m.last_name?.toLowerCase().includes(q)
  })

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!currentUser?.is_staff && currentUser?.username !== "fabio") return null

  return (
    <div className="min-h-screen bg-[#111827] flex">
      <AppSidebar unreadMessages={unreadMessages} />

      <div className="flex-1 ml-56 transition-all duration-300 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#111827] border-b border-white/5 flex items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
            <span className="text-xs text-gray-500">{wsConnected ? "Sync actif" : "Polling"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {currentUser?.is_superuser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/contact-messages")}
                className="relative h-9 text-gray-400 hover:text-gray-200 hover:bg-white/5 gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Messages
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={loadAdminData}
              disabled={dataLoading}
              className="h-9 w-9 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              {dataLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Administration</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gérez la plateforme Sales Tracker Pro</p>
            </div>
            <Button
              onClick={() => setShowCreateUser(true)}
              className="h-9 text-sm bg-purple-500 hover:bg-purple-600 text-white gap-2 shadow-lg shadow-purple-500/20"
            >
              <UserPlus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0" /> {error}
              <button onClick={() => setError(null)} className="ml-auto hover:text-red-300"><X className="h-3 w-3" /></button>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Utilisateurs", value: users.length, sub: `${activeUsers} actifs`, icon: Users, bgClass: "bg-blue-500/15", textClass: "text-blue-400" },
              { label: "Modèles", value: totalModels, sub: "de suivi", icon: BarChart3, bgClass: "bg-purple-500/15", textClass: "text-purple-400" },
              { label: "Ventes", value: totalSales, sub: "transactions", icon: TrendingUp, bgClass: "bg-green-500/15", textClass: "text-green-400" },
              { label: "Revenus", value: `${totalRevenue.toFixed(0)} $`, sub: "total plateforme", icon: Euro, bgClass: "bg-yellow-500/15", textClass: "text-yellow-400" },
              { label: "Activité", value: activities.length, sub: "actions récentes", icon: Activity, bgClass: "bg-red-500/15", textClass: "text-red-400" },
            ].map(({ label, value, sub, icon: Icon, bgClass, textClass }) => (
              <div key={label} className="bg-[#1a1f2e] rounded-xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">{label}</span>
                  <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${textClass}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Create User Form */}
          {showCreateUser && (
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold">Nouvel utilisateur</h2>
                <button onClick={() => setShowCreateUser(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "email", label: "Email", type: "email", placeholder: "user@email.com", key: "email" as const },
                  { id: "role", label: "Rôle", type: "select", placeholder: "", key: "role" as const },
                  { id: "prenom", label: "Prénom", type: "text", placeholder: "Prénom", key: "prenom" as const },
                  { id: "nom", label: "Nom", type: "text", placeholder: "Nom", key: "nom" as const },
                ].map(({ id, label, type, placeholder, key }) =>
                  type === "select" ? (
                    <div key={id} className="space-y-1.5">
                      <Label className="text-xs text-gray-400">{label}</Label>
                      <select
                        value={newUser.role}
                        onChange={e => setNewUser({ ...newUser, role: e.target.value as "admin" | "user" })}
                        className="w-full h-9 px-3 rounded-lg bg-[#111827] border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                      >
                        <option value="user">Utilisateur</option>
                        {currentUser?.is_superuser && <option value="admin">Administrateur</option>}
                      </select>
                    </div>
                  ) : (
                    <div key={id} className="space-y-1.5">
                      <Label className="text-xs text-gray-400">{label}</Label>
                      <Input
                        type={type}
                        value={newUser[key] as string}
                        onChange={e => setNewUser({ ...newUser, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="bg-[#111827] border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-purple-500/30 h-9 text-sm"
                      />
                    </div>
                  )
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-gray-400">Mot de passe (vide = auto-généré)</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-[#111827] border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-purple-500/30 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleCreateUser} className="bg-purple-500 hover:bg-purple-600 text-white h-9 text-sm shadow-lg shadow-purple-500/20">
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setShowCreateUser(false)}
                  className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200 h-9 text-sm">
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-[#1a1f2e] border border-white/5 rounded-xl p-1 h-auto">
              {[
                { value: "users", label: "Utilisateurs", icon: Users },
                { value: "models", label: "Modèles", icon: BarChart3 },
                { value: "activity", label: "Activité", icon: Activity },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 transition-all data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="bg-[#1a1f2e] rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    <Input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-8 h-8 text-xs bg-[#111827] border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-purple-500/30"
                    />
                  </div>
                  <span className="text-xs text-gray-500 ml-auto">{filteredUsers.length} utilisateur(s)</span>
                  <button className="text-gray-500 hover:text-gray-300"><Filter className="h-4 w-4" /></button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                        <th className="w-28 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {user.first_name?.[0] || user.username?.[0] || "?"}
                                </span>
                              </div>
                              <span className="font-medium text-white text-sm">
                                {user.first_name} {user.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-400 text-sm">{user.email}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_staff
                                ? "bg-purple-500/15 text-purple-400"
                                : "bg-white/5 text-gray-400"
                            }`}>
                              {user.is_staff ? "Admin" : "Utilisateur"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? "bg-green-500/15 text-green-400"
                                : "bg-red-500/15 text-red-400"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-green-400" : "bg-red-400"}`} />
                              {user.is_active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {user.lastLogin ? user.lastLogin.toLocaleDateString("fr-FR") : "Jamais"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!user.is_staff && (
                                <>
                                  <button
                                    onClick={() => toggleUserStatus(user.id)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                    title="Changer statut"
                                  >
                                    <Activity className="h-3.5 w-3.5" />
                                  </button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#1a1f2e] border-white/10 text-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer {user.first_name} {user.last_name} ?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-400">
                                          Action irréversible. Tous ses modèles seront également supprimés.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-500 hover:bg-red-600 text-white">
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="py-16 text-center">
                      <Users className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Aucun utilisateur trouvé</p>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-600">
                  {filteredUsers.length} utilisateur(s) • {activeUsers} actif(s)
                </div>
              </div>
            </TabsContent>

            {/* Models Tab */}
            <TabsContent value="models">
              <div className="bg-[#1a1f2e] rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    <Input
                      value={modelSearch}
                      onChange={e => setModelSearch(e.target.value)}
                      placeholder="Rechercher un modèle..."
                      className="pl-8 h-8 text-xs bg-[#111827] border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-purple-500/30"
                    />
                  </div>
                  <span className="text-xs text-gray-500 ml-auto">{filteredModels.length} modèle(s)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Modèle</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Propriétaire</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Ventes</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Revenus</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière activité</th>
                        <th className="w-20 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredModels
                        .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
                        .map(model => {
                          const ownerId = typeof model.owner === "object" ? (model.owner as any).id : model.owner
                          const owner = users.find(u => u.id === ownerId)
                          return (
                            <tr key={model.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => router.push(`/model/${model.id}`)}>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  {model.profile_photo_url ? (
                                    <img src={model.profile_photo_url} alt={model.initials} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white/10">
                                      <span className="text-white text-xs font-bold">{model.initials}</span>
                                    </div>
                                  )}
                                  <span className="font-medium text-white">{model.first_name} {model.last_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-gray-400 text-xs">
                                {owner ? `${owner.first_name} ${owner.last_name}`.trim() || owner.username : "—"}
                              </td>
                              <td className="px-4 py-3.5 text-gray-300">{model.totalSales || 0}</td>
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-green-400">{(Number(model.totalAmount) || 0).toFixed(0)} $</span>
                              </td>
                              <td className="px-4 py-3.5 text-gray-500 text-xs">
                                {model.lastActivity ? model.lastActivity.toLocaleDateString("fr-FR") : "Aucune activité"}
                              </td>
                              <td className="px-4 py-3.5">
                                <button
                                  onClick={e => { e.stopPropagation(); router.push(`/model/${model.id}`) }}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                  {filteredModels.length === 0 && (
                    <div className="py-16 text-center">
                      <BarChart3 className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Aucun modèle trouvé</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <div className="bg-[#1a1f2e] rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-white">Journal d'activité</h3>
                  <span className="text-xs text-gray-500 ml-auto">{activities.length} actions récentes</span>
                </div>
                <div className="divide-y divide-white/5">
                  {activities.length > 0 ? activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Activity className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{activity.action}</p>
                          <p className="text-xs text-gray-600 flex-shrink-0">{activity.timestamp.toLocaleString("fr-FR")}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{activity.userName}</span>
                          <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{activity.modelName}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-16 text-center">
                      <Activity className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Aucune activité enregistrée</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
