import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, getWebhookSecret } from '@/lib/stripe';
import { upsertBilling, addMinutes, getBillingByStripeCustomer } from '@/lib/billing';
import { getPlan } from '@/lib/plans';

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0];
  if (item && (item as any).current_period_end) {
    return new Date((item as any).current_period_end * 1000).toISOString();
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, getWebhookSecret());
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        if (session.mode === 'subscription') {
          const planId = session.metadata?.plan_id;
          const plan = getPlan(planId || '');
          const subId = session.subscription as string;

          let periodEnd: string | null = null;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            periodEnd = getPeriodEnd(sub);
          }

          await upsertBilling(userId, {
            stripe_subscription_id: subId || null,
            plan_id: planId || null,
            subscription_status: 'active',
            current_period_end: periodEnd,
          });

          if (plan) await addMinutes(userId, plan.minutes);
        } else if (session.mode === 'payment') {
          const minutes = parseInt(session.metadata?.topup_minutes || '0', 10);
          if (minutes > 0) await addMinutes(userId, minutes);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const billing = await getBillingByStripeCustomer(sub.customer as string);
        if (!billing) break;

        const planId = sub.metadata?.plan_id;
        const periodEnd = getPeriodEnd(sub);

        await upsertBilling(billing.user_id, {
          stripe_subscription_id: sub.id,
          plan_id: planId || billing.plan_id || null,
          subscription_status: sub.status,
          current_period_end: periodEnd,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const billing = await getBillingByStripeCustomer(sub.customer as string);
        if (!billing) break;

        await upsertBilling(billing.user_id, {
          stripe_subscription_id: null,
          plan_id: null,
          subscription_status: 'canceled',
          current_period_end: null,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const billing = await getBillingByStripeCustomer(invoice.customer as string);
        if (!billing?.plan_id) break;

        const plan = getPlan(billing.plan_id);
        if (plan) await addMinutes(billing.user_id, plan.minutes);

        const subId = (invoice as any).subscription as string | undefined;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const periodEnd = getPeriodEnd(sub);
          await upsertBilling(billing.user_id, {
            subscription_status: 'active',
            current_period_end: periodEnd,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const billing = await getBillingByStripeCustomer(invoice.customer as string);
        if (!billing) break;
        await upsertBilling(billing.user_id, { subscription_status: 'past_due' });
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
