'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLANS, TOPUP_MIN_USD, TOPUP_MAX_USD, minutesFromTopup } from '@/lib/plans';
import type { BillingRow } from '@/lib/billing';
import { CreditCard, Zap, CheckCircle, Clock, AlertCircle, ExternalLink, Plus } from 'lucide-react';

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

export default function BillingPage() {
  const params = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [billing, setBilling] = useState<BillingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUser(session.user);

      const { data } = await supabase
        .from('billing')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
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
    setTimeout(() => setToast(null), 4000);
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
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTopup() {
    if (!user) return;
    const amount = Number(topupAmount);
    if (!amount || amount < TOPUP_MIN_USD || amount > TOPUP_MAX_USD) {
      showToast(`Enter an amount between $${TOPUP_MIN_USD} and $${TOPUP_MAX_USD}`, 'error');
      return;
    }
    setActionLoading('topup');
    try {
      const res = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: amount, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || 'Something went wrong', 'error');
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
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
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  const activePlan = PLANS.find(p => p.id === billing?.plan_id);
  const minutesBalance = billing?.minutes_balance ?? 0;
  const isActive = billing?.subscription_status === 'active';
  const isPastDue = billing?.subscription_status === 'past_due';
  const topupMinutes = topupAmount ? minutesFromTopup(Number(topupAmount)) : 0;

  const statusStyle = isActive
    ? { color: 'var(--success)', bg: 'rgba(74,222,128,0.12)' }
    : isPastDue
    ? { color: 'var(--warning)', bg: 'rgba(251,191,36,0.12)' }
    : { color: 'var(--muted)', bg: 'var(--surface-2)' };

  return (
    <div className="fade-in r-pad" style={{ maxWidth: 900 }}>
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

      {/* Current status card */}
      <div className="r-status-grid" style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        padding: '22px 24px', marginBottom: 28,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Current Plan</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{activePlan?.name ?? 'No Plan'}</div>
          {activePlan && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>${activePlan.priceUsd}/month</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Minutes Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: minutesBalance <= 0 ? 'var(--danger)' : minutesBalance < 20 ? 'var(--warning)' : 'var(--text)' }}>
            {minutesBalance} min
          </div>
          {minutesBalance <= 0 && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>Top up to resume calls</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Status</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6,
            background: statusStyle.bg, color: statusStyle.color,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {isActive ? <CheckCircle size={11} /> : isPastDue ? <AlertCircle size={11} /> : <Clock size={11} />}
            {billing?.subscription_status ?? 'inactive'}
          </div>
          {billing?.current_period_end && isActive && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
              Renews {new Date(billing.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <h2 className="font-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Subscription Plans</h2>
      <div className="r-plans-grid" style={{ marginBottom: 28 }}>
        {PLANS.map(plan => {
          const isCurrent = billing?.plan_id === plan.id && isActive;
          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--surface)', border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14, padding: '22px 24px', position: 'relative',
                boxShadow: isCurrent ? '0 0 0 1px var(--accent), 0 4px 24px rgba(79,142,247,0.1)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: -1, right: 18,
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: '0 0 8px 8px',
                }}>
                  Current Plan
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{plan.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>${plan.priceUsd}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>/month</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  padding: '4px 10px', borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                }}>
                  <Zap size={11} /> {plan.minutes} min/month
                </div>
              </div>

              <ul style={{ listStyle: 'none', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)' }}>
                    <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || actionLoading === plan.id}
                style={{
                  width: '100%', padding: '9px 16px', borderRadius: 8, border: 'none', cursor: isCurrent ? 'default' : 'pointer',
                  background: isCurrent ? 'var(--surface-2)' : 'var(--accent)',
                  color: isCurrent ? 'var(--muted)' : '#fff',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  transition: 'opacity 0.15s',
                  opacity: actionLoading === plan.id ? 0.7 : 1,
                }}
              >
                {actionLoading === plan.id ? 'Redirecting...' : isCurrent ? 'Current Plan' : billing?.plan_id ? 'Switch Plan' : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Top-up */}
      <h2 className="font-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Top Up Minutes</h2>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '22px 24px',
      }}>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Add minutes at any time. Rate: <strong style={{ color: 'var(--text)' }}>$0.30 / minute</strong>.
          Enter any amount between ${TOPUP_MIN_USD}–${TOPUP_MAX_USD}.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (USD)</div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--muted)', fontSize: 13, pointerEvents: 'none',
              }}>$</span>
              <input
                className="input"
                type="number"
                min={TOPUP_MIN_USD}
                max={TOPUP_MAX_USD}
                step="1"
                placeholder="50"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                style={{ paddingLeft: 24 }}
              />
            </div>
          </div>

          {topupAmount && Number(topupAmount) >= TOPUP_MIN_USD && Number(topupAmount) <= TOPUP_MAX_USD && (
            <div style={{
              padding: '8px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 8, fontSize: 12, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              <Zap size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {topupMinutes} minutes
            </div>
          )}

          <button
            onClick={handleTopup}
            disabled={actionLoading === 'topup'}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: actionLoading === 'topup' ? 0.7 : 1 }}
          >
            <Plus size={13} />
            {actionLoading === 'topup' ? 'Redirecting...' : 'Buy Minutes'}
          </button>
        </div>

        {/* Quick picks */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {[10, 30, 50, 100, 200].map(v => (
            <button
              key={v}
              onClick={() => setTopupAmount(String(v))}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
                background: topupAmount === String(v) ? 'var(--accent-dim)' : 'var(--surface-2)',
                color: topupAmount === String(v) ? 'var(--accent)' : 'var(--muted)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              ${v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
