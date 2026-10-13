import { supabaseConfigured } from './supabaseClient'

/**
 * Demo mode runs the whole UI against sample data kept in this browser — no
 * Supabase project or backend needed. On when VITE_DEMO_MODE=true, or when the
 * Supabase env vars are missing (so a bare `npm run dev` just works).
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !supabaseConfigured
