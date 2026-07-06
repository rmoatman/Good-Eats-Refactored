// ===========================================================================
// server/src/utils/mailer.js
// Sends email via the Brevo (formerly Sendinblue) HTTPS API. We use HTTP (not
// SMTP) because many hosts — including Render's free tier — block outbound SMTP
// ports, which makes SMTP clients hang and time out. Brevo's free tier works
// over HTTPS and activates immediately after you verify your sender email.
//
// Setup:
//   1. Create a free Brevo account (brevo.com).
//   2. Add + verify a sender: Settings -> Senders, Domains & Dedicated IPs ->
//      Senders -> add your From address (e.g. goodeats.admin@gmail.com) and click
//      the verification link Brevo emails you.
//   3. Create an API key: SMTP & API -> API Keys -> Generate a new API key (v3).
//   4. Set in server/.env (and on Render):
//        BREVO_API_KEY=xkeysib-xxxx
//        BREVO_FROM=your_verified_sender@example.com   (defaults to GMAIL_USER)
// ===========================================================================

const BREVO_API_KEY = process.env.BREVO_API_KEY;
// The From address should be a Brevo-verified sender. Fall back to GMAIL_USER so
// existing setups keep working if that's the verified address.
const FROM_EMAIL = (process.env.BREVO_FROM || process.env.GMAIL_USER || '').trim();

// True only when both the API key and a From address are present. When false we
// skip sending and throw a clear error, so the rest of the app still runs.
export const emailConfigured = Boolean(BREVO_API_KEY && FROM_EMAIL);

// Low-level send via Brevo's transactional email API.
async function sendEmail({ to, subject, text, html }) {
  if (!emailConfigured) {
    console.warn('[mailer] BREVO_API_KEY / BREVO_FROM not set — cannot send email.');
    throw new Error('Email is not configured on the server.');
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Good Eats', email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(html ? { htmlContent: html } : {}),
    }),
  });

  // Brevo returns 201 Created (with a messageId) on success.
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo send failed (${res.status}): ${body.slice(0, 200)}`);
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
