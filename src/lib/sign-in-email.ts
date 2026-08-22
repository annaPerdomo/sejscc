import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email";

const SENDER_NAME = "SEJSCC Admin";
const FALLBACK_SENDER = `${SENDER_NAME} <onboarding@resend.dev>`;
const CENTER_TIME_ZONE = "America/Los_Angeles";
const PORTFOLIO_URL = "https://www.variationsonastring.com";

// Mail clients can't read the @theme tokens in globals.css, so the palette is
// repeated here as literal hex. Keep these in sync with globals.css.
const COLOR = {
  navy: "#12365f",
  ink: "#14304f",
  inkSoft: "#46617d",
  stone: "#4f6d8f",
  indigo: "#1e63b0",
  sky: "#8fc1f0",
  magenta: "#b02d76",
  line: "#d3e4f4",
  mist: "#f1f6fd",
  white: "#ffffff",
};

const BODY_FONT =
  "'Zen Maru Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const DISPLAY_FONT =
  "'Jost', 'Zen Maru Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// Mail clients show a bare address when the From header carries no display name.
export function signInSender() {
  const configured = process.env.AUTH_EMAIL_FROM?.trim();
  if (!configured) return FALLBACK_SENDER;
  return configured.includes("<")
    ? configured
    : `${SENDER_NAME} <${configured}>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatExpiry(expires: Date) {
  return expires.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: CENTER_TIME_ZONE,
    timeZoneName: "short",
  });
}

function buildText(url: string, expiry: string) {
  return [
    "Volunteer Sign In — Southeast Japanese School & Community Center",
    "",
    "Open this link to sign in to the SEJSCC admin dashboard. No password needed.",
    "",
    url,
    "",
    `The link works once and expires ${expiry}.`,
    "If you didn't ask to sign in, you can ignore this email — the link is",
    "useless to anyone who can't read your inbox.",
    "",
    "Est. 1925 · Norwalk, California",
    `Made with love by Variations on a String — ${PORTFOLIO_URL}`,
  ].join("\n");
}

function buildHtml(url: string, expiry: string) {
  const safeUrl = escapeHtml(url);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your SEJSCC sign-in link</title>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.mist};color-scheme:light;font-family:${BODY_FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Your link works once and expires ${expiry}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.mist};">
<tr><td align="center" style="padding:24px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background-color:${COLOR.white};border-radius:12px;overflow:hidden;">

<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="40%" height="4" style="background-color:${COLOR.indigo};line-height:4px;font-size:0;">&nbsp;</td>
<td width="30%" height="4" style="background-color:${COLOR.sky};line-height:4px;font-size:0;">&nbsp;</td>
<td width="30%" height="4" style="background-color:${COLOR.magenta};line-height:4px;font-size:0;">&nbsp;</td>
</tr></table>
</td></tr>

<tr><td style="background-color:${COLOR.navy};padding:28px 32px;">
<p style="margin:0 0 10px;font-family:${BODY_FONT};font-size:12px;font-weight:700;letter-spacing:0.2em;color:${COLOR.sky};">ボランティア &nbsp;—&nbsp; VOLUNTEER PORTAL</p>
<p style="margin:0;font-family:${DISPLAY_FONT};font-size:15px;font-weight:600;letter-spacing:0.08em;line-height:1.5;text-transform:uppercase;color:${COLOR.white};">Southeast Japanese School<br>&amp; Community Center</p>
</td></tr>

<tr><td style="padding:36px 32px 32px;">
<h1 style="margin:0;font-family:${DISPLAY_FONT};font-size:26px;font-weight:400;letter-spacing:0.02em;color:${COLOR.ink};">Volunteer <span style="color:${COLOR.indigo};">Sign In</span></h1>
<p style="margin:14px 0 0;font-family:${BODY_FONT};font-size:15px;line-height:1.7;color:${COLOR.inkSoft};">Tap the button below to sign in to the SEJSCC admin dashboard. There's no password to remember.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr>
<td bgcolor="${COLOR.indigo}" style="border-radius:8px;">
<a href="${safeUrl}" style="display:inline-block;padding:14px 32px;font-family:${DISPLAY_FONT};font-size:16px;font-weight:600;line-height:1.2;color:${COLOR.white};text-decoration:none;border-radius:8px;">Sign me in</a>
</td>
</tr></table>

<p style="margin:28px 0 8px;font-family:${BODY_FONT};font-size:13px;line-height:1.6;color:${COLOR.stone};">Button not working? Copy this address into your browser:</p>
<p style="margin:0;padding:12px 14px;background-color:${COLOR.mist};border:1px solid ${COLOR.line};border-radius:8px;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:${COLOR.inkSoft};word-break:break-all;">${safeUrl}</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;"><tr><td height="1" style="background-color:${COLOR.line};line-height:1px;font-size:0;">&nbsp;</td></tr></table>

<p style="margin:20px 0 0;font-family:${BODY_FONT};font-size:13px;line-height:1.7;color:${COLOR.stone};">The link works once and expires ${expiry}. If you didn't ask to sign in, you can ignore this email — the link is useless to anyone who can't read your inbox.</p>
</td></tr>

<tr><td style="background-color:${COLOR.mist};padding:22px 32px;border-top:1px solid ${COLOR.line};">
<p style="margin:0;font-family:${DISPLAY_FONT};font-size:13px;font-weight:600;color:${COLOR.navy};">Southeast Japanese School &amp; Community Center</p>
<p style="margin:5px 0 0;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:${COLOR.stone};">Est. 1925 · Norwalk, California</p>
<p style="margin:12px 0 0;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:${COLOR.stone};">Made with <span style="color:${COLOR.magenta};">&#10084;</span> by <a href="${PORTFOLIO_URL}" style="color:${COLOR.indigo};font-weight:500;text-decoration:none;">Variations on a String</a></p>
</td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

export async function sendSignInEmail({
  identifier,
  url,
  expires,
  provider,
}: EmailProviderSendVerificationRequestParams) {
  const expiry = formatExpiry(expires);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: provider.from,
      to: identifier,
      subject: "Your SEJSCC admin sign-in link",
      html: buildHtml(url, expiry),
      text: buildText(url, expiry),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend rejected the sign-in email (${response.status}): ${await response.text()}`
    );
  }
}
