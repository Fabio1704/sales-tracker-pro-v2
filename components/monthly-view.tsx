"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend
} from "recharts"
import { Calendar, TrendingUp, Euro, Target } from "lucide-react"
import { useEffect, useState } from "react"

interface Sale {
  id: string
  date: string
  amount_usd: number
  created_at: string
}

interface MonthlyViewProps {
  sales: Sale[]
  modelId: string
  theme?: string // Ajout de la prop theme
}

// Couleurs pour le mode clair
const LIGHT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

// Couleurs pour le mode sombre (plus claires et vibrantes)
const DARK_COLORS = [
  "hsl(210, 80%, 65%)", // Bleu vif plus clair
  "hsl(160, 75%, 60%)", // Vert émeraude plus clair
  "hsl(35, 90%, 65%)",  // Orange doré plus clair
  "hsl(280, 75%, 70%)", // Violet plus clair
  "hsl(340, 80%, 70%)", // Rose plus clair
]

export function MonthlyView({ sales, modelId, theme = "light" }: MonthlyViewProps) {
  const isDarkMode = theme === 'dark'
  const COLORS = isDarkMode ? DARK_COLORS : LIGHT_COLORS
  
  // Couleurs pour les graphiques en fonction du thème
  const chartColors = {
    primary: isDarkMode ? 'hsl(210, 80%, 65%)' : 'hsl(var(--primary))',
    accent: isDarkMode ? 'hsl(160, 75%, 60%)' : 'hsl(var(--accent))',
    chart3: isDarkMode ? 'hsl(35, 90%, 65%)' : 'hsl(var(--chart-3))',
    grid: isDarkMode ? 'hsl(215, 20%, 35%)' : 'hsl(var(--muted))',
    text: isDarkMode ? 'hsl(0, 0%, 90%)' : 'hsl(var(--muted-foreground))',
    tooltipBg: isDarkMode ? 'hsl(215, 25%, 20%)' : 'hsl(var(--card))',
    tooltipBorder: isDarkMode ? 'hsl(215, 25%, 35%)' : 'hsl(var(--border))',
    tooltipText: isDarkMode ? 'hsl(0, 0%, 90%)' : 'inherit',
  }

  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [allMonthsData, setAllMonthsData] = useState<any[]>([])

  useEffect(() => {
    const calculatedData = getMonthlyData()
    setMonthlyData(calculatedData)
    setAllMonthsData(getAllMonthsData(calculatedData))
  }, [sales])

  // Group sales by month
  const getMonthlyData = () => {
    const monthData: { [key: string]: { month: string; total: number; count: number; fees: number; net: number } } = {}

    sales.forEach((sale) => {
      try {
        const date = new Date(sale.date)
        if (isNaN(date.getTime())) {
          console.warn(`Date invalide: ${sale.date}`)
          return
        }

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthLabel = date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" })

        if (!monthData[monthKey]) {
          monthData[monthKey] = {
            month: monthLabel,
            total: 0,
            count: 0,
            fees: 0,
            net: 0,
          }
        }

        const amount = Number(sale.amount_usd) || 0
        monthData[monthKey].total += amount
        monthData[monthKey].count += 1
        monthData[monthKey].fees += amount * 0.2
        monthData[monthKey].net += amount * 0.8

      } catch (error) {
        console.error('Erreur lors du traitement de la vente:', sale, error)
      }
    })

    return Object.values(monthData).sort((a, b) => a.month.localeCompare(b.month))
  }

  // Get all 12 months data (including empty months)
  const getAllMonthsData = (monthlyData: any[]) => {
    const currentYear = new Date().getFullYear()
    const allMonths = []

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1)
      const monthLabel = date.toLocaleDateString("fr-FR", { month: "long" })

      const existingData = monthlyData.find((m) => m.month.includes(monthLabel))

      allMonths.push({
        month: monthLabel,
        total: existingData?.total || 0,
        count: existingData?.count || 0,
        fees: existingData?.fees || 0,
        net: existingData?.net || 0,
      })
    }

    return allMonths
  }

  const currentMonth = new Date().toLocaleDateString("fr-FR", { month: "long" })
  const currentMonthData = allMonthsData.find((m) => m.month === currentMonth)
  const currentMonthTotal = currentMonthData?.total || 0

  const bestMonth = monthlyData.reduce((best, current) => (current.total > best.total ? current : best), {
    month: "Aucun",
    total: 0,
  })

  const yearlyTotal = monthlyData.reduce((sum, month) => sum + month.total, 0)
  const monthlyAverage = monthlyData.length > 0 ? yearlyTotal / 12 : 0

  // Prepare pie chart data for top months
  const topMonthsData = monthlyData
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((month, index) => ({
      name: month.month,
      value: month.total,
      color: COLORS[index % COLORS.length],
    }))

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{currentMonthTotal.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">Ventes du mois en cours</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur Mois</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{bestMonth.total.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">{bestMonth.month}</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annuel</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{yearlyTotal.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">Cumul sur 12 mois</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Mensuelle</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{monthlyAverage.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">Moyenne sur 12 mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <Card className="animate-fade-in-up animate-delay-400">
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>Ventes par Mois</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-300" : ""}>
              Répartition des ventes sur les 12 mois de l'année
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allMonthsData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartColors.text, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: chartColors.text }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: "8px",
                    color: chartColors.tooltipText,
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} $`, "Total"]}
                />
                <Bar 
                  dataKey="total" 
                  fill={chartColors.primary} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Months Pie Chart */}
        <Card className="animate-fade-in-up animate-delay-500">
          <CardHeader>
            <CardTitle className={isDarkMode ? "text-white" : ""}>Top 5 Mois</CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-300" : ""}>
              Répartition des meilleurs mois de vente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topMonthsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topMonthsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topMonthsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={isDarkMode ? "hsl(215, 25%, 20%)" : "#fff"} 
                        strokeWidth={2} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: "8px",
                      color: chartColors.tooltipText,
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} $`, "Total"]}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      color: chartColors.text,
                      fontSize: '12px',
                      paddingTop: '20px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée mensuelle disponible</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Line */}
      <Card className="animate-fade-in-up animate-delay-600">
        <CardHeader>
          <CardTitle className={isDarkMode ? "text-white" : ""}>Évolution Mensuelle</CardTitle>
          <CardDescription className={isDarkMode ? "text-gray-300" : ""}>
            Tendance des ventes brutes, honoraires et net sur l'année
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={allMonthsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="month"
                tick={{ fill: chartColors.text, fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: chartColors.text }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: "8px",
                  color: chartColors.tooltipText,
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} $`,
                  name === "total" ? "Brut" : name === "fees" ? "Honoraires" : "Net",
                ]}
              />
              <Legend 
                wrapperStyle={{ 
                  color: chartColors.text,
                  fontSize: '12px',
                  paddingTop: '20px'
                }} 
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={chartColors.primary}
                strokeWidth={3}
                dot={{ fill: chartColors.primary, strokeWidth: 2, r: 5 }}
                name="Ventes brutes"
              />
              <Line
                type="monotone"
                dataKey="fees"
                stroke={chartColors.accent}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: chartColors.accent, strokeWidth: 2, r: 4 }}
                name="Honoraires (20%)"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke={chartColors.chart3}
                strokeWidth={2}
                dot={{ fill: chartColors.chart3, strokeWidth: 2, r: 4 }}
                name="Net (80%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}