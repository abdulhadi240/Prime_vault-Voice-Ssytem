'use client';
import { useEffect, useState } from 'react';
import { supabase, type CallLog } from '@/lib/supabase';
import { formatDuration, formatDateTime, getCallStatusStyle, getStatusStyle } from '@/lib/utils';
import { Download, Search, ChevronDown } from 'lucide-react';

function StatusPill({ status, styleOverride }: { status: string; styleOverride?: { background: string; color: string } }) {
  const { background, color } = styleOverride ?? getStatusStyle(status);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 8px', borderRadius: 6, width: '100%',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const, color,
    }}>
      {status || '—'}
    </div>
  );
}

export default function CallLogsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [filtered, setFiltered] = useState<CallLog[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [linkedAppts, setLinkedAppts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('call_logs')
        .select('*, customers(name, phone)')
        .order('created_at', { ascending: false });

      const calls = data || [];
      setCalls(calls);
      setFiltered(calls);

      // Pre-fetch linked appointments
      const apptIds = calls.map((c: any) => c.appointment_id).filter(Boolean);
      if (apptIds.length > 0) {
        const { data: appts } = await supabase
          .from('appointments')
          .select('id, service_type, scheduled_start, status, address, issue_description, customers(name)')
          .in('id', apptIds);
        const apptMap: Record<string, any> = {};
        (appts || []).forEach((a: any) => { apptMap[a.id] = a; });
        setLinkedAppts(apptMap);
      }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(calls.filter(c =>
      c.vapi_call_id?.toLowerCase().includes(q) ||
      c.summary?.toLowerCase().includes(q) ||
      c.transcript?.toLowerCase().includes(q) ||
      (c as any).customers?.name?.toLowerCase().includes(q) ||
      (c as any).customers?.phone?.includes(q)
    ));
  }, [search, calls]);

  function exportCSV() {
    const headers = ['Call ID', 'Customer', 'Phone', 'Date', 'Duration', 'Status', 'Cost', 'Summary'];
    const rows = filtered.map(c => [
      c.vapi_call_id,
      (c as any).customers?.name || '',
      (c as any).customers?.phone || '',
      formatDateTime(c.created_at),
      formatDuration(c.duration),
      c.status || '',
      Number((c as any).cost || 0).toFixed(4),
      (c.summary || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'call_logs.csv'; a.click();
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  return (
    <div className="fade-in" style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Call Logs</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>{calls.length} total calls recorded</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input className="input" style={{ paddingLeft: 36, maxWidth: 380 }} placeholder="Search by customer, phone, summary..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.85fr 0.85fr 70px 110px 36px', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {['Customer', 'Call ID', 'Date', 'Duration', 'Status', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No calls found</div>
        ) : filtered.map(call => (
          <div key={call.id}>
            {/* Row */}
            <div className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.85fr 0.85fr 70px 110px 36px', gap: 12, padding: '14px 20px', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === call.id ? null : call.id)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{(call as any).customers?.name || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(call as any).customers?.phone || '—'}</div>
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {call.vapi_call_id?.slice(0, 16)}...
              </div>
              <div style={{ fontSize: 12 }}>{formatDateTime(call.created_at)}</div>
              <div style={{ fontSize: 12 }}>{formatDuration(call.duration)}</div>
              <StatusPill status={call.status || 'ended'} styleOverride={getCallStatusStyle(call.status || 'ended')} />
              <div style={{ color: 'var(--muted)', textAlign: 'center' }}>
                <ChevronDown size={14} style={{ transform: expanded === call.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === call.id && (
              <div style={{ padding: '20px 20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                  {/* Summary */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Summary</div>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{call.summary || 'No summary available.'}</div>
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                      Cost: <span style={{ color: 'var(--text)' }}>${Number((call as any).cost || 0).toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Recording */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recording</div>
                    {call.recording_url ? (
                      <audio controls src={call.recording_url} style={{ width: '100%', height: 36 }} />
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>No recording available</div>
                    )}
                  </div>

                  {/* Linked appointment */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Linked Appointment</div>
                    {(call as any).appointment_id && linkedAppts[(call as any).appointment_id] ? (
                      (() => {
                        const a = linkedAppts[(call as any).appointment_id];
                        return (
                          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{a.service_type}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{formatDateTime(a.scheduled_start)}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{a.address}</div>
                            <StatusPill status={a.status} />
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>No appointment linked</div>
                    )}
                  </div>
                </div>

                {/* Transcript */}
                {call.transcript && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Full Transcript</div>
                    <div style={{
                      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                      padding: 16, fontSize: 12, color: 'var(--text)', lineHeight: 1.7,
                      maxHeight: 240, overflowY: 'auto', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap',
                    }}>
                      {call.transcript}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
