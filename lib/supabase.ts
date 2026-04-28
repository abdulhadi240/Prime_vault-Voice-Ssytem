import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  customer_id: string;
  service_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  google_event_id: string;
  issue_description: string;
  address: string;
  created_at: string;
  customers?: Customer;
};

export type CallLog = {
  id: string;
  vapi_call_id: string;
  duration: number;
  transcript: string;
  recording_url: string;
  summary: string;
  outcome: string;
  customer_id?: string;
  appointment_id?: string;
  cost?: number;
  status?: string;
  created_at: string;
  customers?: Customer;
};

export type TwilioMessage = {
  id: string;
  to_number: string;
  from_number: string;
  message_body: string;
  status: string;
  twilio_sid: string;
  appointment_id: string;
  created_at: string;
};

export type Billing = {
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
