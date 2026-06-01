import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🔴 Client Supabase Error: Missing Supabase Environment Variables!");
} else {
  console.log("🟢 Client Supabase Initialized Successfully with URL:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
