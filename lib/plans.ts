export type Plan = {
  id: 'starter' | 'pro';
  name: string;
  priceUsd: number;
  minutes: number;
  pricePerMin: number;
  description: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceUsd: 30,
    minutes: 100,
    pricePerMin: 0.30,
    description: 'Perfect for small businesses',
    features: ['100 AI voice minutes/month', 'Call logs & transcripts', 'Appointment management', 'SMS notifications', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 300,
    minutes: 1000,
    pricePerMin: 0.30,
    description: 'For growing businesses',
    features: ['1,000 AI voice minutes/month', 'Everything in Starter', 'Priority support', 'Advanced analytics', 'Custom integrations'],
  },
];

export const TOPUP_RATE_PER_MIN = 0.30;
export const TOPUP_MIN_USD = 10;
export const TOPUP_MAX_USD = 1000;

export function minutesFromTopup(amountUsd: number): number {
  return Math.floor(amountUsd / TOPUP_RATE_PER_MIN);
}

export function getPlan(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
