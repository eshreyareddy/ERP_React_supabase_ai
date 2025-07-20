import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Calendar, User } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { DataTable } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'

interface Project {
  id: string
  name: string
  test_type: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date: string | null
  completed_date: string | null
  client_id: string
  technician_id: string | null
  branch_id: string
  created_at: string
  clients?: { name: string }
  employees?: { name: string }
  branches?: { name: string }
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsResult, clientsResult, employeesResult, branchesResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*, clients(name), employees(name), branches(name)')
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name'),
        supabase.from('employees').select('id, name'),
        supabase.from('branches').select('id, name')
      ])

      if (projectsResult.error) throw projectsResult.error
      if (clientsResult.error) throw clientsResult.error
      if (employeesResult.error) throw employeesResult.error
      if (branchesResult.error) throw branchesResult.error

      setProjects(projectsResult.data || [])
      setClients(clientsResult.data || [])
      setEmployees(employeesResult.data || [])
      setBranches(branchesResult.data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      const projectData = {
        name: formData.get('name') as string,
        test_type: formData.get('test_type') as string,
        status: formData.get('status') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        scheduled_date: formData.get('scheduled_date') as string || null,
        client_id: formData.get('client_id') as string,
        technician_id: formData.get('technician_id') as string || null,
        branch_id: formData.get('branch_id') as string,
      }

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id)

        if (error) throw error
        toast({ title: "Project updated successfully!" })
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData])

        if (error) throw error
        toast({ title: "Project created successfully!" })
      }

      setShowForm(false)
      setEditingProject(null)
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Project deleted successfully!" })
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in_progress': return 'secondary'
      case 'pending': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const columns = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Test Type', accessorKey: 'test_type' },
    {
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      )
    },
    { header: 'Client', cell: ({ row }: any) => row.original.clients?.name },
    { header: 'Branch', cell: ({ row }: any) => row.original.branches?.name },
    { header: 'Scheduled', accessorKey: 'scheduled_date' },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingProject(row.original)
              setShowForm(true)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const formFields = [
    { name: 'name', label: 'Project Name', type: 'text' as const, required: true },
    { name: 'test_type', label: 'Test Type', type: 'text' as const, required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    },
    { name: 'scheduled_date', label: 'Scheduled Date', type: 'date' as const },
    {
      name: 'client_id',
      label: 'Client',
      type: 'select' as const,
      required: true,
      options: clients.map(client => ({ value: client.id, label: client.name }))
    },
    {
      name: 'technician_id',
      label: 'Technician',
      type: 'select' as const,
      options: employees.map(emp => ({ value: emp.id, label: emp.name }))
    },
    {
      name: 'branch_id',
      label: 'Branch',
      type: 'select' as const,
      required: true,
      options: branches.map(branch => ({ value: branch.id, label: branch.name }))
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage environmental testing projects</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Project Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.slice(0, 6).map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{project.name}</span>
                <Badge variant={getStatusVariant(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
              <CardDescription>{project.test_type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                {project.clients?.name || 'No client assigned'}
              </div>
              {project.scheduled_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(project.scheduled_date).toLocaleDateString()}
                </div>
              )}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProject(project)
                    setShowForm(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table View */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={projects}
            loading={loading}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editingProject ? 'Edit Project' : 'Add Project'}
        fields={formFields}
        onSubmit={handleSubmit}
        defaultValues={editingProject || {}}
      />
    </div>
  )
}