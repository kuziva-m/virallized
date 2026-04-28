import { createClient } from "@supabase/supabase-js";

// Pulling securely from the .env.local file using Vite's syntax
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe to alert you if the variables aren't loading properly
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env.local file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
