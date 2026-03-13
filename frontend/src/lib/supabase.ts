import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jwkjqowuponrqmxwhgsj.supabase.co";
const supabaseAnonKey = "sb_publishable_Om5sja9dNyPr5WHSQVMcMw_GuBmZBg-";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
