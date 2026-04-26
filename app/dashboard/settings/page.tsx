'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    businessName: 'Home Services Co.',
    businessPhone: '+12184137966',
    businessEmail: 'contact@zentrexsystems.com',
    businessHours: 'Mon–Fri 8AM–6PM, Sat 9AM–2PM',
    timezone: 'America/New_York',
    vapiApiKey: 'f6465348-4e14-4849-9e42-958d7c47009d',
    supabaseUrl: 'https://klsjfqignhsnmzxmovex.supabase.co',
    n8nWebhook: 'https://n8n.srv1588601.hstgr.cloud/webhook',
    smsNotifications: true,
    callSummaryEmail: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 32 }}>
      <h2 className="font-display" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, type = 'text', onChange, masked }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'center' }}>
      <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{label}</label>
      <input
        className="input"
        style={{ maxWidth: 480 }}
        type={masked ? 'password' : type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 680 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? 'var(--accent)' : 'var(--border)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>Configure your AI voice agent system</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
              ✓ Saved successfully
            </span>
          )}
          <button onClick={handleSave} className="btn-primary">Save Changes</button>
        </div>
      </div>

      <Section title="Business Information">
        <Field label="Business Name" value={settings.businessName} onChange={(v: string) => setSettings({ ...settings, businessName: v })} />
        <Field label="Business Phone" value={settings.businessPhone} onChange={(v: string) => setSettings({ ...settings, businessPhone: v })} />
        <Field label="Business Email" value={settings.businessEmail} type="email" onChange={(v: string) => setSettings({ ...settings, businessEmail: v })} />
        <Field label="Business Hours" value={settings.businessHours} onChange={(v: string) => setSettings({ ...settings, businessHours: v })} />
        <Field label="Timezone" value={settings.timezone} onChange={(v: string) => setSettings({ ...settings, timezone: v })} />
      </Section>

      <Section title="API Keys">
        <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
          <p style={{ fontSize: 12, color: '#f59e0b' }}>⚠️ Keep these keys secret. Never share them publicly.</p>
        </div>
        <Field label="Vapi API Key" value={settings.vapiApiKey} masked onChange={(v: string) => setSettings({ ...settings, vapiApiKey: v })} />
        <Field label="Supabase URL" value={settings.supabaseUrl} onChange={(v: string) => setSettings({ ...settings, supabaseUrl: v })} />
        <Field label="n8n Webhook Base" value={settings.n8nWebhook} onChange={(v: string) => setSettings({ ...settings, n8nWebhook: v })} />
      </Section>

      <Section title="Notifications">
        <Toggle
          label="SMS Confirmations"
          desc="Send SMS to customers when appointments are booked"
          value={settings.smsNotifications}
          onChange={(v: boolean) => setSettings({ ...settings, smsNotifications: v })}
        />
        <Toggle
          label="Call Summary Email"
          desc="Receive email with call summary after each call ends"
          value={settings.callSummaryEmail}
          onChange={(v: boolean) => setSettings({ ...settings, callSummaryEmail: v })}
        />
      </Section>

      <Section title="System Info">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {[
            { label: 'Supabase Project', value: 'klsjfqignhsnmzxmovex' },
            { label: 'Supabase Plan', value: 'Free' },
            { label: 'Dashboard Version', value: '1.0.0' },
            { label: 'n8n Instance', value: 'n8n.srv1588601.hstgr.cloud' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
