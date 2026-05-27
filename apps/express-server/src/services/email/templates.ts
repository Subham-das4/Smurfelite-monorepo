function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#141118;max-width:560px;margin:0 auto;padding:24px;">
  <div style="border-bottom:2px solid #6c47ff;padding-bottom:12px;margin-bottom:24px;">
    <strong style="font-size:18px;color:#6c47ff;">SmurfElite</strong>
  </div>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:#756189;">If you did not request this email, you can ignore it.</p>
</body>
</html>`;
}

export function buildVerificationEmailHtml(params: {
  name: string;
  verifyUrl: string;
}): string {
  const name = escapeHtml(params.name);
  const verifyUrl = escapeHtml(params.verifyUrl);
  return emailLayout(
    "Verify your email",
    `<h1 style="font-size:22px;margin:0 0 16px;">Verify your email</h1>
<p>Hi ${name},</p>
<p>Thanks for signing up. Confirm your email address to activate your SmurfElite account.</p>
<p style="margin:24px 0;">
  <a href="${verifyUrl}" style="background:#6c47ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block;">Verify email</a>
</p>
<p style="font-size:13px;color:#756189;">Or copy this link:<br><span style="word-break:break-all;">${verifyUrl}</span></p>
<p style="font-size:13px;color:#756189;">This link expires in 24 hours.</p>`
  );
}

export function buildPasswordResetEmailHtml(params: {
  name: string;
  resetUrl: string;
}): string {
  const name = escapeHtml(params.name);
  const resetUrl = escapeHtml(params.resetUrl);
  return emailLayout(
    "Reset your password",
    `<h1 style="font-size:22px;margin:0 0 16px;">Reset your password</h1>
<p>Hi ${name},</p>
<p>We received a request to reset your SmurfElite password.</p>
<p style="margin:24px 0;">
  <a href="${resetUrl}" style="background:#6c47ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;display:inline-block;">Reset password</a>
</p>
<p style="font-size:13px;color:#756189;">Or copy this link:<br><span style="word-break:break-all;">${resetUrl}</span></p>
<p style="font-size:13px;color:#756189;">This link expires in 1 hour.</p>`
  );
}

export interface PurchaseCredentialLine {
  title: string;
  gameType: string;
  accountUsername: string;
  accountPassword: string;
  accountEmail: string;
  accountEmailPassword: string;
}

export function buildPurchaseCredentialsEmailHtml(params: {
  buyerName: string;
  orderId: string;
  credentials: PurchaseCredentialLine[];
}): string {
  const buyerName = escapeHtml(params.buyerName);
  const orderId = escapeHtml(params.orderId);

  const itemsHtml = params.credentials
    .map(
      (item) => `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
  <h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(item.title)}</h2>
  <p style="margin:0 0 8px;font-size:13px;color:#756189;">${escapeHtml(item.gameType)}</p>
  <table style="width:100%;font-size:14px;border-collapse:collapse;">
    <tr><td style="padding:4px 8px 4px 0;color:#756189;">Username</td><td><code>${escapeHtml(item.accountUsername)}</code></td></tr>
    <tr><td style="padding:4px 8px 4px 0;color:#756189;">Password</td><td><code>${escapeHtml(item.accountPassword)}</code></td></tr>
    <tr><td style="padding:4px 8px 4px 0;color:#756189;">Email</td><td><code>${escapeHtml(item.accountEmail)}</code></td></tr>
    <tr><td style="padding:4px 8px 4px 0;color:#756189;">Email password</td><td><code>${escapeHtml(item.accountEmailPassword)}</code></td></tr>
  </table>
</div>`
    )
    .join("");

  return emailLayout(
    "Your order credentials",
    `<h1 style="font-size:22px;margin:0 0 16px;">Your order is ready</h1>
<p>Hi ${buyerName},</p>
<p>Thank you for your purchase. Your account credentials for order <strong>${orderId}</strong> are below. Store them securely — they are also available in your order history.</p>
${itemsHtml}
<p style="font-size:13px;color:#756189;">Need help? Reply to this email or contact support@smurfelite.store.</p>`
  );
}
