import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getBilling, upsertBilling } from '@/lib/billing';
import { minutesFromTopup, TOPUP_MIN_USD, TOPUP_MAX_USD } from '@/lib/plans';

export async function POST(req: NextRequest) {
  try {
    const { amountUsd, userId, userEmail } = await req.json();

    const amount = Number(amountUsd);
    if (!amount || amount < TOPUP_MIN_USD || amount > TOPUP_MAX_USD) {
      return NextResponse.json({ error: `Amount must be between $${TOPUP_MIN_USD} and $${TOPUP_MAX_USD}` }, { status: 400 });
    }

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

    const minutes = minutesFromTopup(amount);
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `Voice Minutes Top-up — ${minutes} min`,
              description: `Add ${minutes} minutes at $0.30/min`,
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
