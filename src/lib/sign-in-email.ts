import type { EmailProviderSendVerificationRequestParams } from "next-auth/providers/email";
import { CENTER_ADDRESS } from "@/lib/center";

const SENDER_NAME = "SEJSCC Volunteer Portal";
const FALLBACK_SENDER = `${SENDER_NAME} <onboarding@resend.dev>`;
const CENTER_TIME_ZONE = "America/Los_Angeles";
const PORTFOLIO_URL = "https://www.variationsonastring.com";
// Mail clients ignore writing-mode, so the plaque stacks one character per line;
// the long-vowel mark is the upright form vertical text would use.
const PLAQUE_NAME = [..."サウスイ｜スト日本語学園"];

// Mail clients can't read the @theme tokens in globals.css, so the palette is
// repeated here as literal hex. Keep these in sync with globals.css.
const COLOR = {
  ink: "#14304f",
  inkDeep: "#0e2540",
  navy: "#12365f",
  inkSoft: "#46617d",
  stone: "#4f6d8f",
  indigo: "#1e63b0",
  sky: "#8fc1f0",
  blossom: "#f2a3c8",
  magenta: "#b02d76",
  gold: "#ae9665",
  // gold at 55% over cream, like the inner rule of .school-plaque
  goldSoft: "#d3c2a5",
  cream: "#fff8f3",
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

function buildText(url: string, expires: Date) {
  const expiry = formatExpiry(expires);
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

function expiryParts(expires: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: CENTER_TIME_ZONE,
  }).formatToParts(expires);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return { month: part("month").toUpperCase(), day: part("day") };
}

function spacer(height: number) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="${height}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr></table>`;
}

function buildHtml(url: string, expires: Date) {
  const safeUrl = escapeHtml(url);
  const safeExpiry = escapeHtml(formatExpiry(expires));
  const { month, day } = expiryParts(expires);
  // Built from the sign-in link's origin, not SITE_URL — that one still points
  // at the old WordPress host.
  const origin = new URL(url).origin;
  const asset = (path: string) => escapeHtml(`${origin}${path}`);
  const plaqueCharacters = PLAQUE_NAME.map(
    (character) => `${character}<br>`
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your SEJSCC sign-in link</title>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;700&family=Shippori+Mincho:wght@500;700&family=Zen+Maru+Gothic:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  @media (max-width: 620px) {
    .wrap { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .headline { font-size: 30px !important; line-height: 38px !important; }
    .wordmark { font-size: 11px !important; letter-spacing: 0.5px !important; line-height: 16px !important; }
    .kicker-ja { font-size: 12px !important; letter-spacing: 1px !important; padding-right: 8px !important; }
    .kicker-rule { width: 20px !important; }
    .kicker-en { font-size: 11px !important; letter-spacing: 1px !important; padding-left: 8px !important; }
  }
  /* The plaque needs about 90px beside the headline; below this width the headline would wrap word by word. */
  @media (max-width: 480px) {
    .plaque { display: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.mist};color-scheme:light;font-family:${BODY_FONT};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLOR.mist};mso-hide:all;">Your one-time sign-in link for the SEJSCC volunteer portal — it works once and expires ${safeExpiry}.</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLOR.mist};">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:100%;max-width:600px;border-collapse:separate;">

    <tr>
      <td style="border-radius:14px 14px 0 0;overflow:hidden;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="45%" height="5" bgcolor="${COLOR.indigo}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;border-radius:14px 0 0 0;">&nbsp;</td>
            <td width="35%" height="5" bgcolor="${COLOR.sky}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td>
            <td width="20%" height="5" bgcolor="${COLOR.magenta}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;border-radius:0 14px 0 0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td bgcolor="${COLOR.navy}" background="${asset("/email/seigaiha-navy.png")}" style="background-color:${COLOR.navy};background-image:url('${asset("/email/seigaiha-navy.png")}');background-repeat:repeat;background-size:160px 80px;background-position:center top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td class="px" style="padding:32px 44px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:14px;">
                    <img src="${asset("/logo-mark-white.png")}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border:0;">
                  </td>
                  <td valign="middle" class="wordmark" style="font-family:${DISPLAY_FONT};font-size:13px;font-weight:700;letter-spacing:1px;line-height:18px;mso-line-height-rule:exactly;text-transform:uppercase;color:${COLOR.white};">
                    Southeast Japanese School<br>&amp; Community Center
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:36px 44px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="top">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td lang="ja" class="kicker-ja" style="white-space:nowrap;font-family:${ACCENT_FONT};font-size:14px;font-weight:700;letter-spacing:3px;color:${COLOR.sky};padding-right:12px;">ボランティア</td>
                        <td width="36" class="kicker-rule" style="font-size:0;mso-line-height-rule:exactly;line-height:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" bgcolor="${COLOR.sky}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td></tr></table></td>
                        <td class="kicker-en" style="white-space:nowrap;font-family:${DISPLAY_FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${COLOR.sky};padding-left:12px;">Volunteer Portal</td>
                      </tr>
                    </table>
                    <h1 class="headline" style="margin:18px 0 0;font-family:${DISPLAY_FONT};font-size:38px;line-height:46px;mso-line-height-rule:exactly;font-weight:400;letter-spacing:0.5px;color:${COLOR.white};">Welcome back.<br><span style="color:${COLOR.sky};">Here's your sign-in link.</span></h1>
                    <p style="margin:16px 0 0;font-family:${BODY_FONT};font-size:17px;line-height:28px;mso-line-height-rule:exactly;color:${COLOR.sky};">One tap and you're in — no password needed.</p>
                  </td>
                  <td valign="top" align="right" width="72" aria-hidden="true" class="plaque" style="padding-left:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="52" bgcolor="${COLOR.cream}" style="background-color:${COLOR.cream};border:1px solid ${COLOR.gold};">
                      <tr>
                        <td align="center" lang="ja" style="padding:4px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${COLOR.goldSoft};">
                            <tr>
                              <td align="center" style="padding:12px 0 10px;font-family:${ACCENT_FONT};font-size:17px;font-weight:700;line-height:21px;mso-line-height-rule:exactly;color:${COLOR.inkDeep};">${plaqueCharacters}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="52" bgcolor="${COLOR.magenta}" style="background-color:${COLOR.magenta};margin-top:-6px;border:2px solid ${COLOR.cream};">
                      <tr>
                        <td align="center" style="padding:6px 0;font-family:${ACCENT_FONT};font-size:11px;font-weight:700;line-height:15px;mso-line-height-rule:exactly;letter-spacing:1px;color:${COLOR.white};">EST.<br><span style="font-size:15px;letter-spacing:0;">1925</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="font-size:0;line-height:0;">
              <img src="${asset("/email/wave-edge.png")}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td bgcolor="${COLOR.paper}" class="px" style="padding:12px 44px 40px;">

        <p style="margin:0;font-family:${BODY_FONT};font-size:17px;line-height:29px;mso-line-height-rule:exactly;color:${COLOR.inkSoft};">Hello — you asked to sign in to the SEJSCC volunteer portal. Tap the button below to go straight to your dashboard.</p>

        ${spacer(28)}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" bgcolor="${COLOR.indigo}" style="border-radius:10px;box-shadow:0 9px 20px rgba(30,99,176,0.25);mso-padding-alt:20px 20px;">
              <a href="${safeUrl}" style="display:block;padding:20px;font-family:${DISPLAY_FONT};font-size:19px;font-weight:700;letter-spacing:0.5px;line-height:24px;color:${COLOR.white};text-decoration:none;border-radius:10px;">Sign in to the volunteer portal&nbsp;&nbsp;&rarr;</a>
            </td>
          </tr>
        </table>
        ${spacer(28)}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${COLOR.cream}" style="background-color:${COLOR.cream};border:1px solid ${COLOR.goldSoft};border-radius:12px;">
          <tr>
            <td valign="middle" width="64" aria-hidden="true" style="padding:18px 0 18px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="64" style="border:1px solid ${COLOR.gold};border-radius:6px;border-collapse:separate;background-color:${COLOR.white};">
                <tr>
                  <td align="center" bgcolor="${COLOR.magenta}" style="padding:5px 0 4px;border-radius:5px 5px 0 0;font-family:${DISPLAY_FONT};font-size:12px;font-weight:700;letter-spacing:2px;line-height:14px;mso-line-height-rule:exactly;color:${COLOR.white};">${month}</td>
                </tr>
                <tr>
                  <td align="center" style="padding:4px 0 6px;font-family:${DISPLAY_FONT};font-size:30px;font-weight:500;line-height:36px;mso-line-height-rule:exactly;color:${COLOR.ink};">${day}</td>
                </tr>
              </table>
            </td>
            <td valign="middle" style="padding:18px 22px 18px 18px;font-family:${BODY_FONT};font-size:15px;line-height:24px;mso-line-height-rule:exactly;color:${COLOR.inkSoft};">
              This link works <strong style="color:${COLOR.ink};">once</strong> and expires <strong style="color:${COLOR.ink};">${safeExpiry}</strong>. It signs you in on the device where you open it.
            </td>
          </tr>
        </table>

        <p style="margin:28px 0 0;font-family:${BODY_FONT};font-size:14px;line-height:23px;mso-line-height-rule:exactly;color:${COLOR.stone};">Button not working? Copy and paste this link into your browser:<br>
          <a href="${safeUrl}" style="color:${COLOR.indigo};text-decoration:underline;word-break:break-all;">${safeUrl}</a>
        </p>

        ${spacer(28)}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="40" height="2" bgcolor="${COLOR.gold}" style="font-size:0;mso-line-height-rule:exactly;line-height:0;">&nbsp;</td>
            <td height="2" style="font-size:0;mso-line-height-rule:exactly;line-height:0;border-bottom:1px solid ${COLOR.line};">&nbsp;</td>
          </tr>
        </table>
        ${spacer(22)}

        <p style="margin:0;font-family:${BODY_FONT};font-size:14px;line-height:23px;mso-line-height-rule:exactly;color:${COLOR.stone};"><strong style="color:${COLOR.ink};">Didn't request this?</strong> You can safely ignore this email — the link only works for someone with access to your inbox.</p>
      </td>
    </tr>

    <tr>
      <td bgcolor="${COLOR.inkDeep}" class="px" style="padding:28px 44px 30px;border-radius:0 0 14px 14px;border-top:3px solid ${COLOR.gold};">
        <p style="margin:0 0 8px;font-family:${ACCENT_FONT};font-size:16px;line-height:24px;color:${COLOR.sky};"><strong lang="ja" style="color:${COLOR.white};">おかえりなさい</strong> <span style="font-family:${BODY_FONT};font-size:13px;">— welcome back</span></p>
        <p style="margin:0;font-family:${BODY_FONT};font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:${COLOR.sky};">Southeast Japanese School &amp; Community Center · Est. 1925<br>${CENTER_ADDRESS}</p>
        <p style="margin:12px 0 0;font-family:${BODY_FONT};font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:${COLOR.sky};">You received this because a sign-in link was requested for your volunteer account.</p>
        <p style="margin:8px 0 0;font-family:${BODY_FONT};font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:${COLOR.sky};">Made with <span style="color:${COLOR.blossom};">&#10084;</span> by <a href="${PORTFOLIO_URL}" style="color:${COLOR.sky};font-weight:500;text-decoration:underline;">Variations on a String</a></p>
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
      html: buildHtml(url, expires),
      text: buildText(url, expires),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend rejected the sign-in email (${response.status}): ${await response.text()}`
    );
  }
}
