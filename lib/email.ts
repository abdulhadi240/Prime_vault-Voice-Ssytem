import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || 'Home Services <noreply@yourdomain.com>';

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0b0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#13151d;border:1px solid #1e2330;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f8ef7,#7c3aed);padding:28px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:9px;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;line-height:36px;">🏠</span>
                </td>
                <td style="padding-left:12px;">
                  <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:-0.02em;">Home Services</div>
                  <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:1px;text-transform:uppercase;letter-spacing:0.06em;">Command Center</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#e8eaf0;letter-spacing:-0.02em;">${title}</h1>
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #1e2330;">
            <p style="margin:0;font-size:12px;color:#6b7280;">
              This is an automated message from your Home Services AI system.<br>
              If you have questions, reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function pill(text: string, color: string): string {
  return `<span style="display:inline-block;padding:3px 10px;border-radius:6px;background:${color}20;color:${color};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${text}</span>`;
}

function stat(label: string, value: string): string {
  return `
    <td style="text-align:center;padding:16px;">
      <div style="font-size:24px;font-weight:700;color:#4f8ef7;">${value}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px;">${label}</div>
    </td>`;
}

export async function sendSubscriptionStartedEmail(to: string, planName: string, minutes: number, priceUsd: number, periodEnd: string | null) {
  const renewDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'next month';

  const body = `
    <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.7;">
      Your <strong style="color:#e8eaf0;">${planName} Plan</strong> is now active. Your AI voice agent is ready to take calls.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1e2a;border:1px solid #1e2330;border-radius:12px;margin-bottom:24px;">
      <tr>
        ${stat('Minutes Added', `${minutes}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Monthly Cost', `$${priceUsd}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Renews', renewDate)}
      </tr>
    </table>
    <div style="background:#1a1e2a;border:1px solid #1e2330;border-left:3px solid #4f8ef7;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        💡 <strong style="color:#e8eaf0;">Tip:</strong> Your minutes auto-renew every month. You'll receive an alert when your balance drops below 20 minutes.
      </p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing" style="display:inline-block;background:#4f8ef7;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">View Billing Dashboard →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `✅ ${planName} Plan activated — ${minutes} minutes ready`,
    html: baseTemplate(`${planName} Plan Activated`, body),
  });
}

export async function sendTopupSuccessEmail(to: string, minutes: number, amountUsd: number) {
  const body = `
    <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.7;">
      Your top-up was successful. <strong style="color:#4ade80;">${minutes} minutes</strong> have been added to your balance.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1e2a;border:1px solid #1e2330;border-radius:12px;margin-bottom:24px;">
      <tr>
        ${stat('Minutes Added', `+${minutes}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Amount Charged', `$${amountUsd.toFixed(2)}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Rate', '$0.30/min')}
      </tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing" style="display:inline-block;background:#4f8ef7;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">View Billing Dashboard →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⚡ ${minutes} minutes added to your account`,
    html: baseTemplate('Top-up Successful', body),
  });
}

export async function sendSubscriptionCancelledEmail(to: string, planName: string) {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;line-height:1.7;">
      Your <strong style="color:#e8eaf0;">${planName} Plan</strong> has been cancelled. Your AI agent will stop taking calls once your current minutes are exhausted.
    </p>
    <div style="background:#1a1e2a;border:1px solid #f8717130;border-left:3px solid #f87171;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Any remaining minutes in your balance are still usable. You can resubscribe or top up at any time.
      </p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing" style="display:inline-block;background:#4f8ef7;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">Resubscribe →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your ${planName} subscription has been cancelled`,
    html: baseTemplate('Subscription Cancelled', body),
  });
}

export async function sendPaymentFailedEmail(to: string, planName: string) {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;line-height:1.7;">
      We were unable to process your payment for the <strong style="color:#e8eaf0;">${planName} Plan</strong>. Please update your payment method to keep your AI agent running.
    </p>
    <div style="background:#1a1e2a;border:1px solid #f8717130;border-left:3px solid #f87171;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        ⚠️ Your subscription is currently <strong style="color:#fbbf24;">past due</strong>. Stripe will retry the payment automatically. You can also update your card now.
      </p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/portal" style="display:inline-block;background:#f87171;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">Update Payment Method →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⚠️ Payment failed — action required`,
    html: baseTemplate('Payment Failed', body),
  });
}

export async function sendAutoTopupSuccessEmail(to: string, planName: string, minutes: number, priceUsd: number) {
  const body = `
    <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.7;">
      Your balance dropped below 20%, so we automatically topped up your <strong style="color:#e8eaf0;">${planName} Plan</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1e2a;border:1px solid #1e2330;border-radius:12px;margin-bottom:24px;">
      <tr>
        ${stat('Minutes Added', `+${minutes}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Amount Charged', `$${priceUsd}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Trigger', '20% remaining')}
      </tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing" style="display:inline-block;background:#4f8ef7;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">View Billing Dashboard →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⚡ Auto top-up: ${minutes} minutes added`,
    html: baseTemplate('Auto Top-up Successful', body),
  });
}

export async function sendAutoTopupFailedEmail(to: string, planName: string) {
  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;line-height:1.7;">
      We tried to automatically top up your <strong style="color:#e8eaf0;">${planName} Plan</strong> but the payment failed. Your minute balance is running low.
    </p>
    <div style="background:#1a1e2a;border:1px solid #f8717130;border-left:3px solid #f87171;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        ⚠️ Please update your payment method or manually top up to keep your AI agent running.
      </p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/portal" style="display:inline-block;background:#f87171;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">Update Payment Method →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `⚠️ Auto top-up failed — action required`,
    html: baseTemplate('Auto Top-up Failed', body),
  });
}

export async function sendRenewalEmail(to: string, planName: string, minutes: number, periodEnd: string | null) {
  const renewDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'next month';

  const body = `
    <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.7;">
      Your <strong style="color:#e8eaf0;">${planName} Plan</strong> has renewed. A fresh ${minutes} minutes have been added to your balance.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1e2a;border:1px solid #1e2330;border-radius:12px;margin-bottom:24px;">
      <tr>
        ${stat('Minutes Added', `+${minutes}`)}
        <td style="width:1px;background:#1e2330;"></td>
        ${stat('Next Renewal', renewDate)}
      </tr>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing" style="display:inline-block;background:#4f8ef7;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">View Dashboard →</a>
  `;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `🔄 ${planName} renewed — ${minutes} minutes added`,
    html: baseTemplate('Subscription Renewed', body),
  });
}
