import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, getWebhookSecret } from '@/lib/stripe';
import { upsertBilling, addMinutes, getBillingByStripeCustomer, getUserEmail } from '@/lib/billing';
import { getPlan } from '@/lib/plans';
import {
  sendSubscriptionStartedEmail,
  sendTopupSuccessEmail,
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
  sendRenewalEmail,
} from '@/lib/email';

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0];
  if (item && (item as any).current_period_end) {
    return new Date((item as any).current_period_end * 1000).toISOString();
  }
  return null;
}

async function safeEmail(fn: () => Promise<any>) {
  try { await fn(); } catch (e: any) {
    console.error('Email send failed (non-fatal):', e.message);
  }
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

          if (plan) {
            await addMinutes(userId, plan.minutes);
            const email = await getUserEmail(userId);
            if (email) {
              await safeEmail(() =>
                sendSubscriptionStartedEmail(email, plan.name, plan.minutes, plan.priceUsd, periodEnd)
              );
            }
          }
        } else if (session.mode === 'payment') {
          const minutes = parseInt(session.metadata?.topup_minutes || '0', 10);
          const amountUsd = (session.amount_total || 0) / 100;
          if (minutes > 0) {
            await addMinutes(userId, minutes);
            const email = await getUserEmail(userId);
            if (email) {
              await safeEmail(() => sendTopupSuccessEmail(email, minutes, amountUsd));
            }
          }
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

        const planName = getPlan(billing.plan_id || '')?.name || 'your plan';

        await upsertBilling(billing.user_id, {
          stripe_subscription_id: null,
          plan_id: null,
          subscription_status: 'canceled',
          current_period_end: null,
        });

        const email = await getUserEmail(billing.user_id);
        if (email) {
          await safeEmail(() => sendSubscriptionCancelledEmail(email, planName));
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const billing = await getBillingByStripeCustomer(invoice.customer as string);
        if (!billing?.plan_id) break;

        const plan = getPlan(billing.plan_id);
        if (!plan) break;

        await addMinutes(billing.user_id, plan.minutes);

        let periodEnd: string | null = null;
        const subId = (invoice as any).subscription as string | undefined;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          periodEnd = getPeriodEnd(sub);
          await upsertBilling(billing.user_id, {
            subscription_status: 'active',
            current_period_end: periodEnd,
          });
        }

        const email = await getUserEmail(billing.user_id);
        if (email) {
          await safeEmail(() => sendRenewalEmail(email, plan.name, plan.minutes, periodEnd));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const billing = await getBillingByStripeCustomer(invoice.customer as string);
        if (!billing) break;

        const planName = getPlan(billing.plan_id || '')?.name || 'your plan';

        await upsertBilling(billing.user_id, { subscription_status: 'past_due' });

        const email = await getUserEmail(billing.user_id);
        if (email) {
          await safeEmail(() => sendPaymentFailedEmail(email, planName));
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
