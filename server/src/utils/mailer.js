// ===========================================================================
// server/src/utils/mailer.js
// Sends email via the SendGrid HTTPS API. We use HTTP (not SMTP) because many
// hosts — including Render's free tier — block outbound SMTP ports, which makes
// Nodemailer/Gmail hang and time out. SendGrid's free tier works over HTTPS.
//
// Setup:
//   1. Create a free SendGrid account.
//   2. Verify a "Single Sender" (the From address, e.g. your Gmail) — no domain
//      needed; SendGrid emails you a confirmation link.
//   3. Create an API key (Mail Send permission).
//   4. Set in server/.env (and on Render):
//        SENDGRID_API_KEY=SG.xxxx
//        SENDGRID_FROM=your_verified_sender@example.com   (defaults to GMAIL_USER)
// ===========================================================================

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
// The From address must be a SendGrid-verified sender. Fall back to GMAIL_USER
// so existing setups keep working if that's the verified address.
const FROM_EMAIL = (process.env.SENDGRID_FROM || process.env.GMAIL_USER || '').trim();

// True only when both the API key and a From address are present. When false we
// skip sending and throw a clear error, so the rest of the app still runs.
export const emailConfigured = Boolean(SENDGRID_API_KEY && FROM_EMAIL);

// Low-level send via SendGrid's v3 API. `content` must list text/plain before
// text/html (SendGrid requires that order).
async function sendEmail({ to, subject, text, html }) {
  if (!emailConfigured) {
    console.warn('[mailer] SENDGRID_API_KEY / SENDGRID_FROM not set — cannot send email.');
    throw new Error('Email is not configured on the server.');
  }

  const content = [{ type: 'text/plain', value: text }];
  if (html) content.push({ type: 'text/html', value: html });

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: 'Good Eats' },
      subject,
      content,
    }),
  });

  // SendGrid returns 202 Accepted on success.
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid send failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return true;
}

// Send a shopping list to the given address. `groups` is an array of
// { recipeLabel, items: [text, ...] }. Returns true when sent.
export async function sendShoppingListEmail(to, groups) {
  const textParts = [];
  const htmlParts = ['<h2>Your Good Eats Shopping List</h2>'];

  for (const group of groups) {
    const title = group.recipeLabel || 'Other items';
    textParts.push(`\n${title}`);
    htmlParts.push(`<h3>${escapeHtml(title)}</h3><ul>`);
    for (const item of group.items) {
      textParts.push(`  - ${item}`);
      htmlParts.push(`<li>${escapeHtml(item)}</li>`);
    }
    htmlParts.push('</ul>');
  }

  return sendEmail({
    to,
    subject: 'Your Good Eats shopping list',
    text: `Your Good Eats Shopping List\n${textParts.join('\n')}\n`,
    html: htmlParts.join(''),
  });
}

// Send a password-reset link. `resetUrl` already contains the one-time token.
export async function sendPasswordResetEmail(to, resetUrl) {
  const safeUrl = escapeHtml(resetUrl);
  return sendEmail({
    to,
    subject: 'Reset your Good Eats password',
    text:
      'We received a request to reset your Good Eats password.\n\n' +
      `Use this link to set a new password (it expires in 1 hour):\n${resetUrl}\n\n` +
      "If you didn't request this, you can safely ignore this email.",
    html:
      '<p>We received a request to reset your Good Eats password.</p>' +
      `<p><a href="${safeUrl}">Click here to set a new password</a> — this link expires in 1 hour.</p>` +
      "<p>If you didn't request this, you can safely ignore this email.</p>",
  });
}

// Minimal HTML escaping so item/recipe text can't inject markup into the email.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
