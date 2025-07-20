import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/simple-chart'
import { supabase } from '@/integrations/supabase/client'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export function RealTimeProjectChart() {
  const [projectData, setProjectData] = useState<any[]>([])

  const loadProjectData = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')

      if (error) throw error

      // Group projects by status
      const projectStats = projects?.reduce((acc: any, project: any) => {
        acc[project.status] = (acc[project.status] || 0) + 1
        return acc
      }, {})

      const chartData = Object.entries(projectStats || {}).map(([name, value]) => ({
        name,
        value
      }))

      setProjectData(chartData)
    } catch (error) {
      console.error('Error loading project data:', error)
    }
  }

  useEffect(() => {
    loadProjectData()

    // Real-time subscription for projects
    const subscription = supabase
      .channel('projects_chart_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        console.log('Project data changed, updating chart...')
        loadProjectData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status Distribution</CardTitle>
        <CardDescription>Real-time status of all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 