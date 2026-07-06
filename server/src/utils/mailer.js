// ===========================================================================
// server/src/utils/mailer.js
// Sends email through a Gmail account using Nodemailer (same approach as
// pharm-assist). Auth uses a Google "App Password" (NOT the login password):
//   Google Account -> Security -> 2-Step Verification -> App passwords.
// Put the address + 16-char app password in server/.env as:
//   GMAIL_USER, GMAIL_APP_PASSWORD
// Free, no custom domain. ~500 emails/day; mail is "from" the Gmail address.
// ===========================================================================

import nodemailer from 'nodemailer';

// True only when both credentials are present. When false we skip sending and
// throw a clear error, so the rest of the app still runs without email set up.
export const emailConfigured = Boolean(
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
);

const transporter = emailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER.trim(),
        // Google displays app passwords with spaces ("abcd efgh ijkl mnop"), but
        // the real value has none — strip them so a spaced paste still works.
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
      },
    })
  : null;

// Send a shopping list to the given address. `groups` is an array of
// { recipeLabel, items: [text, ...] }. Returns true when sent.
export async function sendShoppingListEmail(to, groups) {
  if (!emailConfigured) {
    console.warn('[mailer] GMAIL_USER / GMAIL_APP_PASSWORD not set — cannot send shopping list.');
    throw new Error('Email is not configured on the server.');
  }

  // Build plain-text and HTML versions grouped by recipe.
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

  await transporter.sendMail({
    from: `Good Eats <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your Good Eats shopping list',
    text: `Your Good Eats Shopping List\n${textParts.join('\n')}\n`,
    html: htmlParts.join(''),
  });
  return true;
}

// Send a password-reset link to the given address. `resetUrl` already contains
// the one-time token. Returns true when sent.
export async function sendPasswordResetEmail(to, resetUrl) {
  if (!emailConfigured) {
    console.warn('[mailer] GMAIL_USER / GMAIL_APP_PASSWORD not set — cannot send reset email.');
    throw new Error('Email is not configured on the server.');
  }

  const safeUrl = escapeHtml(resetUrl);
  await transporter.sendMail({
    from: `Good Eats <${process.env.GMAIL_USER}>`,
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
  return true;
}

// Minimal HTML escaping so ingredient text can't inject markup into the email.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
