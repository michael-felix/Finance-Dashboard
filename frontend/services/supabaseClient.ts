import { createClient } from "@supabase/supabase-js";

// `createClient` throws synchronously if the URL isn't a well-formed URL — and it runs
// at module-evaluation time, which Next.js executes during static prerendering. Since
// AuthProvider (and therefore this module) is imported from the root layout, a missing
// NEXT_PUBLIC_SUPABASE_URL would crash the *entire* production build, not just auth
// pages. A syntactically valid placeholder keeps construction safe; actual auth calls
// against it simply fail at runtime with a normal network error until configured.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
