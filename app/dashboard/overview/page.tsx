'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatDateTime } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Phone, Clock, BarChart2, CalendarCheck, XCircle, Users } from 'lucide-react';

const COLORS = ['#4f8ef7', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export default function OverviewPage() {
  const [stats, setStats] = useState({ calls: 0, minutes: 0, avgDuration: 0, booked: 0, cancelled: 0, customers: 0 });
  const [callsPerDay, setCallsPerDay] = useState<any[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<any[]>([]);
  const [outcomeData, setOutcomeData] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [callsRes, apptRes, customersRes] = await Promise.all([
        supabase.from('call_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*'),
        supabase.from('customers').select('id'),
      ]);

      const calls = callsRes.data || [];
      const appts = apptRes.data || [];
      const customers = customersRes.data || [];

      const totalDuration = calls.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
      setStats({
        calls: calls.length,
        minutes: Math.round(totalDuration / 60),
        avgDuration: calls.length ? Math.round(totalDuration / calls.length) : 0,
        booked: appts.filter((a: any) => a.status === 'booked' || a.status === 'scheduled').length,
        cancelled: appts.filter((a: any) => a.status?.toLowerCase() === 'cancelled').length,
        customers: customers.length,
      });

      // Calls per day — last 7 days
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const key = format(d, 'yyyy-MM-dd');
        const label = format(d, 'MMM d');
        const count = calls.filter((c: any) => c.created_at?.startsWith(key)).length;
        return { label, count };
      });
      setCallsPerDay(days);

      // Service breakdown
      const svcMap: Record<string, number> = {};
      appts.forEach((a: any) => {
        const s = a.service_type || 'Other';
        svcMap[s] = (svcMap[s] || 0) + 1;
      });
      setServiceBreakdown(Object.entries(svcMap).map(([name, value]) => ({ name, value })));

      // Call outcome breakdown
      const outcomeMap: Record<string, number> = {};
      calls.forEach((c: any) => {
        const o = (c.outcome || c.status || 'unknown').replace(/-/g, ' ');
        outcomeMap[o] = (outcomeMap[o] || 0) + 1;
      });
      setOutcomeData(Object.entries(outcomeMap).map(([name, value], i) => ({
        name, value, fill: COLORS[i % COLORS.length]
      })));

      // Peak hours
      const hourMap: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourMap[i] = 0;
      calls.forEach((c: any) => {
        if (c.created_at) {
          const hr = new Date(c.created_at).getHours();
          hourMap[hr] = (hourMap[hr] || 0) + 1;
        }
      });
      setPeakHours(
        Object.entries(hourMap).map(([hour, count]) => ({
          hour: `${hour}h`,
          count,
        }))
      );

      setRecentCalls(calls.slice(0, 5));
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel('call_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_logs' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const STAT_CARDS = [
    { label: 'Total Calls', value: stats.calls, icon: <Phone size={20} />, color: '#4f8ef7' },
    { label: 'Total Minutes', value: stats.minutes, icon: <Clock size={20} />, color: '#7c3aed' },
    { label: 'Avg Duration', value: formatDuration(stats.avgDuration), icon: <BarChart2 size={20} />, color: '#10b981' },
    { label: 'Bookings', value: stats.booked, icon: <CalendarCheck size={20} />, color: '#f59e0b' },
    { label: 'Cancelled', value: stats.cancelled, icon: <XCircle size={20} />, color: '#ef4444' },
    { label: 'Customers', value: stats.customers, icon: <Users size={20} />, color: '#06b6d4' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
          <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
          <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{payload[0].value} {payload[0].name}</div>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)' }}>Loading...</div>;

  return (
    <div className="fade-in" style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Overview</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>Real-time AI agent performance metrics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 12, color: 'var(--success)' }}>Live updates on</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            </div>
            <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Calls per day + Service breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
        {/* Calls per day */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Calls Per Day — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={callsPerDay}>
              <defs>
                <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="calls" stroke="#4f8ef7" strokeWidth={2} fill="url(#callGrad)" dot={{ fill: '#4f8ef7', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Service Breakdown</h3>
          {serviceBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={serviceBreakdown} cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} dataKey="value">
                    {serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {serviceBreakdown.slice(0, 4).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Row 2: Outcome chart + Peak hours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Call outcomes */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Call Outcomes</h3>
          {outcomeData.length > 0 ? (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={outcomeData} cx="50%" cy="50%" outerRadius={60} dataKey="value" paddingAngle={2}>
                    {outcomeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {outcomeData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: item.fill }} />
                      <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', paddingTop: 48 }}>No outcome data yet</div>
          )}
        </div>

        {/* Peak hours */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
          <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Peak Call Hours</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={peakHours} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: 'var(--muted)', fontSize: 9 }}
                axisLine={false} tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="calls" radius={[3, 3, 0, 0]}>
                {peakHours.map((entry, i) => (
                  <Cell key={i} fill={entry.count > 0 ? '#4f8ef7' : 'var(--border)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Calls */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
        <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Calls</h3>
        {recentCalls.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>No calls logged yet.</p>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 1fr 80px', gap: 12, padding: '0 12px 10px', borderBottom: '1px solid var(--border)' }}>
              {['Call ID', 'Date', 'Duration', 'Summary', 'Status'].map(h => (
                <div key={h} style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {recentCalls.map((call: any) => (
              <div key={call.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 1fr 80px', gap: 12, padding: '12px 12px', alignItems: 'center' }}>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {call.vapi_call_id?.slice(0, 18)}...
                </div>
                <div style={{ fontSize: 12 }}>{formatDateTime(call.created_at)}</div>
                <div style={{ fontSize: 12 }}>{formatDuration(call.duration)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {call.summary || '—'}
                </div>
                <div>
                  <span className="badge" style={{ fontSize: 10, background: '#4f8ef720', color: '#4f8ef7' }}>
                    {call.status || 'ended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
