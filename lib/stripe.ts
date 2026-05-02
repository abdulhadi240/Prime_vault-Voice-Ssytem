import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

export function getStripePriceId(plan: 'starter' | 'growth' | 'pro'): string {
  if (plan === 'starter') return process.env.STRIPE_PRICE_STARTER!;
  if (plan === 'growth') return process.env.STRIPE_PRICE_GROWTH!;
  return process.env.STRIPE_PRICE_PRO!;
}

export function getWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}
