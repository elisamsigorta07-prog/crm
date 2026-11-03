import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_URL = 'https://gafqicguxykkgiuemara.supabase.co';
const SUPABASE_PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnFpY2d1eHlra2dpdWVtYXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTEzNTMsImV4cCI6MjEwMjg4NzM1M30.hARpb2Y381D4iTBujH610TGldFOfdd-u8gNdv8c-SlE';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_PUBLIC_ANON_KEY;

export const isSupabaseConfigured = () => {
  return true;
};

export const crmAuth = createClient(supabaseUrl, supabaseAnonKey, { auth: { storageKey: 'elisam_crm_auth' } });
// Every CRM table request now carries the same verified Auth session. Database
// RLS is the security boundary; there is no separate anonymous business client.
export const supabase = crmAuth;


