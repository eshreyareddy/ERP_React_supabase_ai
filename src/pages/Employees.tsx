import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { FormDialog } from '@/components/FormDialog'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface Employee {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'admin' | 'lab_manager' | 'technician' | null
  status: 'active' | 'inactive' | 'on_leave' | null
  branch_id: string | null
  created_at: string
  updated_at: string
  branches?: {
    name: string
  }
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const { toast } = useToast()

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          branches (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
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
        .select('id, name')
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error: any) {
      console.error('Error fetching branches:', error)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchBranches()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    try {
      const employeeData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || null,
        role: (formData.get('role') as string || null) as 'admin' | 'lab_manager' | 'technician' | null,
        status: (formData.get('status') as string || null) as 'active' | 'inactive' | 'on_leave' | null,
        branch_id: formData.get('branch_id') as string || null,
      }

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id)

        if (error) throw error

        toast({
          title: "Success",
          description: "Employee updated successfully",
        })
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([employeeData])

        if (error) throw error

        toast({
          title: "Success",
          description: "Employee created successfully",
        })
      }

      setDialogOpen(false)
      setEditingEmployee(null)
      fetchEmployees()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      })
      fetchEmployees()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'lab_manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'technician': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const columns = [
    {
      header: 'Name',
      cell: ({ row }: { row: { original: Employee } }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      header: 'Email',
      cell: ({ row }: { row: { original: Employee } }) => (
        <div className="text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      header: 'Role',
      cell: ({ row }: { row: { original: Employee } }) => (
        <Badge className={getRoleColor(row.original.role)}>
          {row.original.role?.replace('_', ' ') || 'No Role'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }: { row: { original: Employee } }) => (
        <Badge className={getStatusColor(row.original.status)}>
          {row.original.status?.replace('_', ' ') || 'No Status'}
        </Badge>
      ),
    },
    {
      header: 'Branch',
      cell: ({ row }: { row: { original: Employee } }) => (
        <span>{row.original.branches?.name || 'No Branch'}</span>
      ),
    },
    {
      header: 'Phone',
      cell: ({ row }: { row: { original: Employee } }) => (
        <span>{row.original.phone || 'N/A'}</span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: { original: Employee } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text' as const,
      required: true,
      defaultValue: editingEmployee?.name || '',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      defaultValue: editingEmployee?.email || '',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text' as const,
      required: false,
      defaultValue: editingEmployee?.phone || '',
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: 'Select Role' },
        { value: 'admin', label: 'Admin' },
        { value: 'lab_manager', label: 'Lab Manager' },
        { value: 'technician', label: 'Technician' },
      ],
      defaultValue: editingEmployee?.role || '',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: 'Select Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'on_leave', label: 'On Leave' },
      ],
      defaultValue: editingEmployee?.status || '',
    },
    {
      name: 'branch_id',
      label: 'Branch',
      type: 'select' as const,
      required: false,
      options: [
        { value: '', label: 'Select Branch' },
        ...branches.map(branch => ({
          value: branch.id,
          label: branch.name,
        })),
      ],
      defaultValue: editingEmployee?.branch_id || '',
    },
  ]

  // Stats calculations
  const activeEmployees = employees.filter(emp => emp.status === 'active').length
  const totalEmployees = employees.length
  const adminCount = employees.filter(emp => emp.role === 'admin').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">
            Manage your lab staff and their assignments
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Across all branches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              Admin privileges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            A list of all employees in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={employees}
            columns={columns}
            loading={loading}
          />
        </CardContent>
      </Card>

      <FormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingEmployee(null)
          }
        }}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        description={editingEmployee ? 'Update employee information.' : 'Add a new employee to your organization.'}
        fields={formFields}
        onSubmit={handleSubmit}
        defaultValues={{
          name: editingEmployee?.name || '',
          email: editingEmployee?.email || '',
          phone: editingEmployee?.phone || '',
          role: editingEmployee?.role || '',
          status: editingEmployee?.status || '',
          branch_id: editingEmployee?.branch_id || '',
        }}
      />
    </div>
  )
}