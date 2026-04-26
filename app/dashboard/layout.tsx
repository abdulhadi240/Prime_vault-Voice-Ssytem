'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { LayoutGrid, Phone, CalendarDays, Users, Settings, Sun, Moon, Menu, X, LogOut } from 'lucide-react';

const NAV = [
  { href: '/dashboard/overview',     label: 'Overview',      icon: <LayoutGrid size={16} /> },
  { href: '/dashboard/call-logs',    label: 'Call Logs',     icon: <Phone size={16} /> },
  { href: '/dashboard/appointments', label: 'Appointments',  icon: <CalendarDays size={16} /> },
  { href: '/dashboard/customers',    label: 'Customers',     icon: <Users size={16} /> },
  { href: '/dashboard/settings',     label: 'Settings',      icon: <Settings size={16} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); }
      else { setUser(session.user); setLoading(false); }
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

  const themeBtn = (
    <button onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.2s', flexShrink: 0,
    }}>
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}

    </button>
  );

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
          {themeBtn}
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
        width: 224, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 150,
        transition: 'transform 0.25s ease, background 0.25s', boxShadow: 'var(--shadow)',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"/></svg>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Home Services</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Command Center</div>
            </div>
          </div>
          {themeBtn}
        </div>

        {/* Live badge */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>Live · AI Agent Active</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px', flex: 1 }}>
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                color: active ? 'var(--accent)' : 'var(--muted)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                fontSize: 13, fontWeight: active ? 600 : 400,
                textDecoration: 'none', transition: 'all 0.15s',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
                {item.icon}{item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#4f8ef7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {user?.email}
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-ghost" style={{ width: '100%', fontSize: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main" style={{ flex: 1, marginLeft: 224, minHeight: '100vh', overflow: 'auto', transition: 'background 0.25s' }}>
        {children}
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-bar   { display: flex !important; }
          .mobile-overlay { display: block !important; }
          .dash-sidebar { transform: translateX(-100%); top: 56px !important; }
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
