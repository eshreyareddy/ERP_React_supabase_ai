-- RETC ERP Database Schema

-- Create custom types
CREATE TYPE app_role AS ENUM ('admin', 'lab_manager', 'technician');
CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE equipment_status AS ENUM ('operational', 'maintenance', 'calibration_due', 'out_of_service');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'on_leave');

-- Branches table
CREATE TABLE public.branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role app_role DEFAULT 'technician',
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clients table
CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    branch_id UUID REFERENCES public.branches(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Employees table
CREATE TABLE public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role app_role DEFAULT 'technician',
    branch_id UUID REFERENCES public.branches(id),
    status employee_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Equipment table
CREATE TABLE public.equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    serial_number TEXT,
    last_calibration DATE,
    next_calibration DATE,
    status equipment_status DEFAULT 'operational',
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    test_type TEXT NOT NULL,
    status project_status DEFAULT 'pending',
    scheduled_date DATE,
    completed_date DATE,
    client_id UUID REFERENCES public.clients(id),
    technician_id UUID REFERENCES public.employees(id),
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id),
    file_url TEXT,
    summary TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can access data from their branch
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Branch policies - all authenticated users can read branches
CREATE POLICY "All users can view branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Client policies - users can access clients from their branch
CREATE POLICY "Users can view branch clients" ON public.clients FOR SELECT TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can manage branch clients" ON public.clients FOR ALL TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);

-- Employee policies
CREATE POLICY "Users can view branch employees" ON public.employees FOR SELECT TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Managers can manage employees" ON public.employees FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lab_manager'))
);

-- Equipment policies
CREATE POLICY "Users can view branch equipment" ON public.equipment FOR SELECT TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can manage branch equipment" ON public.equipment FOR ALL TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);

-- Project policies
CREATE POLICY "Users can view branch projects" ON public.projects FOR SELECT TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can manage branch projects" ON public.projects FOR ALL TO authenticated USING (
    branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
);

-- Report policies
CREATE POLICY "Users can view project reports" ON public.reports FOR SELECT TO authenticated USING (
    project_id IN (
        SELECT id FROM public.projects 
        WHERE branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
    )
);
CREATE POLICY "Users can manage project reports" ON public.reports FOR ALL TO authenticated USING (
    project_id IN (
        SELECT id FROM public.projects 
        WHERE branch_id IN (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
    )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.branches (name, location, address, email, phone) VALUES
('Fremont Lab', 'Fremont, CA', '123 Innovation Drive, Fremont, CA 94538', 'fremont@retc.com', '(510) 555-0101'),
('Tempe Lab', 'Tempe, AZ', '456 Research Blvd, Tempe, AZ 85281', 'tempe@retc.com', '(480) 555-0102');