import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

// The values shipped in .env.example are placeholders, not a real project.
const isPlaceholder = (v: string) => /your-project|your-anon-key|^https?:\/\/(example|xxx)/i.test(v)

export const supabaseUrl = url
export const supabaseConfigured = Boolean(url && anonKey && !isPlaceholder(url) && !isPlaceholder(anonKey))

export const supabase = createClient(supabaseConfigured ? url : 'http://localhost:54321', supabaseConfigured ? anonKey : 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
