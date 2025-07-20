import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Mail, Phone, Building2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { DataTable } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  branch_id: string
  notes: string | null
  created_at: string
  branches?: { name: string }
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientsResult, branchesResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*, branches(name)')
          .order('created_at', { ascending: false }),
        supabase.from('branches').select('id, name')
      ])

      if (clientsResult.error) throw clientsResult.error
      if (branchesResult.error) throw branchesResult.error

      setClients(clientsResult.data || [])
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
      const clientData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        branch_id: formData.get('branch_id') as string,
        notes: formData.get('notes') as string || null,
      }

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id)

        if (error) throw error
        toast({ title: "Client updated successfully!" })
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData])

        if (error) throw error
        toast({ title: "Client created successfully!" })
      }

      setShowForm(false)
      setEditingClient(null)
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
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Client deleted successfully!" })
      loadData()
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
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Branch', cell: ({ row }: any) => row.original.branches?.name },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingClient(row.original)
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
    { name: 'name', label: 'Client Name', type: 'text' as const, required: true },
    { name: 'email', label: 'Email', type: 'email' as const },
    { name: 'phone', label: 'Phone', type: 'tel' as const },
    {
      name: 'branch_id',
      label: 'Branch',
      type: 'select' as const,
      required: true,
      options: branches.map(branch => ({ value: branch.id, label: branch.name }))
    },
    { name: 'notes', label: 'Notes', type: 'textarea' as const },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage client relationships</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Client Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.slice(0, 6).map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle>{client.name}</CardTitle>
              <CardDescription>{client.branches?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.email && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {client.phone}
                </div>
              )}
              {client.notes && (
                <p className="text-sm text-muted-foreground mt-2">{client.notes}</p>
              )}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingClient(client)
                    setShowForm(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(client.id)}
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
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={clients}
            loading={loading}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        fields={formFields}
        onSubmit={handleSubmit}
        defaultValues={editingClient || {}}
      />
    </div>
  )
}