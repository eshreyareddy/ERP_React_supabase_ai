import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { DataTable } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'

interface Branch {
  id: string
  name: string
  location: string
  address: string
  email: string
  phone: string
  created_at: string
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBranches(data || [])
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
      const branchData = {
        name: formData.get('name') as string,
        location: formData.get('location') as string,
        address: formData.get('address') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
      }

      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(branchData)
          .eq('id', editingBranch.id)

        if (error) throw error
        toast({ title: "Branch updated successfully!" })
      } else {
        const { error } = await supabase
          .from('branches')
          .insert([branchData])

        if (error) throw error
        toast({ title: "Branch created successfully!" })
      }

      setShowForm(false)
      setEditingBranch(null)
      loadBranches()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Branch deleted successfully!" })
      loadBranches()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const columns = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Location', accessorKey: 'location' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingBranch(row.original)
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
    { name: 'name', label: 'Branch Name', type: 'text' as const, required: true },
    { name: 'location', label: 'Location', type: 'text' as const, required: true },
    { name: 'address', label: 'Address', type: 'textarea' as const },
    { name: 'email', label: 'Email', type: 'email' as const },
    { name: 'phone', label: 'Phone', type: 'tel' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage testing facility locations</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {/* Branch Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                {branch.name}
              </CardTitle>
              <CardDescription>{branch.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {branch.address && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {branch.address}
                </div>
              )}
              {branch.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {branch.email}
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {branch.phone}
                </div>
              )}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingBranch(branch)
                    setShowForm(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(branch.id)}
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
          <CardTitle>All Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={branches}
            loading={loading}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editingBranch ? 'Edit Branch' : 'Add Branch'}
        fields={formFields}
        onSubmit={handleSubmit}
        defaultValues={editingBranch || {}}
      />
    </div>
  )
}