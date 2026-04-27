'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, type Appointment } from '@/lib/supabase';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { List, CalendarDays, Search, ChevronLeft, ChevronRight, KanbanSquare } from 'lucide-react';

const STATUS_FILTERS = ['All', 'booked', 'completed', 'cancelled', 'rescheduled'];

const KANBAN_COLUMNS = [
  { status: 'booked',      label: 'Booked',      color: '#4f8ef7' },
  { status: 'completed',   label: 'Completed',   color: '#10b981' },
  { status: 'cancelled',   label: 'Cancelled',   color: '#ef4444' },
  { status: 'rescheduled', label: 'Rescheduled', color: '#f59e0b' },
] as const;

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban'>(highlightId ? 'list' : 'list');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [hoveredAppt, setHoveredAppt] = useState<Appointment | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  async function load() {
    const { data } = await supabase
      .from('appointments')
      .select('*, customers(name, phone)')
      .order('scheduled_start', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [filtered, highlightId]);

  useEffect(() => {
    let result = appointments;
    if (statusFilter !== 'All') result = result.filter(a => a.status?.toLowerCase() === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a as any).customers?.name?.toLowerCase().includes(q) ||
        a.service_type?.toLowerCase().includes(q) ||
        a.address?.toLowerCase().includes(q) ||
        a.issue_description?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [appointments, statusFilter, search]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await supabase.from('appointments').update({ status }).eq('id', id);
    await load();
    setUpdating(null);
  }

  // Calendar helpers
  const calDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) });
  const firstDow = startOfMonth(calMonth).getDay(); // 0=Sun
  function apptForDay(day: Date) {
    return appointments.filter(a => {
      if (!a.scheduled_start) return false;
      try { return isSameDay(parseISO(a.scheduled_start), day); } catch { return false; }
    });
  }
  const STATUS_DOT: Record<string, string> = {
    booked: '#4f8ef7', scheduled: '#4f8ef7',
    completed: '#4ade80', cancelled: '#f87171', rescheduled: '#fbbf24',
  };

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  return (
    <div className="fade-in" style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Appointments</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>{appointments.length} total appointments</p>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {(['list', 'calendar', 'kanban'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '7px 16px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--muted)',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {mode === 'list' ? <List size={13} /> : mode === 'calendar' ? <CalendarDays size={13} /> : <KanbanSquare size={13} />}
                {mode === 'list' ? 'List' : mode === 'calendar' ? 'Calendar' : 'Kanban'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters (list mode only) */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                borderColor: statusFilter === f ? 'var(--accent)' : 'var(--border)',
                background: statusFilter === f ? 'var(--accent-dim)' : 'transparent',
                color: statusFilter === f ? 'var(--accent)' : 'var(--muted)',
                fontFamily: 'var(--font-body)',
              }}>{f}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input className="input" style={{ paddingLeft: 32 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 80px 140px', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {['Customer', 'Service', 'Date & Time', 'Address', 'Status', 'Actions'].map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No appointments found</div>
          ) : filtered.map(appt => (
            <div
              key={appt.id}
              ref={appt.id === highlightId ? highlightRef : null}
              className="table-row"
              style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr 80px 140px',
                gap: 12, padding: '14px 20px', alignItems: 'center',
                background: appt.id === highlightId ? 'var(--accent-dim)' : undefined,
                borderLeft: appt.id === highlightId ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background 0.3s',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{(appt as any).customers?.name || 'Unknown'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{(appt as any).customers?.phone}</div>
              </div>
              <div style={{ fontSize: 13 }}>{appt.service_type}</div>
              <div>
                <div style={{ fontSize: 12 }}>{formatDateTime(appt.scheduled_start)}</div>
                {appt.issue_description && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                    {appt.issue_description}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appt.address}</div>
              <div style={{ display: 'flex' }}>
                <span className={`badge ${getStatusColor(appt.status)}`} style={{ width: '100%' }}>{appt.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {appt.status !== 'completed' && (
                  <button onClick={() => updateStatus(appt.id, 'completed')} disabled={updating === appt.id}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--success)', color: 'var(--success)', background: 'transparent', cursor: 'pointer' }} title="Complete">✓</button>
                )}
                {appt.status !== 'cancelled' && (
                  <button onClick={() => updateStatus(appt.id, 'cancelled')} disabled={updating === appt.id}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent', cursor: 'pointer' }} title="Cancel">✕</button>
                )}
                {appt.status !== 'rescheduled' && (
                  <button onClick={() => updateStatus(appt.id, 'rescheduled')} disabled={updating === appt.id}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, border: '1px solid var(--warning)', color: 'var(--warning)', background: 'transparent', cursor: 'pointer' }} title="Reschedule">↻</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {viewMode === 'calendar' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Calendar nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
              className="btn-ghost"
              style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>
              {format(calMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
              className="btn-ghost"
              style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Empty cells before month start */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} style={{ minHeight: 90, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }} />
            ))}

            {calDays.map((day, idx) => {
              const dayAppts = apptForDay(day);
              const isToday = isSameDay(day, new Date());
              const col = (firstDow + idx) % 7;
              return (
                <div key={idx} style={{
                  minHeight: 90, padding: '8px', borderRight: col < 6 ? '1px solid var(--border)' : 'none',
                  borderBottom: '1px solid var(--border)',
                  background: isToday ? 'rgba(79,142,247,0.05)' : 'transparent',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: isToday ? 700 : 400,
                    background: isToday ? 'var(--accent)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--text)',
                    marginBottom: 6,
                  }}>{format(day, 'd')}</div>

                  {dayAppts.slice(0, 3).map(a => (
                    <div key={a.id}
                      onMouseEnter={e => { setHoveredAppt(a); setHoverPos({ x: e.clientX, y: e.clientY }); }}
                      onMouseLeave={() => setHoveredAppt(null)}
                      style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4, marginBottom: 3,
                        background: (STATUS_DOT[a.status?.toLowerCase() || ''] || '#6b7280') + '25',
                        color: STATUS_DOT[a.status?.toLowerCase() || ''] || '#6b7280',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        cursor: 'default',
                      }}>
                      {(a as any).customers?.name?.split(' ')[0] || 'Appt'} · {a.service_type}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>+{dayAppts.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 20 }}>
            {Object.entries(STATUS_DOT).slice(0, 4).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
          {KANBAN_COLUMNS.map(col => {
            const colCards = appointments.filter(a => (a.status?.toLowerCase() || 'booked') === col.status);
            const isDragOver = dragOverColumn === col.status;
            return (
              <div
                key={col.status}
                onDragOver={e => { e.preventDefault(); setDragOverColumn(col.status); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null); }}
                onDrop={async e => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) { try { await updateStatus(id, col.status); } catch { /* ignore */ } }
                }}
                style={{
                  background: isDragOver ? col.color + '12' : 'var(--surface-2)',
                  border: `1px solid ${isDragOver ? col.color + '60' : 'var(--border)'}`,
                  borderTop: `3px solid ${col.color}`,
                  borderRadius: 12,
                  padding: '14px 12px 12px',
                  minHeight: 240,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.01em', flex: 1 }}>{col.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, minWidth: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: col.color + '20', color: col.color,
                    borderRadius: 6, padding: '0 6px',
                  }}>
                    {colCards.length}
                  </span>
                </div>

                {/* Cards */}
                {colCards.map(appt => {
                  const name: string = (appt as any).customers?.name || 'Unknown';
                  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('text/plain', appt.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderLeft: `3px solid ${col.color}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginBottom: 8,
                        cursor: 'grab',
                        userSelect: 'none',
                        boxShadow: 'var(--shadow)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'; }}
                    >
                      {/* Avatar + name row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: col.color + '25', color: col.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                            {(appt as any).customers?.phone || ''}
                          </div>
                        </div>
                      </div>

                      {/* Service pill */}
                      <div style={{ marginBottom: 8 }}>
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 600,
                          background: col.color + '18', color: col.color,
                          padding: '2px 8px', borderRadius: 999,
                        }}>
                          {appt.service_type}
                        </span>
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: appt.address ? 3 : 0 }}>
                        {formatDateTime(appt.scheduled_start)}
                      </div>

                      {/* Address */}
                      {appt.address && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                          {appt.address}
                        </div>
                      )}
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div style={{
                    border: `2px dashed ${col.color}30`,
                    borderRadius: 10, padding: '24px 12px',
                    textAlign: 'center', fontSize: 12, color: 'var(--muted)',
                  }}>
                    No {col.label.toLowerCase()} appointments
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {hoveredAppt && (
        <div style={{
          position: 'fixed',
          top: hoverPos.y,
          left: hoverPos.x + 16,
          width: 220,
          zIndex: 200,
          pointerEvents: 'none',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 16px',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              {(hoveredAppt as any).customers?.name || 'Unknown'}
            </span>
            <span className={`badge ${getStatusColor(hoveredAppt.status)}`} style={{ fontSize: 10 }}>
              {hoveredAppt.status || 'booked'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 3 }}>{hoveredAppt.service_type}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: hoveredAppt.address ? 3 : 0 }}>
            {formatDateTime(hoveredAppt.scheduled_start)}
          </div>
          {hoveredAppt.address && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: hoveredAppt.issue_description ? 3 : 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hoveredAppt.address}
            </div>
          )}
          {hoveredAppt.issue_description && (
            <div style={{ fontSize: 12, color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {hoveredAppt.issue_description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
