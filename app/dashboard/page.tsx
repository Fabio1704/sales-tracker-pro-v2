"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  User,
  Loader2,
  RefreshCw,
  X,
  Pencil,
  Filter,
  TrendingUp,
  Users,
  BarChart3,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, ModelProfile } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const [models, setModels] = useState<ModelProfile[]>([])
  const [search, setSearch] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ first_name: "", last_name: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const { user, logout, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) { router.push("/"); return }
    if (user) loadModels()
  }, [user, authLoading, router])

  const loadModels = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      const token = localStorage.getItem("authToken")
      if (!token) throw new Error("Token non trouvé")
      localStorage.removeItem("models_cache")
      const data = await apiService.getModels()
      setModels(data)
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("Token")) {
        logout(); setTimeout(() => router.push("/"), 2000)
      } else {
        setError(err.message || "Erreur chargement")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleDeleteModel = async (modelId: string) => {
    try {
      setIsDeleting(modelId)
      await apiService.deleteModel(modelId)
      setModels(models.filter((m) => m.id !== modelId))
      setSuccess("Modèle supprimé avec succès")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Erreur suppression")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCreateModel = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError("Le prénom et le nom sont obligatoires"); return
    }
    setIsCreating(true); setError(null)
    try {
      const newModel = await apiService.createModel(formData)
      setFormData({ first_name: "", last_name: "" })
      setShowCreateForm(false)
      await loadModels()
      setSuccess(`${newModel.first_name} ${newModel.last_name} créé !`)
    } catch (err: any) {
      setError(err.message || "Erreur création")
    } finally {
      setIsCreating(false)
    }
  }

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filtered.map((m) => m.id)))
    }
  }

  const filtered = models
    .filter((m) => {
      const q = search.toLowerCase()
      return (
        m.first_name?.toLowerCase().includes(q) ||
        m.last_name?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    )

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    )
  }

  if (!user) return null

  const totalModels = models.length
  const activeModels = models.length // tous actifs

  return (
    <div className="min-h-screen bg-[#111827] flex">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main */}
      <div className="flex-1 ml-56 transition-all duration-300 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#111827] border-b border-white/5 flex items-center gap-4 px-6 py-3">
          <div className="flex-1 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un modèle..."
              className="pl-9 bg-[#1a1f2e] border-white/10 text-gray-200 placeholder:text-gray-500 focus-visible:ring-green-500/30 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadModels}
              disabled={isRefreshing}
              className="h-9 w-9 text-gray-400 hover:text-gray-200 hover:bg-white/5"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Page title + actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Bonjour, {user?.first_name || user?.username} 👋
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Action dropdown placeholder */}
              <Button
                variant="outline"
                className="h-9 text-sm border-white/10 bg-[#1a1f2e] text-gray-300 hover:bg-white/5 hover:text-white gap-2"
              >
                Action <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="h-9 text-sm bg-green-500 hover:bg-green-600 text-white gap-2 shadow-lg shadow-green-500/20"
              >
                <Plus className="h-4 w-4" />
                Ajouter un modèle
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1a1f2e] rounded-xl border border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total modèles</p>
                <p className="text-2xl font-bold text-white">{totalModels}</p>
              </div>
            </div>
            <div className="bg-[#1a1f2e] rounded-xl border border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Actifs</p>
                <p className="text-2xl font-bold text-white">{activeModels}</p>
              </div>
            </div>
            <div className="bg-[#1a1f2e] rounded-xl border border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sélectionnés</p>
                <p className="text-2xl font-bold text-white">{selectedRows.size}</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0" /> {error}
              <button onClick={() => setError(null)} className="ml-auto hover:text-red-300"><X className="h-3 w-3" /></button>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
              {success}
              <button onClick={() => setSuccess(null)} className="ml-auto hover:text-green-300"><X className="h-3 w-3" /></button>
            </div>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold">Nouveau modèle</h2>
                <button onClick={() => { setShowCreateForm(false); setFormData({ first_name: "", last_name: "" }) }} className="text-gray-500 hover:text-gray-300">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Prénom *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Prénom"
                    className="bg-[#111827] border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-500/30 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Nom *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Nom"
                    className="bg-[#111827] border-white/10 text-gray-200 placeholder:text-gray-600 focus-visible:ring-green-500/30 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCreateModel}
                  disabled={isCreating}
                  className="bg-green-500 hover:bg-green-600 text-white h-9 text-sm shadow-lg shadow-green-500/20"
                >
                  {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</> : "Créer le modèle"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowCreateForm(false); setFormData({ first_name: "", last_name: "" }) }}
                  className="border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200 h-9 text-sm"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-[#1a1f2e] rounded-xl border border-white/5 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white flex-1">
                Modèles ({filtered.length})
              </h2>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="rounded border-white/20 bg-white/5 accent-green-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Propriétaire</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((model) => {
                      const initials = `${model.first_name?.[0] || ""}${model.last_name?.[0] || ""}`.toUpperCase()
                      const isSelected = selectedRows.has(model.id)
                      const ownerName = model.owner && typeof model.owner === "object"
                        ? `${model.owner.first_name || ""} ${model.owner.last_name || ""}`.trim() || model.owner.username
                        : null
                      return (
                        <tr
                          key={model.id}
                          className={`group transition-colors cursor-pointer ${isSelected ? "bg-green-500/5" : "hover:bg-white/[0.02]"}`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3.5" onClick={(e) => { e.stopPropagation(); toggleRow(model.id) }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(model.id)}
                              className="rounded border-white/20 bg-white/5 accent-green-500 cursor-pointer"
                            />
                          </td>

                          {/* ID */}
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-500 whitespace-nowrap" onClick={() => router.push(`/model/${model.id}`)}>
                            #{String(model.id).slice(0, 8)}
                          </td>

                          {/* Avatar */}
                          <td className="px-4 py-3.5" onClick={() => router.push(`/model/${model.id}`)}>
                            {model.profile_photo_url ? (
                              <img
                                src={model.profile_photo_url}
                                alt={initials}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white/10">
                                <span className="text-white text-xs font-bold">{initials}</span>
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3.5" onClick={() => router.push(`/model/${model.id}`)}>
                            <span className="font-medium text-white">{model.first_name} {model.last_name}</span>
                          </td>

                          {/* Owner */}
                          <td className="px-4 py-3.5 text-gray-400" onClick={() => router.push(`/model/${model.id}`)}>
                            {ownerName && ownerName !== `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                              ? <span className="text-xs">{ownerName}</span>
                              : <span className="text-xs text-gray-600">Moi</span>
                            }
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5" onClick={() => router.push(`/model/${model.id}`)}>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              Actif
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/model/${model.id}`) }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                title="Voir"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Supprimer"
                                  >
                                    {isDeleting === model.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <X className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#1a1f2e] border-white/10 text-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer {model.first_name} {model.last_name} ?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                      Cette action est irréversible. Toutes les données de vente seront perdues.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteModel(model.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="h-7 w-7 text-gray-600" />
                </div>
                <h3 className="text-white font-semibold mb-1">
                  {search ? "Aucun résultat" : "Aucun modèle créé"}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {search ? `Aucun modèle ne correspond à "${search}"` : "Commencez par créer votre premier modèle"}
                </p>
                {!search && (
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-green-500 hover:bg-green-600 text-white gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Créer un modèle
                  </Button>
                )}
              </div>
            )}

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span>{selectedRows.size > 0 ? `${selectedRows.size} sélectionné(s)` : `${filtered.length} entrée(s)`}</span>
                <span>Cliquez sur une ligne pour ouvrir le profil</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
