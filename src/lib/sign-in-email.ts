import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email";
import { CENTER_ADDRESS } from "@/lib/center";
import { sendEmail } from "@/lib/resend";

const SENDER_NAME = "SEJSCC Volunteer Portal";
const FALLBACK_SENDER = `${SENDER_NAME} <onboarding@resend.dev>`;
const CENTER_TIME_ZONE = "America/Los_Angeles";
const PORTFOLIO_URL = "https://www.variationsonastring.com";

// Mail clients can't read the @theme tokens in globals.css, so the palette is
// repeated here as literal hex. Keep these in sync with globals.css.
const COLOR = {
  ink: "#14304f",
  inkSoft: "#46617d",
  stone: "#4f6d8f",
  indigo: "#1e63b0",
  magenta: "#b02d76",
  line: "#d3e4f4",
  mist: "#f1f6fd",
  white: "#ffffff",
};

// Mail clients drop web fonts, so the email sets a system stack directly
// instead of falling back from the site's fonts unevenly.
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Yu Gothic', Helvetica, Arial, sans-serif";

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

function buildText(url: string, expires: Date) {
  const expiry = formatExpiry(expires);
  return [
    "Here's your sign-in link — SEJSCC Volunteer Portal",
    "",
    "Open this link to sign in to the volunteer portal. No password needed.",
    "",
    url,
    "",
    `This link works once and expires ${expiry}. It signs you in on the`,
    "device where you open it.",
    "",
    "Didn't request this? You can safely ignore this email — the link only",
    "works for someone with access to your inbox.",
    "",
    "Southeast Japanese School & Community Center · Est. 1925",
    CENTER_ADDRESS,
    "",
    `Made with love by Variations on a String — ${PORTFOLIO_URL}`,
  ].join("\n");
}

function spacer(height: number) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="${height}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr></table>`;
}

function buildHtml(url: string, expires: Date) {
  const safeUrl = escapeHtml(url);
  const safeExpiry = escapeHtml(formatExpiry(expires));
  // Built from the sign-in link's origin, not SITE_URL — that one still points
  // at the old WordPress host.
  const origin = new URL(url).origin;
  const logo = escapeHtml(`${origin}/logo-mark.png`);
  const text = (size: number, lineHeight: number, color: string) =>
    `font-family:${FONT};font-size:${size}px;line-height:${lineHeight}px;mso-line-height-rule:exactly;color:${color};`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your SEJSCC sign-in link</title>
<style>
  @media (max-width: 620px) {
    .wrap { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.mist};color-scheme:light;font-family:${FONT};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLOR.mist};mso-hide:all;">Your one-time sign-in link for the SEJSCC volunteer portal — it works once and expires ${safeExpiry}.</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLOR.mist};">
<tr><td align="center" style="padding:24px 12px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:100%;max-width:600px;border-collapse:separate;background-color:${COLOR.white};border:1px solid ${COLOR.line};border-radius:14px;">
    <tr>
      <td class="px" style="padding:32px 44px 36px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="middle" style="padding-right:12px;">
              <img src="${logo}" alt="" width="40" height="40" style="display:block;width:40px;height:40px;border:0;">
            </td>
            <td valign="middle" style="${text(14, 20, COLOR.stone)}font-weight:700;letter-spacing:1px;text-transform:uppercase;">Southeast Japanese School<br>&amp; Community Center</td>
          </tr>
        </table>

        <h1 style="margin:28px 0 0;${text(28, 36, COLOR.ink)}font-weight:700;">Here's your sign-in link</h1>
        <p style="margin:12px 0 0;${text(17, 28, COLOR.inkSoft)}">Tap the button to sign in to the volunteer portal. No password needed.</p>

        ${spacer(24)}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" bgcolor="${COLOR.indigo}" style="border-radius:10px;mso-padding-alt:20px;">
              <a href="${safeUrl}" style="display:block;padding:20px;${text(19, 24, COLOR.white)}font-weight:700;text-decoration:none;border-radius:10px;">Sign in to the volunteer portal</a>
            </td>
          </tr>
        </table>
        ${spacer(20)}

        <p style="margin:0;${text(15, 24, COLOR.inkSoft)}">This link works <strong style="color:${COLOR.ink};">once</strong> and expires <strong style="color:${COLOR.ink};">${safeExpiry}</strong>. It signs you in on the device where you open it.</p>

        <p style="margin:20px 0 0;${text(14, 23, COLOR.stone)}">Button not working? Copy and paste this link into your browser:<br>
          <a href="${safeUrl}" style="color:${COLOR.indigo};text-decoration:underline;word-break:break-all;">${safeUrl}</a>
        </p>

        ${spacer(24)}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td height="1" bgcolor="${COLOR.line}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td>
          </tr>
        </table>
        ${spacer(20)}

        <p style="margin:0;${text(14, 23, COLOR.stone)}"><strong style="color:${COLOR.ink};">Didn't request this?</strong> You can safely ignore this email — the link only works for someone with access to your inbox.</p>
        <p style="margin:16px 0 0;${text(13, 21, COLOR.stone)}">Southeast Japanese School &amp; Community Center · Est. 1925<br>${CENTER_ADDRESS}</p>
        <p style="margin:8px 0 0;${text(13, 21, COLOR.stone)}">Made with <span style="color:${COLOR.magenta};">&#10084;</span> by <a href="${PORTFOLIO_URL}" style="color:${COLOR.stone};text-decoration:underline;">Variations on a String</a></p>
      </td>
    </tr>
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
  await sendEmail({
    purpose: "sign-in",
    from: provider.from ?? signInSender(),
    to: identifier,
    subject: "Your SEJSCC volunteer portal sign-in link",
    html: buildHtml(url, expires),
    text: buildText(url, expires),
  });
}
