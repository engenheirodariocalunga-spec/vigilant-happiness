import { createClient } from '@supabase/supabase-js'

// Lê as chaves do nosso ficheiro .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cria e exporta o cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey)