import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
