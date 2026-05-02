import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getBilling, upsertBilling } from '@/lib/billing';
import { getPlan } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail } = await req.json();

    const plan = getPlan(planId);
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const { priceUsd, minutes } = plan.topup;
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
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: priceUsd * 100,
            product_data: {
              name: `${plan.name} Top-up — ${minutes} min`,
              description: `Add ${minutes} minutes to your ${plan.name} plan`,
            },
          },
        },
      ],
      success_url: `${origin}/dashboard/billing?topup=1&minutes=${minutes}`,
      cancel_url: `${origin}/dashboard/billing?canceled=1`,
      metadata: { user_id: userId, topup_minutes: String(minutes) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('topup error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
