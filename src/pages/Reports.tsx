import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'
import { AICopilot } from '@/components/AICopilot'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { FileText, Upload, Download } from 'lucide-react'
import type { Tables } from '@/integrations/supabase/types'

type Report = Tables<'reports'>
type Project = Tables<'projects'>

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Partial<Report>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
    fetchProjects()
  }, [])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          projects:project_id (name, test_type)
        `)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.project_id) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('reports')
          .update(formData)
          .eq('id', editingId)
        
        if (error) throw error
        toast({ title: "Report updated successfully" })
      } else {
        const { error } = await supabase
          .from('reports')
          .insert([formData])
        
        if (error) throw error
        toast({ title: "Report added successfully" })
      }
      
      setIsDialogOpen(false)
      setFormData({})
      setEditingId(null)
      fetchReports()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: Report) => {
    setFormData(item)
    setEditingId(item.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast({ title: "Report deleted successfully" })
      fetchReports()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      accessorKey: 'projects.name',
      header: 'Project',
    },
    {
      accessorKey: 'projects.test_type',
      header: 'Test Type',
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      cell: ({ getValue }: any) => {
        const summary = getValue()
        return summary ? (
          <div className="max-w-xs truncate" title={summary}>
            {summary}
          </div>
        ) : 'No summary'
      },
    },
    {
      accessorKey: 'file_url',
      header: 'File',
      cell: ({ getValue }: any) => {
        const url = getValue()
        return url ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        ) : 'No file'
      },
    },
    {
      accessorKey: 'uploaded_at',
      header: 'Uploaded',
      cell: ({ getValue }: any) => {
        const date = getValue()
        return date ? new Date(date).toLocaleDateString() : ''
      },
    },
  ]

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FileText className="mr-3" />
            Reports Management
          </h1>
          <p className="text-muted-foreground">Upload and manage test reports</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Report
        </Button>
      </div>

      <DataTable
        data={reports}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingId ? "Edit Report" : "Upload Report"}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4">
          <div>
            <Label htmlFor="project_id">Project</Label>
            <Select 
              value={formData.project_id || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.test_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file_url">File URL</Label>
            <Input
              id="file_url"
              value={formData.file_url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
              placeholder="https://example.com/report.pdf"
            />
          </div>

          <div>
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief summary of the report findings..."
              rows={3}
            />
          </div>
        </div>
      </FormDialog>

      <AICopilot />
    </div>
  )
}