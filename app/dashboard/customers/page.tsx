'use client';
import { useEffect, useState } from 'react';
import { supabase, type Customer, type Appointment, type CallLog } from '@/lib/supabase';
import { formatDate, formatDateTime, formatDuration, getStatusColor } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<{ appointments: Appointment[], calls: CallLog[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      setCustomers(data || []);
      setFiltered(data || []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.address?.toLowerCase().includes(q)
    ));
  }, [search, customers]);

  async function loadProfile(customer: Customer) {
    setSelected(customer);
    setProfile(null);
    const [apptRes, callRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('customer_id', customer.id).order('scheduled_start', { ascending: false }),
      supabase.from('call_logs').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false }),
    ]);
    setProfile({ appointments: apptRes.data || [], calls: callRes.data || [] });
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left panel - customer list */}
      <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px 16px' }}>
          <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Customers</h1>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>{customers.length} total</p>
          <div style={{ marginTop: 16, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
          {filtered.map(customer => (
            <div
              key={customer.id}
              onClick={() => loadProfile(customer)}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                marginBottom: 4, transition: 'all 0.15s',
                background: selected?.id === customer.id ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${selected?.id === customer.id ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {customer.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: selected?.id === customer.id ? 'var(--accent)' : 'var(--text)' }}>
                    {customer.name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customer.phone}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{formatDate(customer.created_at)}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 14px' }}>No customers found</p>}
        </div>
      </div>

      {/* Right panel - profile */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 16, opacity: 0.3 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p style={{ fontSize: 14 }}>Select a customer to view their profile</p>
          </div>
        ) : (
          <div className="fade-in">
            {/* Profile header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#fff',
              }}>
                {selected.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>📞 {selected.phone}</span>
                  {selected.address && <span style={{ fontSize: 13, color: 'var(--muted)' }}>📍 {selected.address}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Customer since {formatDate(selected.created_at)}</div>
              </div>
            </div>

            {!profile ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
            ) : (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
                  {[
                    { label: 'Total Appointments', value: profile.appointments.length },
                    { label: 'Total Calls', value: profile.calls.length },
                    { label: 'Total Minutes', value: Math.round(profile.calls.reduce((s, c) => s + (c.duration || 0), 0) / 60) },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                      <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Appointments */}
                <div style={{ marginBottom: 24 }}>
                  <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Appointment History</h3>
                  {profile.appointments.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>No appointments yet</p>
                  ) : (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      {profile.appointments.map((a, i) => (
                        <div key={a.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '13px 18px',
                          borderBottom: i < profile.appointments.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{a.service_type}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.issue_description}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: 'var(--text)' }}>{formatDateTime(a.scheduled_start)}</div>
                            <span className={`badge ${getStatusColor(a.status)}`} style={{ fontSize: 10, marginTop: 4 }}>{a.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Call history */}
                <div>
                  <h3 className="font-display" style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Call History</h3>
                  {profile.calls.length === 0 ? (
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>No calls logged</p>
                  ) : (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      {profile.calls.map((c, i) => (
                        <div key={c.id} style={{
                          padding: '13px 18px',
                          borderBottom: i < profile.calls.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text)' }}>{formatDateTime(c.created_at)}</span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDuration(c.duration)}</span>
                          </div>
                          {c.summary && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{c.summary}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
