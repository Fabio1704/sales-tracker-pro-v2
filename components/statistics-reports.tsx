"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Line,
} from "recharts"
import { Download, TrendingUp, Calendar, Euro, Target, Activity, Clock, Award, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface Sale {
  id: string
  date: string
  amount_usd: number
  created_at: string
}

interface Model {
  id: string
  nom: string
  prenom: string
  photo?: string
  initials: string
}

interface StatisticsReportsProps {
  sales: Sale[]
  model: Model
  theme: string
}

// Couleurs pour le mode clair
const LIGHT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

// Couleurs pour le mode sombre (plus claires et vibrantes avec meilleur contraste)
const DARK_COLORS = [
  "hsl(210, 80%, 65%)", // Bleu vif plus clair
  "hsl(160, 75%, 60%)", // Vert émeraude plus clair
  "hsl(35, 90%, 65%)",  // Orange doré plus clair
  "hsl(280, 75%, 70%)", // Violet plus clair
  "hsl(340, 80%, 70%)", // Rose plus clair
]

export function StatisticsReports({ sales, model, theme }: StatisticsReportsProps) {
  const isDarkMode = theme === 'dark'
  const COLORS = isDarkMode ? DARK_COLORS : LIGHT_COLORS
  
  // Couleurs pour les graphiques en fonction du thème - améliorées pour le contraste
  const chartColors = {
    primary: isDarkMode ? 'hsl(210, 80%, 65%)' : 'hsl(var(--primary))',
    accent: isDarkMode ? 'hsl(160, 75%, 60%)' : 'hsl(var(--accent))',
    grid: isDarkMode ? 'hsl(215, 20%, 35%)' : 'hsl(var(--muted))',
    text: isDarkMode ? 'hsl(0, 0%, 90%)' : 'hsl(var(--muted-foreground))',
    tooltipBg: isDarkMode ? 'hsl(215, 25%, 20%)' : 'hsl(var(--card))',
    tooltipBorder: isDarkMode ? 'hsl(215, 25%, 35%)' : 'hsl(var(--border))',
    tooltipText: isDarkMode ? 'hsl(0, 0%, 90%)' : 'inherit',
  }

  const [processedData, setProcessedData] = useState({
    totalGross: 0,
    totalFees: 0,
    totalNet: 0,
    averageSale: 0,
    sortedSales: [] as Sale[],
    firstSaleDate: new Date(),
    lastSaleDate: new Date(),
    daysBetween: 1,
    averagePerDay: 0,
    bestSale: { amount: 0, date: "" },
    worstSale: { amount: 0, date: "" },
    monthlyData: [] as any[],
    distributionData: [] as any[],
    growthData: [] as any[],
  })

  useEffect(() => {
    // Recalculer toutes les données quand les ventes changent
    const calculatedData = calculateStatistics()
    setProcessedData(calculatedData)
  }, [sales])

  // Fonction utilitaire pour formater les nombres en toute sécurité
  const safeToFixed = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined) return "0.00"
    const num = Number(value)
    return isNaN(num) ? "0.00" : num.toFixed(decimals)
  }

  // Fonction utilitaire pour obtenir une valeur numérique sécurisée
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined) return 0
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Advanced calculations
  const calculateStatistics = () => {
    // Calcul des totaux
    const totalGross = sales.reduce((sum, sale) => sum + safeNumber(sale.amount_usd), 0)
    const totalFees = totalGross * 0.2
    const totalNet = totalGross * 0.8
    const averageSale = sales.length > 0 ? totalGross / sales.length : 0

    // Date range analysis
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const firstSaleDate = sortedSales.length > 0 ? new Date(sortedSales[0].date) : new Date()
    const lastSaleDate = sortedSales.length > 0 ? new Date(sortedSales[sortedSales.length - 1].date) : new Date()
    const daysBetween = Math.ceil((lastSaleDate.getTime() - firstSaleDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
    const averagePerDay = totalGross / daysBetween

    // Best and worst sales
    const bestSale = sales.reduce((best, current) => {
      const currentAmount = safeNumber(current.amount_usd)
      return currentAmount > best.amount ? { amount: currentAmount, date: current.date } : best
    }, { amount: 0, date: "" })
    
    const worstSale = sales.reduce((worst, current) => {
      const currentAmount = safeNumber(current.amount_usd)
      return currentAmount < worst.amount ? { amount: currentAmount, date: current.date } : worst
    }, { amount: Number.POSITIVE_INFINITY, date: "" })

    // Monthly performance
    const monthlyPerformance = () => {
      const months: { [key: string]: { total: number; count: number; month: string } } = {}

      sales.forEach((sale) => {
        const date = new Date(sale.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthLabel = date.toLocaleDateString("fr-FR", { year: "numeric", month: "short" })

        if (!months[monthKey]) {
          months[monthKey] = { total: 0, count: 0, month: monthLabel }
        }

        months[monthKey].total += safeNumber(sale.amount_usd)
        months[monthKey].count += 1
      })

      return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
    }

    // Sales distribution by amount ranges
    const getSalesDistribution = () => {
      const ranges = [
        { name: "0-100$", min: 0, max: 100, count: 0, color: COLORS[0] },
        { name: "100-500$", min: 100, max: 500, count: 0, color: COLORS[1] },
        { name: "500-1000$", min: 500, max: 1000, count: 0, color: COLORS[2] },
        { name: "1000-2000$", min: 1000, max: 2000, count: 0, color: COLORS[3] },
        { name: "2000$+", min: 2000, max: Number.POSITIVE_INFINITY, count: 0, color: COLORS[4] },
      ]

      sales.forEach((sale) => {
        const amount = safeNumber(sale.amount_usd)
        const range = ranges.find((r) => amount >= r.min && amount < r.max)
        if (range) range.count++
      })

      return ranges.filter((range) => range.count > 0)
    }

    // Growth trend (last 6 months)
    const getGrowthTrend = () => {
      const last6Months = []
      const now = new Date()

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthLabel = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })

        const monthSales = sales.filter((sale) => {
          const saleDate = new Date(sale.date)
          return saleDate.getFullYear() === date.getFullYear() && saleDate.getMonth() === date.getMonth()
        })

        const total = monthSales.reduce((sum, sale) => sum + safeNumber(sale.amount_usd), 0)

        last6Months.push({
          month: monthLabel,
          total,
          count: monthSales.length,
          average: monthSales.length > 0 ? total / monthSales.length : 0,
        })
      }

      return last6Months
    }

    const monthlyData = monthlyPerformance()
    const distributionData = getSalesDistribution()
    const growthData = getGrowthTrend()

    return {
      totalGross,
      totalFees,
      totalNet,
      averageSale,
      sortedSales,
      firstSaleDate,
      lastSaleDate,
      daysBetween,
      averagePerDay,
      bestSale,
      worstSale: worstSale.amount === Number.POSITIVE_INFINITY ? { amount: 0, date: "" } : worstSale,
      monthlyData,
      distributionData,
      growthData
    }
  }

  // Generate PDF report
  const generatePDFReport = () => {
    const reportData = {
      model: `${model.prenom} ${model.nom}`,
      period: `${processedData.firstSaleDate.toLocaleDateString("fr-FR")} - ${processedData.lastSaleDate.toLocaleDateString("fr-FR")}`,
      totalSales: sales.length,
      totalGross: safeToFixed(processedData.totalGross),
      totalFees: safeToFixed(processedData.totalFees),
      totalNet: safeToFixed(processedData.totalNet),
      averageSale: safeToFixed(processedData.averageSale),
      averagePerDay: safeToFixed(processedData.averagePerDay),
      bestSale: safeToFixed(processedData.bestSale.amount),
      worstSale: processedData.worstSale.amount === Number.POSITIVE_INFINITY ? "0.00" : safeToFixed(processedData.worstSale.amount),
      generatedAt: new Date().toLocaleString("fr-FR"),
    }

    // Create a simple text report
    const reportContent = `
RAPPORT DE VENTES - ${reportData.model}
${"=".repeat(50)}

Période: ${reportData.period}
Généré le: ${reportData.generatedAt}

RÉSUMÉ FINANCIER
${"-".repeat(20)}
Nombre total de ventes: ${reportData.totalSales}
Ventes brutes: ${reportData.totalGross} $
Honoraires (20%): ${reportData.totalFees} $
Ventes nettes (80%): ${reportData.totalNet} $

MOYENNES
${"-".repeat(20)}
Vente moyenne: ${reportData.averageSale} $
Moyenne par jour: ${reportData.averagePerDay} $

EXTREMES
${"-".repeat(20)}
Meilleure vente: ${reportData.bestSale} $
Plus petite vente: ${reportData.worstSale} $

DONNÉES MENSUELLES
${"-".repeat(20)}
${processedData.monthlyData.map((month) => `${month.month}: ${safeToFixed(month.total)} $ (${month.count} ventes)`).join("\n")}
    `

    // Download as text file
    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport-ventes-${model.prenom}-${model.nom}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Statistiques & Rapports Avancés</CardTitle>
              <CardDescription>
                Analyse détaillée des performances de {model.prenom} {model.nom}
              </CardDescription>
            </div>
            <Button onClick={generatePDFReport} className="hover:scale-105 transition-all duration-300">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Période d'activité</p>
                <p className="font-medium">{processedData.daysBetween} jours</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Fréquence moyenne</p>
                <p className="font-medium">
                  {sales.length > 0 ? safeToFixed(processedData.daysBetween / sales.length, 1) : "0"} j/vente
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-chart-3" />
              <div>
                <p className="text-sm text-muted-foreground">Objectif mensuel</p>
                <Badge variant="secondary">À définir</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="animate-fade-in-up animate-delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vente Moyenne</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{safeToFixed(processedData.averageSale)} $</div>
            <p className="text-xs text-muted-foreground">Par transaction</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Quotidienne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{safeToFixed(processedData.averagePerDay)} $</div>
            <p className="text-xs text-muted-foreground">Par jour d'activité</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure Vente</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{safeToFixed(processedData.bestSale.amount)} $</div>
            <p className="text-xs text-muted-foreground">
              {processedData.bestSale.date ? new Date(processedData.bestSale.date).toLocaleDateString("fr-FR") : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plus Petite Vente</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">
              {safeToFixed(processedData.worstSale.amount)} $
            </div>
            <p className="text-xs text-muted-foreground">
              {processedData.worstSale.date ? new Date(processedData.worstSale.date).toLocaleDateString("fr-FR") : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Trend */}
        <Card className="animate-fade-in-up animate-delay-500">
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>Tendance de Croissance (6 mois)</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-300" : ""}>
              Évolution des ventes sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processedData.growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: chartColors.text }}
                  axisLine={{ stroke: chartColors.grid }}
                />
                <YAxis 
                  tick={{ fill: chartColors.text }}
                  axisLine={{ stroke: chartColors.grid }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: "8px",
                    color: chartColors.tooltipText,
                  }}
                  formatter={(value: number, name: string) => [
                    `${safeToFixed(value)} $`,
                    name === "total" ? "Total" : "Moyenne",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke={chartColors.accent}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Distribution */}
        <Card className="animate-fade-in-up animate-delay-600">
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>Répartition par Montant</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-300" : ""}>
              Distribution des ventes par tranches de montant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedData.distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedData.distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name} (${count})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {processedData.distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={isDarkMode ? "hsl(215, 25%, 20%)" : "#fff"} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: "8px",
                      color: chartColors.tooltipText,
                    }}
                    formatter={(value: number) => [`${value} ventes`, "Nombre"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée de distribution disponible</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card className="animate-fade-in-up animate-delay-700">
        <CardHeader>
          <CardTitle>Analyse Détaillée</CardTitle>
          <CardDescription>Insights et recommandations basés sur vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-3" />
                Points Forts
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    Vente moyenne de {safeToFixed(processedData.averageSale)} $ {safeNumber(processedData.averageSale) > 500 ? "(Excellent)" : "(Correct)"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    {sales.length} ventes enregistrées sur {processedData.daysBetween} jours
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-chart-3 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Meilleure performance: {safeToFixed(processedData.bestSale.amount)} $</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Recommandations
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    {safeNumber(processedData.averagePerDay) < 100
                      ? "Augmenter la fréquence des ventes quotidiennes"
                      : "Maintenir le rythme actuel"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>
                    {processedData.monthlyData.length < 3
                      ? "Collecter plus de données pour une analyse précise"
                      : "Analyser les tendances saisonnières"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                  <span>Définir des objectifs mensuels basés sur les performances actuelles</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">Résumé Exécutif</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sur une période de {processedData.daysBetween} jours, {model.prenom} {model.nom} a réalisé {sales.length} ventes pour un
              montant total de {safeToFixed(processedData.totalGross)} $. Avec une vente moyenne de {safeToFixed(processedData.averageSale)} $ et une
              performance quotidienne de {safeToFixed(processedData.averagePerDay)} $, les résultats montrent{" "}
              {safeNumber(processedData.averageSale) > 500 ? "une excellente" : "une bonne"} performance commerciale. Les honoraires s'élèvent à{" "}
              {safeToFixed(processedData.totalFees)} $ (20%) et le net à {safeToFixed(processedData.totalNet)} $ (80%).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}