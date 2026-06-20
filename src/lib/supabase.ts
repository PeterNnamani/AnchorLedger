import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase connection. The anon/publishable key is safe to ship in a client
// (it only grants the access your Row Level Security policies allow). Values
// can be overridden at build time via Vite env vars.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://htucddmblfidpgilcncl.supabase.co'

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dWNkZG1ibGZpZHBnaWxjbmNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjU4ODksImV4cCI6MjA5NzU0MTg4OX0.70BSf5AVTP1MJ98tmFBzJTWsjEpEYoHhmav7Yqn8V6I'

// Single shared client. Auth persistence is disabled because this app uses its
// own PIN gate and a fixed workspace, not Supabase Auth sessions.
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/`

// All of this user's rows live under one stable workspace id so data restores
// across devices/reinstalls that share these keys.
export const WORKSPACE_ID = 'primary'

// The single table that backs the whole app (see supabase/schema.sql).
export const RECORDS_TABLE = 'finance_records'

export type RecordKind = 'account' | 'income' | 'expense'

export interface FinanceRecordRow {
  workspace_id: string
  kind: RecordKind
  id: string
  data: unknown
  updated_at?: string
}
