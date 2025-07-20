import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, Wrench, Building2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface Stats {
  totalProjects: number
  totalClients: number
  totalEquipment: number
  activeBranches: number
  overdueCertifications: number
  completedTests: number
}

export function RealTimeStats() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalClients: 0,
    totalEquipment: 0,
    activeBranches: 0,
    overdueCertifications: 0,
    completedTests: 0
  })

  const loadStats = async () => {
    try {
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
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    loadStats()

    // Real-time subscriptions
    const subscriptions = [
      supabase
        .channel('projects_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
          console.log('Projects changed, updating stats...')
          loadStats()
        })
        .subscribe(),
      
      supabase
        .channel('clients_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
          console.log('Clients changed, updating stats...')
          loadStats()
        })
        .subscribe(),
      
      supabase
        .channel('equipment_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' }, () => {
          console.log('Equipment changed, updating stats...')
          loadStats()
        })
        .subscribe(),
      
      supabase
        .channel('branches_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'branches' }, () => {
          console.log('Branches changed, updating stats...')
          loadStats()
        })
        .subscribe()
    ]

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe())
    }
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completedTests} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">
            Across all branches
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipment</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEquipment}</div>
          <p className="text-xs text-muted-foreground">
            {stats.overdueCertifications > 0 ? (
              <span className="text-red-600">{stats.overdueCertifications} overdue</span>
            ) : (
              <span className="text-green-600">All up to date</span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeBranches}</div>
          <p className="text-xs text-muted-foreground">
            Testing facilities
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 