'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLANS, getPlan } from '@/lib/plans';
import type { BillingRow } from '@/lib/billing';
import { CreditCard, Zap, CheckCircle, Clock, AlertCircle, ExternalLink, TrendingUp, TriangleAlert } from 'lucide-react';

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
      border: `1px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
      color: type === 'success' ? 'var(--success)' : 'var(--danger)',
      borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 8, maxWidth: 380,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      animation: 'fadeIn 0.25s ease',
    }}>
      {type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

function BalanceBar({ pct, isLow }: { pct: number; isLow: boolean }) {
  const color = isLow ? 'var(--warning)' : pct > 60 ? 'var(--success)' : 'var(--accent)';
  return (
    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        height: '100%', width: `${Math.min(100, pct)}%`,
        background: color, borderRadius: 3,
        transition: 'width 0.6s ease',
        boxShadow: isLow ? `0 0 8px ${color}` : 'none',
      }} />
    </div>
  );
}

export default function BillingPage() {
  const params = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [billing, setBilling] = useState<BillingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUser(session.user);
      const { data } = await supabase.from('billing').select('*').eq('user_id', session.user.id).single();
      setBilling(data ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (params.get('success')) showToast('Payment successful! Your plan is now active.', 'success');
    if (params.get('topup')) showToast(`${params.get('minutes')} minutes added to your balance!`, 'success');
    if (params.get('canceled')) showToast('Payment canceled.', 'error');
  }, [params]);

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }

  async function handleSubscribe(planId: string) {
    if (!user) return;
    setActionLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || 'Something went wrong', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setActionLoading(null); }
  }

  async function handleTopup() {
    if (!user || !activePlan) return;
    setActionLoading('topup');
    try {
      const res = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: activePlan.id, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || 'Something went wrong', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setActionLoading(null); }
  }

  async function handlePortal() {
    if (!user) return;
    setActionLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || 'No billing portal available', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setActionLoading(null); }
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  const activePlan = getPlan(billing?.plan_id ?? '');
  const minutesBalance = billing?.minutes_balance ?? 0;
  const overageMinutes = billing?.overage_minutes ?? 0;
  const autoTopupPending = billing?.auto_topup_pending ?? false;
  const isActive = billing?.subscription_status === 'active';
  const isPastDue = billing?.subscription_status === 'past_due';
  const balancePct = activePlan ? (minutesBalance / activePlan.minutes) * 100 : 0;
  const isLow = balancePct <= 20 && isActive;
  const thresholdMinutes = activePlan ? Math.floor(activePlan.minutes * 0.20) : 0;

  const statusColor = isActive ? 'var(--success)' : isPastDue ? 'var(--warning)' : 'var(--muted)';
  const statusBg = isActive ? 'rgba(74,222,128,0.12)' : isPastDue ? 'rgba(251,191,36,0.12)' : 'var(--surface-2)';

  return (
    <div className="fade-in r-pad" style={{ maxWidth: 960 }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="r-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Billing</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>Manage your subscription and voice minutes</p>
        </div>
        {billing?.stripe_customer_id && (
          <button
            onClick={handlePortal}
            disabled={actionLoading === 'portal'}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <ExternalLink size={13} />
            {actionLoading === 'portal' ? 'Opening...' : 'Manage Billing'}
          </button>
        )}
      </div>

      {/* Status card */}
      <div className="r-status-grid" style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
        padding: '24px 28px', marginBottom: 28,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Current Plan</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{activePlan?.name ?? 'No Plan'}</div>
          {activePlan && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>${activePlan.priceUsd}/month</div>}
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Minutes Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: minutesBalance <= 0 ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--text)' }}>
            {minutesBalance} min
          </div>
          {activePlan && (
            <>
              <BalanceBar pct={balancePct} isLow={isLow} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {isLow
                  ? `Low — auto top-up triggers at ${thresholdMinutes} min`
                  : `of ${activePlan.minutes} min/month`}
              </div>
            </>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6,
            background: statusBg, color: statusColor,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {isActive ? <CheckCircle size={11} /> : isPastDue ? <AlertCircle size={11} /> : <Clock size={11} />}
            {billing?.subscription_status ?? 'inactive'}
          </div>
          {autoTopupPending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11, color: 'var(--accent)' }}>
              <Zap size={11} /> Auto top-up processing…
            </div>
          )}
          {billing?.current_period_end && isActive && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
              Renews {new Date(billing.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Overage alert */}
      {overageMinutes > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderLeft: '3px solid var(--danger)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <TriangleAlert size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 3 }}>
              {overageMinutes} overage minutes used
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Overage is billed at $0.50/min. Total owed: <strong style={{ color: 'var(--text)' }}>${(overageMinutes * 0.50).toFixed(2)}</strong>.
              This will be settled at your next renewal or manually via the billing portal.
            </div>
          </div>
        </div>
      )}

      {/* Low balance alert */}
      {isLow && !autoTopupPending && (
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          borderLeft: '3px solid var(--warning)', borderRadius: 12,
          padding: '14px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={15} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--warning)' }}>Low balance</strong> — auto top-up will trigger automatically, or top up now to avoid interruption.
          </div>
        </div>
      )}

      {/* Plans */}
      <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>Subscription Plans</h2>
      <div className="r-billing-plans" style={{ marginBottom: 28 }}>
        {PLANS.map(plan => {
          const isCurrent = billing?.plan_id === plan.id && isActive;
          const isPopular = plan.badge === 'Most Popular';

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--surface)',
                border: isPopular
                  ? '1.5px solid rgba(124,58,237,0.6)'
                  : isCurrent
                  ? '1.5px solid var(--accent)'
                  : '1px solid var(--border)',
                borderRadius: 16,
                padding: '24px 22px',
                position: 'relative',
                boxShadow: isPopular
                  ? '0 0 0 1px rgba(124,58,237,0.15), 0 8px 32px rgba(124,58,237,0.12)'
                  : isCurrent
                  ? '0 0 0 1px var(--accent-dim), 0 4px 24px rgba(79,142,247,0.08)'
                  : 'none',
                transition: 'box-shadow 0.2s, border-color 0.2s',
              }}
            >
              {/* Badge */}
              {(isPopular || isCurrent) && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  background: isPopular ? 'linear-gradient(135deg,#7c3aed,#4f8ef7)' : 'var(--accent)',
                  color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 12px', borderRadius: '0 0 8px 8px', whiteSpace: 'nowrap',
                }}>
                  {isCurrent ? 'Current Plan' : plan.badge}
                </div>
              )}

              <div style={{ marginTop: isPopular || isCurrent ? 8 : 0 }}>
                {/* Plan name + price */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div className="font-display" style={{ fontSize: 18, fontWeight: 700, color: isPopular ? '#a78bfa' : 'var(--text)' }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{plan.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: isPopular ? '#a78bfa' : 'var(--accent)', lineHeight: 1 }}>
                      ${plan.priceUsd}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>/month</div>
                  </div>
                </div>

                {/* Minutes pill */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isPopular ? 'rgba(124,58,237,0.12)' : 'var(--accent-dim)',
                    color: isPopular ? '#a78bfa' : 'var(--accent)',
                    padding: '5px 11px', borderRadius: 7,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    <Zap size={11} />
                    {plan.minutes.toLocaleString()} min/month
                  </div>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text)' }}>
                      <CheckCircle size={12} style={{ color: isPopular ? '#a78bfa' : 'var(--success)', flexShrink: 0, marginTop: 1 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Subscribe button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || !!actionLoading}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 9, border: 'none',
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent
                      ? 'var(--surface-2)'
                      : isPopular
                      ? 'linear-gradient(135deg,#7c3aed,#4f8ef7)'
                      : 'var(--accent)',
                    color: isCurrent ? 'var(--muted)' : '#fff',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                    opacity: actionLoading === plan.id ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {actionLoading === plan.id
                    ? 'Redirecting…'
                    : isCurrent
                    ? 'Current Plan'
                    : billing?.plan_id
                    ? 'Switch Plan'
                    : 'Get Started'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top-up section (only for active subscribers) */}
      {activePlan && isActive && (
        <>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.01em' }}>Top Up Minutes</h2>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
            padding: '24px 28px', marginBottom: 28,
          }}>
            <div className="r-topup-btn-row">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {activePlan.name} Top-up Pack
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Add <strong style={{ color: 'var(--text)' }}>{activePlan.topup.minutes} minutes</strong> instantly for{' '}
                  <strong style={{ color: 'var(--text)' }}>${activePlan.topup.priceUsd}</strong>.
                  Also triggered automatically when balance drops below {thresholdMinutes} min.
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--accent-dim)', color: 'var(--accent)',
                    padding: '4px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  }}>
                    <Zap size={11} /> +{activePlan.topup.minutes} min
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(74,222,128,0.1)', color: 'var(--success)',
                    padding: '4px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  }}>
                    <TrendingUp size={11} /> ${activePlan.topup.priceUsd} one-time
                  </div>
                </div>
              </div>
              <button
                onClick={handleTopup}
                disabled={actionLoading === 'topup'}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', opacity: actionLoading === 'topup' ? 0.7 : 1, flexShrink: 0 }}
              >
                <Zap size={14} />
                {actionLoading === 'topup' ? 'Redirecting…' : `Top Up for $${activePlan.topup.priceUsd}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Overage info footer */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '14px 20px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--text)' }}>Overage pricing:</strong> When your minute balance reaches 0, calls continue at <strong style={{ color: 'var(--text)' }}>$0.50/min</strong>.
        Auto top-up activates at 20% remaining using your saved payment method.
        Need help? Reply to any billing email or contact support.
      </div>
    </div>
  );
}
