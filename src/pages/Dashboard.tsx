import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/simple-chart'
import { Activity, Users, Wrench, Building2, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { RealTimeStats } from '@/components/RealTimeStats'
import { RealTimeProjectChart } from '@/components/RealTimeProjectChart'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalClients: 0,
    totalEquipment: 0,
    activeBranches: 0,
    overdueCertifications: 0,
    completedTests: 0
  })

  const [projectData, setProjectData] = useState([])
  const [equipmentData, setEquipmentData] = useState([])
  const [branchData, setBranchData] = useState([])

  useEffect(() => {
    loadDashboardData()

    // Set up real-time subscriptions for all tables
    const subscriptions = [
      supabase
        .channel('projects_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          console.log('Projects data changed, refreshing...')
          loadDashboardData()
        })
        .subscribe(),
      
      supabase
        .channel('clients_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
          console.log('Clients data changed, refreshing...')
          loadDashboardData()
        })
        .subscribe(),
      
      supabase
        .channel('equipment_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => {
          console.log('Equipment data changed, refreshing...')
          loadDashboardData()
        })
        .subscribe(),
      
      supabase
        .channel('branches_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, () => {
          console.log('Branches data changed, refreshing...')
          loadDashboardData()
        })
        .subscribe()
    ]

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe())
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load basic stats
      const [projects, clients, equipment, branches] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('equipment').select('*'),
        supabase.from('branches').select('*')
      ])

      setStats({
        totalProjects: projects.data?.length || 0,
        totalClients: clients.data?.length || 0,
        totalEquipment: equipment.data?.length || 0,
        activeBranches: branches.data?.length || 0,
        overdueCertifications: equipment.data?.filter(e => 
          e.next_calibration && new Date(e.next_calibration) < new Date()
        ).length || 0,
        completedTests: projects.data?.filter(p => p.status === 'completed').length || 0
      })

      // Project status data for pie chart
      const projectStats = projects.data?.reduce((acc: any, project: any) => {
        acc[project.status] = (acc[project.status] || 0) + 1
        return acc
      }, {})

      setProjectData(Object.entries(projectStats || {}).map(([name, value]) => ({ name, value })))

      // Equipment status data
      const equipmentStats = equipment.data?.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      setEquipmentData(Object.entries(equipmentStats || {}).map(([name, value]) => ({ name, value })))

      // Branch data
      const branchStats = await Promise.all(
        branches.data?.map(async (branch: any) => {
          const branchProjects = await supabase
            .from('projects')
            .select('*')
            .eq('branch_id', branch.id)
          
          return {
            name: branch.name,
            projects: branchProjects.data?.length || 0
          }
        }) || []
      )

      setBranchData(branchStats)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your RETC operations</p>
      </div>

      {/* Real-Time Stats Cards */}
      <RealTimeStats />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <RealTimeProjectChart />

        <Card>
          <CardHeader>
            <CardTitle>Equipment Status</CardTitle>
            <CardDescription>Current status of all equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltipContent />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Projects by Branch</CardTitle>
            <CardDescription>Number of projects at each testing facility</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltipContent />
                  <Bar dataKey="projects" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">All systems operational</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Database connection healthy</span>
          </div>
          {stats.overdueCertifications > 0 && (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">{stats.overdueCertifications} equipment items need calibration</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}