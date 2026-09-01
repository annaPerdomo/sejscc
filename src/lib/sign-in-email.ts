import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email";
import { CENTER_ADDRESS } from "@/lib/center";

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
  sky: "#8fc1f0",
  blossom: "#f2a3c8",
  magenta: "#b02d76",
  line: "#d3e4f4",
  mist: "#f1f6fd",
  paper: "#fcfdff",
  white: "#ffffff",
};

const BODY_FONT =
  "'Zen Maru Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Yu Gothic', Helvetica, Arial, sans-serif";
const DISPLAY_FONT = `'Jost', ${BODY_FONT}`;
const ACCENT_FONT =
  "'Shippori Mincho', 'Yu Mincho', 'Hiragino Mincho ProN', Georgia, serif";

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
    "Here's your sign-in link — SEJSCC Volunteer Portal",
    "",
    "Hello — you asked to sign in to the SEJSCC volunteer portal. Open this",
    "link and you're in. No password needed.",
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
    "You received this because a sign-in link was requested for your",
    "volunteer account.",
    `Made with love by Variations on a String — ${PORTFOLIO_URL}`,
  ].join("\n");
}

function buildHtml(url: string, expiry: string) {
  const safeUrl = escapeHtml(url);
  const safeExpiry = escapeHtml(expiry);
  // Built from the sign-in link's origin, not SITE_URL — that one still points
  // at the old WordPress host.
  const logoUrl = escapeHtml(`${new URL(url).origin}/logo-mark-white.png`);

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
    .wordmark { font-size: 11px !important; letter-spacing: 0.5px !important; line-height: 16px !important; }
    .kanji { font-size: 34px !important; line-height: 34px !important; }
    .kicker-en { font-size: 10px !important; letter-spacing: 1px !important; }
  }
  /* Any narrower and the crest, wordmark and kanji can't share a row without the center's name wrapping to four lines. */
  @media (max-width: 359px) {
    .kanji { display: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.mist};color-scheme:light;font-family:${BODY_FONT};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLOR.mist};mso-hide:all;">Your one-time sign-in link for the SEJSCC volunteer portal — it works once and expires ${safeExpiry}.</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLOR.mist};">
<tr><td align="center" style="padding:36px 12px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:100%;max-width:600px;border-collapse:collapse;">

    <tr>
      <td style="border-radius:12px 12px 0 0;overflow:hidden;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="45%" height="5" bgcolor="${COLOR.indigo}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;border-radius:12px 0 0 0;">&nbsp;</td>
            <td width="35%" height="5" bgcolor="${COLOR.sky}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td>
            <td width="20%" height="5" bgcolor="${COLOR.magenta}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;border-radius:0 12px 0 0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td bgcolor="${COLOR.ink}" class="px" style="padding:30px 44px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:14px;">
                    <img src="${logoUrl}" alt="" width="44" height="44" style="display:block;width:44px;height:44px;border:0;">
                  </td>
                  <td valign="middle" class="wordmark" style="font-family:${DISPLAY_FONT};font-size:12px;font-weight:700;letter-spacing:1px;line-height:17px;mso-line-height-rule:exactly;text-transform:uppercase;color:${COLOR.white};">
                    Southeast Japanese School<br>&amp; Community Center
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle" align="right" aria-hidden="true" class="kanji" style="font-family:${ACCENT_FONT};font-size:44px;line-height:44px;mso-line-height-rule:exactly;color:${COLOR.stone};">絆</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td bgcolor="${COLOR.paper}" class="px" style="padding:44px 44px 40px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td aria-hidden="true" style="font-family:${ACCENT_FONT};font-size:13px;font-weight:700;letter-spacing:3px;color:${COLOR.indigo};padding-right:12px;">ボランティア</td>
            <td width="38" style="font-size:0;mso-line-height-rule:exactly;line-height:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="38"><tr><td height="1" bgcolor="${COLOR.indigo}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr></table></td>
            <td class="kicker-en" style="font-family:${DISPLAY_FONT};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${COLOR.stone};padding-left:12px;">Volunteer Portal</td>
          </tr>
        </table>

        <h1 style="margin:18px 0 0;font-family:${DISPLAY_FONT};font-size:28px;line-height:38px;mso-line-height-rule:exactly;font-weight:400;letter-spacing:1px;text-transform:uppercase;color:${COLOR.ink};">Here's your <span style="color:${COLOR.indigo};">sign-in link</span></h1>

        <p style="margin:16px 0 0;font-family:${BODY_FONT};font-size:15px;line-height:26px;mso-line-height-rule:exactly;color:${COLOR.inkSoft};">Hello — you asked to sign in to the SEJSCC volunteer portal. Tap the button below and you're in. No password needed.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr><td height="30" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td align="center" bgcolor="${COLOR.indigo}" style="border-radius:8px;mso-padding-alt:16px 20px;">
              <a href="${safeUrl}" style="display:block;padding:16px 20px;font-family:${DISPLAY_FONT};font-size:16px;font-weight:700;letter-spacing:0.5px;color:${COLOR.white};text-decoration:none;border-radius:8px;">Sign in to the volunteer portal</a>
            </td>
          </tr>
          <tr><td height="26" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${COLOR.mist}" style="border:1px solid ${COLOR.line};border-radius:10px;">
          <tr>
            <td valign="middle" style="padding:18px 20px;font-family:${BODY_FONT};font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:${COLOR.inkSoft};">
              This link works <strong style="color:${COLOR.ink};">once</strong> and expires <strong style="color:${COLOR.ink};">${safeExpiry}</strong>. It signs you in on the device where you open it.
            </td>
          </tr>
        </table>

        <p style="margin:26px 0 0;font-family:${BODY_FONT};font-size:13px;line-height:22px;mso-line-height-rule:exactly;color:${COLOR.stone};">Button not working? Copy and paste this link into your browser:<br>
          <a href="${safeUrl}" style="color:${COLOR.indigo};text-decoration:underline;word-break:break-all;">${safeUrl}</a>
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr><td height="28" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr>
          <tr><td height="1" bgcolor="${COLOR.line}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr>
          <tr><td height="24" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr>
        </table>

        <p style="margin:0;font-family:${BODY_FONT};font-size:13px;line-height:22px;mso-line-height-rule:exactly;color:${COLOR.stone};">Didn't request this? You can safely ignore this email — the link only works for someone with access to your inbox.</p>
      </td>
    </tr>

    <tr>
      <td bgcolor="${COLOR.ink}" class="px" style="padding:26px 44px 30px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 6px;font-family:${ACCENT_FONT};font-size:14px;line-height:22px;color:${COLOR.sky};"><strong lang="ja" style="color:${COLOR.white};">おかえりなさい</strong> <span style="font-family:${BODY_FONT};font-size:12.5px;">— welcome back</span></p>
        <p style="margin:0;font-family:${BODY_FONT};font-size:12px;line-height:20px;mso-line-height-rule:exactly;color:${COLOR.sky};">Southeast Japanese School &amp; Community Center · Est. 1925<br>${CENTER_ADDRESS}</p>
        <p style="margin:12px 0 0;font-family:${BODY_FONT};font-size:12px;line-height:20px;mso-line-height-rule:exactly;color:${COLOR.sky};">You received this because a sign-in link was requested for your volunteer account.</p>
        <p style="margin:8px 0 0;font-family:${BODY_FONT};font-size:12px;line-height:20px;mso-line-height-rule:exactly;color:${COLOR.sky};">Made with <span style="color:${COLOR.blossom};">&#10084;</span> by <a href="${PORTFOLIO_URL}" style="color:${COLOR.sky};font-weight:500;text-decoration:underline;">Variations on a String</a></p>
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
      subject: "Your SEJSCC volunteer portal sign-in link",
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
