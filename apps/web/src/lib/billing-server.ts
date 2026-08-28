import 'server-only';
import { createClient } from '@supabase/supabase-js';

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error('Supabase is not configured');
  return { url, publishableKey };
}

export async function requireUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { url, publishableKey } = supabaseConfig();
  const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

export function createAdminClient() {
  const { url } = supabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('Billing storage is not configured');
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isActiveSubscription(status: string | null | undefined) {
  return status === 'active' || status === 'trialing';
}
