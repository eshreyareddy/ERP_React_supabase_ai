import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'
import { AICopilot } from '@/components/AICopilot'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Wrench, Calendar, AlertTriangle } from 'lucide-react'
import type { Tables } from '@/integrations/supabase/types'

type Equipment = Tables<'equipment'>

export default function Equipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [branches, setBranches] = useState<Tables<'branches'>[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Partial<Equipment>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEquipment()
    fetchBranches()
  }, [])

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          branches:branch_id (name, location)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEquipment(data || [])
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

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name')

      if (error) throw error
      setBranches(data || [])
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
    
    if (!formData.name || !formData.equipment_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('equipment')
          .update(formData)
          .eq('id', editingId)
        
        if (error) throw error
        toast({ title: "Equipment updated successfully" })
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert([formData as any])
        
        if (error) throw error
        toast({ title: "Equipment added successfully" })
      }
      
      setIsDialogOpen(false)
      setFormData({})
      setEditingId(null)
      fetchEquipment()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (item: Equipment) => {
    setFormData(item)
    setEditingId(item.id)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast({ title: "Equipment deleted successfully" })
      fetchEquipment()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'default'
      case 'maintenance': return 'secondary'
      case 'calibration_due': return 'destructive'
      case 'out_of_service': return 'outline'
      default: return 'default'
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Equipment Name',
    },
    {
      accessorKey: 'equipment_type',
      header: 'Type',
    },
    {
      accessorKey: 'serial_number',
      header: 'Serial Number',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }: any) => (
        <Badge variant={getStatusColor(getValue())}>
          {getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: 'last_calibration',
      header: 'Last Calibration',
      cell: ({ getValue }: any) => {
        const date = getValue()
        return date ? new Date(date).toLocaleDateString() : 'Not calibrated'
      },
    },
    {
      accessorKey: 'next_calibration',
      header: 'Next Calibration',
      cell: ({ getValue }: any) => {
        const date = getValue()
        return date ? new Date(date).toLocaleDateString() : 'Not scheduled'
      },
    },
    {
      accessorKey: 'branches.location',
      header: 'Location',
    },
  ]

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Wrench className="mr-3" />
            Equipment Management
          </h1>
          <p className="text-muted-foreground">Track and manage laboratory equipment</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          Add Equipment
        </Button>
      </div>

      <DataTable
        data={equipment}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingId ? "Edit Equipment" : "Add Equipment"}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Equipment Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="equipment_type">Equipment Type</Label>
            <Input
              id="equipment_type"
              value={formData.equipment_type || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment_type: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input
              id="serial_number"
              value={formData.serial_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="calibration_due">Calibration Due</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="branch_id">Branch</Label>
            <Select 
              value={formData.branch_id || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, branch_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} - {branch.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="last_calibration">Last Calibration</Label>
            <Input
              id="last_calibration"
              type="date"
              value={formData.last_calibration || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, last_calibration: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="next_calibration">Next Calibration</Label>
            <Input
              id="next_calibration"
              type="date"
              value={formData.next_calibration || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, next_calibration: e.target.value }))}
            />
          </div>
        </div>
      </FormDialog>

      <AICopilot />
    </div>
  )
}