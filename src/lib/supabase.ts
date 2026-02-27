import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This will tell us in the console if the keys are actually loading
console.log("Supabase URL:", supabaseUrl ? "Found" : "MISSING");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your .env file!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);