import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getStripePriceId } from '@/lib/stripe';
import { getBilling, upsertBilling } from '@/lib/billing';
import { PLANS } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail } = await req.json();

    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const priceId = getStripePriceId(planId as 'starter' | 'growth' | 'pro');
    if (!priceId) return NextResponse.json({ error: 'Price not configured' }, { status: 500 });

    const stripe = getStripe();
    const billing = await getBilling(userId);
    let stripeCustomerId = billing?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      stripeCustomerId = customer.id;
      await upsertBilling(userId, { stripe_customer_id: stripeCustomerId });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard/billing?success=1&plan=${planId}`,
      cancel_url: `${origin}/dashboard/billing?canceled=1`,
      metadata: { user_id: userId, plan_id: planId },
      subscription_data: {
        metadata: { user_id: userId, plan_id: planId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('checkout error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
