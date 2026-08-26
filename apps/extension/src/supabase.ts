import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://zzectvafopdxylxpfzel.supabase.co',
  'sb_publishable_XXN_tJm9Zmz_5mnouGyYnA_CFEWigCj',
  { auth: { persistSession: false, autoRefreshToken: false } },
);
