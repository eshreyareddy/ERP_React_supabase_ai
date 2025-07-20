import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CopilotRequest {
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the OpenRouter API key from environment
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    console.log('OpenRouter API Key check:', openrouterApiKey ? 'Found' : 'Not found');
    
    if (!openrouterApiKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      throw new Error('OPENROUTER_API_KEY is not configured in Supabase secrets');
    }

    // Get the authorization header to access Supabase
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { message }: CopilotRequest = await req.json();

    // Get context data from Supabase
    const [branchesRes, projectsRes, clientsRes, employeesRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('projects').select('*, clients(name), branches(name)'),
      supabase.from('clients').select('*, branches(name)'),
      supabase.from('employees').select('*, branches(name)'),
    ]);

    const contextData = {
      branches: branchesRes.data || [],
      projects: projectsRes.data || [],
      clients: clientsRes.data || [],
      employees: employeesRes.data || [],
    };

    // Build context string for the AI
    const context = `
You are an AI assistant for RETC (Renewable Energy Test Center), an environmental testing company with labs in multiple locations.

Current data context:
- Branches: ${contextData.branches.length} total (${contextData.branches.map(b => b.name).join(', ')})
- Projects: ${contextData.projects.length} total
  - Pending: ${contextData.projects.filter(p => p.status === 'pending').length}
  - In Progress: ${contextData.projects.filter(p => p.status === 'in_progress').length}
  - Completed: ${contextData.projects.filter(p => p.status === 'completed').length}
- Clients: ${contextData.clients.length} total
- Employees: ${contextData.employees.length} total
  - Active: ${contextData.employees.filter(e => e.status === 'active').length}
  - Admins: ${contextData.employees.filter(e => e.role === 'admin').length}
  - Lab Managers: ${contextData.employees.filter(e => e.role === 'lab_manager').length}
  - Technicians: ${contextData.employees.filter(e => e.role === 'technician').length}

When answering questions, use this real-time data to provide accurate information about the current state of the business.
`;

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://retc-erp.com',
        'X-Title': 'RETC ERP AI Copilot',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: context
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error details:', response.status, response.statusText, errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      context: {
        branches_count: contextData.branches.length,
        projects_count: contextData.projects.length,
        clients_count: contextData.clients.length,
        employees_count: contextData.employees.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-copilot function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});