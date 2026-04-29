import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );
  }
  return _admin;
}

export type BillingRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  minutes_balance: number;
  current_period_end: string | null;
  updated_at: string;
};

export async function getBilling(userId: string): Promise<BillingRow | null> {
  const { data } = await admin()
    .from('billing')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data ?? null;
}

export async function upsertBilling(userId: string, patch: Partial<BillingRow>) {
  const { error } = await admin()
    .from('billing')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function addMinutes(userId: string, minutes: number) {
  const { error } = await admin().rpc('add_minutes', { p_user_id: userId, p_minutes: minutes });
  if (error) throw error;
}

export async function getBillingByStripeCustomer(stripeCustomerId: string): Promise<BillingRow | null> {
  const { data } = await admin()
    .from('billing')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  return data ?? null;
}
