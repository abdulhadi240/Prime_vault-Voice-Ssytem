import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getBilling } from '@/lib/billing';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    const billing = await getBilling(userId);
    if (!billing?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const stripe = getStripe();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('portal error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
