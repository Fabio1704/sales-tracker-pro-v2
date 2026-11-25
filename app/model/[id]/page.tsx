"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Calendar,
  Euro,
  TrendingUp,
  Calculator,
  BarChart3,
  Trash2,
  CalendarDays,
  PieChart,
  FileText,
  Loader2,
  X,
  RefreshCw,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { apiService, ModelProfile, DailySale, Stats } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { WeeklyView } from "@/components/weekly-view"
import { MonthlyView } from "@/components/monthly-view"
import { StatisticsReports } from "@/components/statistics-reports"

export default function ModelPage() {
  const params = useParams()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { user, logout, isLoading: authLoading } = useAuth()
  const [model, setModel] = useState<ModelProfile | null>(null)
  const [sales, setSales] = useState<DailySale[]>([])
  const [stats, setStats] = useState<Stats>({
    gross_usd: 0,
    fees_usd: 0,
    net_usd: 0,
    days_with_sales: 0,
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [saleData, setSaleData] = useState({ date: "", amount: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }
    if (user) {
      loadData()
    }
  }, [user, authLoading, router, params.id])

  const loadData = async () => {
    try {
      setIsRefreshing(true)
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/")
        return
      }

      const modelData = await apiService.getModel(params.id as string)
      const salesData = await apiService.getSales(params.id as string)

      let statsData: Stats
      try {
        statsData = await apiService.getStats(params.id as string)
      } catch {
        statsData = { gross_usd: 0, fees_usd: 0, net_usd: 0, days_with_sales: 0 }
      }

      setModel({
        ...modelData,
        initials: `${modelData.first_name[0]}${modelData.last_name[0]}`.toUpperCase(),
      })
      setSales(salesData)
      setStats(statsData)
    } catch (error: any) {
      if (
        error.message?.includes("authentification") ||
        error.message?.includes("401") ||
        error.message?.includes("Token")
      ) {
        logout()
        router.push("/")
      } else {
        setError(error.message || "Erreur lors du chargement des données")
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleAddSale = async () => {
    if (saleData.date && saleData.amount && model) {
      try {
        const newSale = await apiService.createSale({
          model_profile: model.id,
          date: saleData.date,
          amount_usd: Number.parseFloat(saleData.amount),
        })

        const updatedSales = [...sales, newSale].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setSales(updatedSales)

        const updatedStats = await apiService.getStats(model.id)
        setStats(updatedStats)

        setSaleData({ date: "", amount: "" })
        setShowAddForm(false)
      } catch (error: any) {
        setError(error.message || "Erreur lors de l'ajout de la vente")
      }
    }
  }

  const handleDeleteSale = async (saleId: string) => {
    try {
      await apiService.deleteSale(saleId)
      const updatedSales = sales.filter((sale) => sale.id !== saleId)
      setSales(updatedSales)

      if (model) {
        const updatedStats = await apiService.getStats(model.id)
        setStats(updatedStats)
      }
    } catch (error: any) {
      setError(error.message || "Erreur lors de la suppression de la vente")
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#111827] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500 dark:text-green-400" />
      </div>
    )
  }

  if (!user) return null

  if (!model) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#111827] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Modèle non trouvé</h2>
          <Button
            onClick={() => router.back()}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const modelForReports = {
    id: model.id,
    nom: model.last_name,
    prenom: model.first_name,
    photo: model.profile_photo_url,
    initials:
      model.initials ||
      `${model.first_name[0]}${model.last_name[0]}`.toUpperCase(),
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111827] flex">
      <AppSidebar />

      <div className="flex-1 ml-56 transition-all duration-300 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-white/5 flex items-center gap-4 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="h-9 text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <div className="flex items-center gap-3 ml-2">
            <Avatar className="h-8 w-8 ring-2 ring-slate-200 dark:ring-white/10">
              <AvatarImage
                src={model.profile_photo_url}
                alt={`${model.first_name} ${model.last_name}`}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                {model.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                {model.first_name} {model.last_name}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                Profil et statistiques
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadData}
              disabled={isRefreshing}
              className="h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Page Title + Add Sale CTA */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {model.first_name} {model.last_name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">
                Suivez les performances et gérez les ventes en temps réel
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 text-sm bg-green-500 hover:bg-green-600 text-white gap-2 shadow-lg shadow-green-500/20"
            >
              <Plus className="h-4 w-4" />
              Ajouter une vente
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <X className="h-4 w-4 flex-shrink-0" /> {error}
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:opacity-75"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Ventes Brutes</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {Number(stats?.gross_usd || 0).toFixed(2)} $
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Honoraires (20%)</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {Number(stats?.fees_usd || 0).toFixed(2)} $
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Ventes Nettes (80%)</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {Number(stats?.net_usd || 0).toFixed(2)} $
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-500">Jours avec Ventes</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats?.days_with_sales || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Add Sale Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-slate-900 dark:text-white font-semibold">Nouvelle vente</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 dark:text-gray-400">Date</Label>
                  <Input
                    type="date"
                    value={saleData.date}
                    onChange={(e) =>
                      setSaleData({ ...saleData, date: e.target.value })
                    }
                    className="bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-900 dark:text-gray-200 focus-visible:ring-green-500/30 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 dark:text-gray-400">Montant ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={saleData.amount}
                    onChange={(e) =>
                      setSaleData({ ...saleData, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-900 dark:text-gray-200 placeholder:text-slate-400 dark:placeholder:text-gray-600 focus-visible:ring-green-500/30 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleAddSale}
                  className="bg-green-500 hover:bg-green-600 text-white h-9 text-sm shadow-lg shadow-green-500/20"
                >
                  Ajouter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-slate-200 dark:border-white/10 bg-transparent text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-gray-200 h-9 text-sm"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-white/5 rounded-xl p-1 h-auto flex-wrap">
              {[
                { value: "daily", label: "Saisie Quotidienne", icon: Plus },
                { value: "weekly", label: "Vue Hebdomadaire", icon: CalendarDays },
                { value: "monthly", label: "Résumé Mensuel", icon: PieChart },
                { value: "reports", label: "Statistiques & Rapports", icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-gray-500 transition-all data-[state=active]:bg-green-500/15 data-[state=active]:text-green-600 dark:data-[state=active]:bg-green-500/20 dark:data-[state=active]:text-green-400"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Daily Tab */}
            <TabsContent value="daily">
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Liste des Ventes ({sales.length})
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="h-8 text-xs bg-green-500 hover:bg-green-600 text-white gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>

                {sales.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/5">
                          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
                            Ajouté le
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
                            Brut
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
                            Honoraires (20%)
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
                            Net (80%)
                          </th>
                          <th className="w-16 px-4 py-3 text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {sales.map((sale) => {
                          const amount = Number(sale.amount_usd || 0)
                          return (
                            <tr
                              key={sale.id}
                              className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                                {new Date(sale.date).toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 dark:text-gray-500 text-xs">
                                {new Date(sale.created_at).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                                {amount.toFixed(2)} $
                              </td>
                              <td className="px-4 py-3.5 text-orange-600 dark:text-orange-400 text-xs">
                                {(amount * 0.2).toFixed(2)} $
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-green-600 dark:text-green-400">
                                {(amount * 0.8).toFixed(2)} $
                              </td>
                              <td className="px-4 py-3.5">
                                <button
                                  onClick={() => handleDeleteSale(sale.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-slate-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-1">
                      Aucune vente enregistrée
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-500 mb-5">
                      Commencez par ajouter votre première vente
                    </p>
                    <Button
                      onClick={() => setShowAddForm(true)}
                      className="bg-green-500 hover:bg-green-600 text-white gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter ma première vente
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="weekly">
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                <WeeklyView sales={sales} modelId={params.id as string} />
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                <MonthlyView
                  sales={sales}
                  modelId={params.id as string}
                  theme={resolvedTheme}
                />
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-white/5 p-6">
                <StatisticsReports
                  sales={sales}
                  model={modelForReports}
                  theme={resolvedTheme || "dark"}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
