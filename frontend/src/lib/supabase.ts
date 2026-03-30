import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jwkjqowuponrqmxwhgsj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a2pxb3d1cG9ucnFteHdoZ3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzcxMTQsImV4cCI6MjA4Njc1MzExNH0.lkVrhdwCN321rZk_s5DtUMlrxSMf8ilAU5gPce7emBg";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
