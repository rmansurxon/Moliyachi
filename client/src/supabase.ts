import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ewvabxktdweiizjobryd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dmFieGt0ZHdlaWl6am9icnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODEwMTMsImV4cCI6MjEwNDQ1NzAxM30.X9Fnck3rRDwlyXgd1w5CWsNHjQCMWbaFn_wiTxBN6CU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
