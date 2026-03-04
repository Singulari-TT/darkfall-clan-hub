import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : supabase; // Fallback to anon if not provided (though it should be the service role key for admin actions)
