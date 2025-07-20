import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/simple-chart'
import { supabase } from '@/integrations/supabase/client'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

interface RealTimeChartProps {
  title: string
  description: string
  chartType: 'pie' | 'bar' | 'line'
  dataKey: string
  valueKey: string
  tableName: 'branches' | 'clients' | 'employees' | 'equipment' | 'profiles' | 'projects' | 'reports'
  groupBy?: string
  filter?: Record<string, any>
}

export function RealTimeChart({ 
  title, 
  description, 
  chartType, 
  dataKey, 
  valueKey, 
  tableName, 
  groupBy,
  filter = {}
}: RealTimeChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      let query = supabase.from(tableName).select('*')
      
      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data: rawData, error } = await query

      if (error) throw error

      // Group data if needed
      let processedData: any[] = []
      if (groupBy && rawData) {
        const grouped = rawData.reduce((acc: any, item: any) => {
          const key = item[groupBy] || 'Unknown'
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})

        processedData = Object.entries(grouped).map(([name, value]) => ({
          [dataKey]: name,
          [valueKey]: value
        }))
      } else {
        processedData = rawData || []
      }

      setData(processedData)
    } catch (error) {
      console.error(`Error fetching ${tableName} data:`, error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          console.log(`${tableName} change:`, payload)
          // Refresh data when changes occur
          fetchData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tableName, groupBy, JSON.stringify(filter)])

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      )
    }

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ [dataKey]: name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={valueKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey={valueKey} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKey} />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey={valueKey} stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]">
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 