import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/AuthPage";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Branches from "./pages/Branches";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import Equipment from "./pages/Equipment";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from './pages/ResetPassword';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password/*" element={<ResetPasswordPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
            </Route>
            <Route path="/branches" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Branches />} />
            </Route>
            <Route path="/projects" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Projects />} />
            </Route>
            <Route path="/clients" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Clients />} />
            </Route>
            <Route path="/employees" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Employees />} />
            </Route>
            <Route path="/equipment" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Equipment />} />
            </Route>
            <Route path="/reports" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Reports />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
