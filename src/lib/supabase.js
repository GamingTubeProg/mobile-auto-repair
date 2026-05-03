import { createClient } from '@supabase/supabase-js';

// The anon key is intentionally public — it only allows operations
// permitted by Row Level Security (RLS) policies. Safe to embed here.
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
  ?? 'https://udporjlwjwsmmouvflkk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcG9yamx3andzbW1vdXZmbGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODY0NTMsImV4cCI6MjA5Mjc2MjQ1M30.APsdy0cSYBufTmvJp-YnnumtKSuMEao4lMwrJACBbSM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
