import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables.')
}

if (supabaseAnonKey.startsWith('sb_secret_')) {
    console.warn('CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a SECRET KEY. This will be blocked by Supabase in the browser. Replace it with the public ANON KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
