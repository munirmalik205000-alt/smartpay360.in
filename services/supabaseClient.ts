import { createClient } from "@supabase/supabase-js";

// Vite handles environment variables via import.meta.env.VITE_*
// but we might define them differently or use process.env via define in vite.config
const getEnvUrl = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    }
  } catch {}
  return "";
};

const getEnvKey = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
    }
  } catch {}
  return "";
};

const supabaseUrl = getEnvUrl() || (typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) : "") || "";
const supabaseAnonKey = getEnvKey() || (typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) : "") || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🔴 Client Supabase Error: Missing Supabase Environment Variables!", { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
} else {
  console.log("🟢 Client Supabase Initialized Successfully with provided URL.");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
