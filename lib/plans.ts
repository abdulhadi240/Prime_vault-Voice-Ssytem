export type TopupPackage = {
  priceUsd: number;
  minutes: number;
};

export type Plan = {
  id: 'starter' | 'growth' | 'pro';
  name: string;
  priceUsd: number;
  minutes: number;
  badge?: string;
  description: string;
  features: string[];
  topup: TopupPackage;
};

export const COST_PER_MIN = 0.25;
export const OVERAGE_RATE = 0.50;
export const AUTO_TOPUP_THRESHOLD = 0.20;

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceUsd: 397,
    minutes: 500,
    description: 'Perfect for small businesses',
    features: [
      '500 AI voice minutes/month',
      'Call logs & transcripts',
      'Appointment management',
      'SMS notifications',
      'Auto top-up at 20% remaining',
      'Email support',
    ],
    topup: { priceUsd: 99, minutes: 250 },
  },
  {
    id: 'growth',
    name: 'Growth',
    priceUsd: 597,
    minutes: 1000,
    badge: 'Most Popular',
    description: 'For growing businesses',
    features: [
      '1,000 AI voice minutes/month',
      'Everything in Starter',
      'Auto top-up at 20% remaining',
      'Priority support',
      'Advanced analytics',
    ],
    topup: { priceUsd: 149, minutes: 500 },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 997,
    minutes: 2000,
    description: 'For high-volume operations',
    features: [
      '2,000 AI voice minutes/month',
      'Everything in Growth',
      'Auto top-up at 20% remaining',
      'Custom integrations',
      'Dedicated support',
    ],
    topup: { priceUsd: 299, minutes: 1000 },
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
