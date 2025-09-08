"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"
import { Calendar, TrendingUp, Euro } from "lucide-react"
import { useEffect, useState } from "react"

interface Sale {
  id: string
  date: string
  amount_usd: number
  created_at: string
}

interface WeeklyViewProps {
  sales: Sale[]
  modelId: string
}

export function WeeklyView({ sales, modelId }: WeeklyViewProps) {
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  useEffect(() => {
    // Recalculer les données quand les ventes changent
    const calculatedData = getWeekData()
    setWeeklyData(calculatedData)
  }, [sales])

  // Group sales by week
  const getWeekData = () => {
    const weekData: { [key: string]: { week: string; total: number; count: number; fees: number; net: number } } = {}

    sales.forEach((sale) => {
      try {
        const date = new Date(sale.date)
        if (isNaN(date.getTime())) {
          console.warn(`Date invalide: ${sale.date}`)
          return
        }

        const weekStart = new Date(date)
        // Début de la semaine (lundi)
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)
        
        const weekKey = weekStart.toISOString().split("T")[0]
        const weekLabel = `Semaine du ${weekStart.toLocaleDateString("fr-FR", { 
          day: "2-digit", 
          month: "2-digit",
          year: 'numeric'
        })}`

        if (!weekData[weekKey]) {
          weekData[weekKey] = {
            week: weekLabel,
            total: 0,
            count: 0,
            fees: 0,
            net: 0,
          }
        }

        const amount = Number(sale.amount_usd) || 0
        weekData[weekKey].total += amount
        weekData[weekKey].count += 1
        weekData[weekKey].fees += amount * 0.2
        weekData[weekKey].net += amount * 0.8

      } catch (error) {
        console.error('Erreur lors du traitement de la vente:', sale, error)
      }
    })

    const result = Object.values(weekData)
    return result.sort((a, b) => {
      // Trier par date de semaine
      const dateA = new Date(a.week.replace('Semaine du ', '').split('/').reverse().join('-'))
      const dateB = new Date(b.week.replace('Semaine du ', '').split('/').reverse().join('-'))
      return dateA.getTime() - dateB.getTime()
    })
  }

  // Calcul des totaux avec vérification
  const currentWeekTotal = weeklyData.length > 0 ? 
    (weeklyData[weeklyData.length - 1]?.total || 0) : 0
  
  const previousWeekTotal = weeklyData.length > 1 ? 
    (weeklyData[weeklyData.length - 2]?.total || 0) : 0
  
  const weeklyGrowth = previousWeekTotal > 0 ? 
    ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100 : 
    currentWeekTotal > 0 ? 100 : 0

  // Calcul de la moyenne hebdomadaire
  const weeklyAverage = weeklyData.length > 0 ? 
    (weeklyData.reduce((sum, week) => sum + (week.total || 0), 0) / weeklyData.length) : 0

  // Formater les données pour les graphiques
  const chartData = weeklyData.map(week => ({
    ...week,
    total: Number(week.total.toFixed(2)),
    fees: Number(week.fees.toFixed(2)),
    net: Number(week.net.toFixed(2))
  }))

  return (
    <div className="space-y-6">
      {/* Weekly Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currentWeekTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
            </div>
            <p className="text-xs text-muted-foreground">Ventes de la semaine courante</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Croissance Hebdomadaire</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${weeklyGrowth >= 0 ? "text-chart-3" : "text-destructive"}`}>
              {weeklyGrowth >= 0 ? "+" : ""}
              {weeklyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Par rapport à la semaine précédente</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animate-delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Hebdomadaire</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {weeklyAverage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
            </div>
            <p className="text-xs text-muted-foreground">Moyenne sur toutes les semaines</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Bar Chart */}
      <Card className="animate-fade-in-up animate-delay-300">
        <CardHeader>
          <CardTitle>Ventes par Semaine</CardTitle>
          <CardDescription>Évolution des ventes hebdomadaires</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs fill-muted-foreground" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "white" }}
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`, "Total"]}
                />
                <Bar 
                  dataKey="total" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                  name="Ventes brutes"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée hebdomadaire disponible</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Trend Line */}
      <Card className="animate-fade-in-up animate-delay-400">
        <CardHeader>
          <CardTitle>Tendance Hebdomadaire</CardTitle>
          <CardDescription>Évolution des ventes brutes, honoraires et net</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-xs fill-muted-foreground" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "white" }}
                  formatter={(value: number, name: string) => {
                    const label = name === "total " ? "Brut" : name === "fees" ? "Honoraires" : "Net"
                    return [`${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`, label]
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                  name="Ventes brutes"
                />
                <Line
                  type="monotone"
                  dataKey="fees"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
                  name="Honoraires (20%)"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                  name="Net (80%)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune tendance disponible</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}