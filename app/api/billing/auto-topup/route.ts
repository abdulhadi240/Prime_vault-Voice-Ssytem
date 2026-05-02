import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getBilling, addMinutes, upsertBilling, getUserEmail } from '@/lib/billing';
import { getPlan } from '@/lib/plans';
import { sendAutoTopupSuccessEmail, sendAutoTopupFailedEmail } from '@/lib/email';

async function safeEmail(fn: () => Promise<any>) {
  try { await fn(); } catch (e: any) {
    console.error('Email send failed (non-fatal):', e.message);
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.AUTO_TOPUP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    const billing = await getBilling(userId);

    if (!billing?.stripe_customer_id || !billing.plan_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const plan = getPlan(billing.plan_id);
    if (!plan) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

    const threshold = Math.floor(plan.minutes * 0.20);
    if (billing.minutes_balance > threshold) {
      return NextResponse.json({ skipped: true, reason: 'Balance above threshold' });
    }

    if (billing.auto_topup_pending) {
      return NextResponse.json({ skipped: true, reason: 'Top-up already pending' });
    }

    const stripe = getStripe();

    // Retrieve saved payment method from active subscription or customer default
    const subscriptions = await stripe.subscriptions.list({
      customer: billing.stripe_customer_id,
      status: 'active',
      limit: 1,
    });
    const sub = subscriptions.data[0];
    let paymentMethodId: string | null = sub?.default_payment_method as string | null;

    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(billing.stripe_customer_id);
      if (!customer.deleted) {
        paymentMethodId = customer.invoice_settings?.default_payment_method as string | null;
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'No saved payment method' }, { status: 400 });
    }

    await upsertBilling(userId, { auto_topup_pending: true });

    const { priceUsd, minutes } = plan.topup;
    const email = await getUserEmail(userId);

    try {
      const pi = await stripe.paymentIntents.create({
        amount: priceUsd * 100,
        currency: 'usd',
        customer: billing.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description: `Auto top-up: ${minutes} min for ${plan.name} plan`,
        metadata: { user_id: userId, topup_minutes: String(minutes), auto_topup: 'true' },
      });

      if (pi.status === 'succeeded') {
        await addMinutes(userId, minutes);
        await upsertBilling(userId, { auto_topup_pending: false });
        if (email) {
          await safeEmail(() => sendAutoTopupSuccessEmail(email, plan.name, minutes, priceUsd));
        }
        return NextResponse.json({ success: true, minutes });
      }

      await upsertBilling(userId, { auto_topup_pending: false });
      if (email) {
        await safeEmail(() => sendAutoTopupFailedEmail(email, plan.name));
      }
      return NextResponse.json({ error: 'Payment incomplete', status: pi.status }, { status: 400 });
    } catch (err: any) {
      await upsertBilling(userId, { auto_topup_pending: false });
      if (email) {
        await safeEmail(() => sendAutoTopupFailedEmail(email, plan.name));
      }
      throw err;
    }
  } catch (err: any) {
    console.error('auto-topup error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
