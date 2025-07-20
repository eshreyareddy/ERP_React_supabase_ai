import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard,
  Building2,
  Folder,
  Users,
  Wrench,
  UserCheck,
  FileText,
  Menu,
  LogOut,
  Leaf,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { AICopilot } from '@/components/AICopilot'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Branches', href: '/branches', icon: Building2 },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Equipment', href: '/equipment', icon: Wrench },
  { name: 'Employees', href: '/employees', icon: UserCheck },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Logo */}
        <div className="flex items-center p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">RETC</h1>
                <p className="text-xs text-sidebar-foreground/70">ERP System</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !sidebarOpen && "px-2",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
                {sidebarOpen && item.name}
              </Button>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className={cn("w-full justify-start", !sidebarOpen && "px-2")}
            onClick={handleSignOut}
          >
            <LogOut className={cn("h-4 w-4", sidebarOpen && "mr-2")} />
            {sidebarOpen && "Sign Out"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-16"
      )}>
        {/* Header */}
        <header className="bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground">
              Renewable Energy Test Center
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Copilot */}
      <AICopilot />
    </div>
  )
}