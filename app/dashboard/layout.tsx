'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { LayoutGrid, Phone, CalendarDays, Users, Settings, CreditCard, Sun, Moon, Menu, X, LogOut, ChevronLeft, ChevronRight, AlertTriangle, Zap } from 'lucide-react';

const NAV = [
  { href: '/dashboard/overview',     label: 'Overview',      icon: <LayoutGrid size={18} /> },
  { href: '/dashboard/call-logs',    label: 'Call Logs',     icon: <Phone size={18} /> },
  { href: '/dashboard/appointments', label: 'Appointments',  icon: <CalendarDays size={18} /> },
  { href: '/dashboard/customers',    label: 'Customers',     icon: <Users size={18} /> },
  { href: '/dashboard/billing',      label: 'Billing',       icon: <CreditCard size={18} /> },
  { href: '/dashboard/settings',     label: 'Settings',      icon: <Settings size={18} /> },
];

const NAV_ITEM_STYLE = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
  fontSize: 13, textDecoration: 'none',
  transition: 'background 0.15s, color 0.15s, transform 0.15s',
  border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [minutesBalance, setMinutesBalance] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      setUser(session.user);
      setLoading(false);
      const { data: billing } = await supabase
        .from('billing')
        .select('minutes_balance')
        .eq('user_id', session.user.id)
        .single();
      if (billing) setMinutesBalance(billing.minutes_balance);
    });
  }, [router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
    </div>
  );

  const collapsed = sidebarCollapsed;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── MOBILE TOP BAR ── */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 16px', height: 56, alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow)',
      }} className="mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"/></svg>
          </div>
          <span className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Home Services</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.2s',
          }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text)',
          }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="mobile-overlay" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 149, display: 'none',
        }} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{
        width: collapsed ? 64 : 224, flexShrink: 0,
        background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 150,
        transition: 'transform 0.25s ease, width 0.25s ease, background 0.25s',
        boxShadow: 'var(--shadow)', overflow: 'hidden',
      }}>

        {/* ── Logo ── */}
        <div style={{
          padding: collapsed ? '16px 0 14px' : '18px 16px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          overflow: 'hidden', transition: 'padding 0.25s ease',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'transform 0.2s ease',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"/></svg>
            </div>
            <div style={{
              overflow: 'hidden',
              maxWidth: collapsed ? 0 : 140,
              opacity: collapsed ? 0 : 1,
              transition: 'max-width 0.25s ease, opacity 0.18s ease',
              whiteSpace: 'nowrap',
            }}>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Home Services</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Command Center</div>
            </div>
          </div>
          {/* Collapse button only shown in expanded state */}
          {!collapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse sidebar"
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* ── Live badge ── */}
        <div style={{
          borderBottom: '1px solid var(--border)', overflow: 'hidden',
          maxHeight: collapsed ? 0 : 40,
          opacity: collapsed ? 0 : 1,
          transition: 'max-height 0.25s ease, opacity 0.18s ease',
          flexShrink: 0,
        }}>
          <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>Live · AI Agent Active</span>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  ...NAV_ITEM_STYLE,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                    (e.currentTarget as HTMLElement).style.transform = collapsed ? '' : 'translateX(2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
                    (e.currentTarget as HTMLElement).style.transform = '';
                  }
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                <span style={{
                  overflow: 'hidden', whiteSpace: 'nowrap',
                  maxWidth: collapsed ? 0 : 120,
                  opacity: collapsed ? 0 : 1,
                  transition: 'max-width 0.25s ease, opacity 0.18s ease',
                }}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 4px 6px' }} />

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              ...NAV_ITEM_STYLE,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--muted)', background: 'transparent',
              marginBottom: 2,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
              if (!collapsed) (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            <span style={{
              overflow: 'hidden', whiteSpace: 'nowrap',
              maxWidth: collapsed ? 0 : 120,
              opacity: collapsed ? 0 : 1,
              transition: 'max-width 0.25s ease, opacity 0.18s ease',
            }}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              ...NAV_ITEM_STYLE,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--muted)', background: 'transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
              if (!collapsed) (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </span>
            <span style={{
              overflow: 'hidden', whiteSpace: 'nowrap',
              maxWidth: collapsed ? 0 : 80,
              opacity: collapsed ? 0 : 1,
              transition: 'max-width 0.25s ease, opacity 0.18s ease',
            }}>
              Collapse
            </span>
          </button>
        </nav>

        {/* ── User ── */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{
              overflow: 'hidden', whiteSpace: 'nowrap', flex: 1,
              maxWidth: collapsed ? 0 : 140,
              opacity: collapsed ? 0 : 1,
              transition: 'max-width 0.25s ease, opacity 0.18s ease',
              fontSize: 11, color: 'var(--muted)', textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="btn-ghost"
            style={{ width: '100%', fontSize: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <LogOut size={13} />
            <span style={{
              overflow: 'hidden', whiteSpace: 'nowrap',
              maxWidth: collapsed ? 0 : 60,
              opacity: collapsed ? 0 : 1,
              transition: 'max-width 0.25s ease, opacity 0.18s ease',
            }}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main" style={{
        flex: 1, marginLeft: collapsed ? 64 : 224,
        minHeight: '100vh', overflow: 'auto',
        transition: 'background 0.25s, margin-left 0.25s ease',
      }}>
        {/* Minutes exhausted banner */}
        {minutesBalance !== null && minutesBalance <= 0 && pathname !== '/dashboard/billing' && (
          <div className="r-banner" style={{
            background: 'rgba(248,113,113,0.1)', borderBottom: '1px solid rgba(248,113,113,0.25)',
            padding: '10px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--danger)', flexWrap: 'wrap' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <strong>Voice minutes exhausted.</strong>
              <span style={{ color: 'var(--muted)' }}>AI calls are paused until you top up.</span>
            </div>
            <Link href="/dashboard/billing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
              background: 'var(--danger)', color: '#fff',
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
            }}>
              <Zap size={12} /> Add Minutes
            </Link>
          </div>
        )}
        {/* Low minutes warning banner */}
        {minutesBalance !== null && minutesBalance > 0 && minutesBalance <= 20 && pathname !== '/dashboard/billing' && (
          <div className="r-banner" style={{
            background: 'rgba(251,191,36,0.1)', borderBottom: '1px solid rgba(251,191,36,0.25)',
            padding: '10px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--warning)', flexWrap: 'wrap' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <strong>Only {minutesBalance} minutes remaining.</strong>
              <span style={{ color: 'var(--muted)' }}>Top up to keep your AI agent running.</span>
            </div>
            <Link href="/dashboard/billing" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
              background: 'var(--warning)', color: '#000',
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
            }}>
              <Zap size={12} /> Top Up
            </Link>
          </div>
        )}
        {children}
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-bar   { display: flex !important; }
          .mobile-overlay { display: block !important; }
          .dash-sidebar { transform: translateX(-100%); top: 56px !important; width: 224px !important; }
          .dash-sidebar.open { transform: translateX(0); }
          .dash-main    { margin-left: 0 !important; padding-top: 56px; }
        }
        @media (min-width: 769px) {
          .dash-sidebar { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
}
