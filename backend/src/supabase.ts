import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env.js";

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
