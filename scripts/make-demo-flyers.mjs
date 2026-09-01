// Draws a stand-in flyer for every demo event without a real one, to
// materials/demo-flyers/<slug>.pdf where seed-demo-events.mjs looks for it.
// Renders by printing HTML from headless Chrome, so macOS-only.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { CENTER, DEMO_EVENTS } from "./demo-events.mjs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = path.join("materials", "demo-flyers");

const SAMPLE_NOTE = "Sample flyer — website demonstration only";

// The system mincho, not the site's Shippori Mincho: embedding the webfont
// chunks bloats each sheet and looks the same at watermark size.
const JP_SERIF = '"Hiragino Mincho ProN", "Yu Mincho", serif';

const PHONE = "(562) 863-5996";
const ORG = "Southeast Japanese School & Community Center";

// Mirrors the @theme palette in src/app/globals.css; copied because .mjs can't
// import CSS. Re-check it against the theme when the site's colors change.
const COLOR = {
  paper: "#fcfdff",
  mist: "#f1f6fd",
  cream: "#fff8f3",
  celadon: "#d9eee7",
  peach: "#ffe0ce",
  lilac: "#e9e3fb",
  ink: "#14304f",
  inkSoft: "#46617d",
  indigo: "#1e63b0",
  indigoDeep: "#14498a",
  sky: "#8fc1f0",
  magenta: "#b02d76",
  magentaDeep: "#8f2560",
  blossom: "#f2a3c8",
  gold: "#ae9665",
  sand: "#f3e7d3",
  navy: "#12365f",
  inkDeep: "#0e2540",
};

// `dark` flips the sheet to light type on a deep ground.
const KINDS = {
  festival: {
    kicker: "イベント案内",
    kanji: "祭",
    background: COLOR.cream,
    accent: COLOR.magenta,
    rule: COLOR.blossom,
  },
  tradition: {
    kicker: "季節の行事",
    kanji: "和",
    background: COLOR.lilac,
    accent: COLOR.indigoDeep,
    rule: COLOR.indigo,
  },
  school: {
    kicker: "学園より",
    kanji: "学",
    background: COLOR.mist,
    accent: COLOR.indigo,
    rule: COLOR.sky,
  },
  sports: {
    kicker: "大会のご案内",
    kanji: "武",
    background: COLOR.navy,
    accent: COLOR.sand,
    rule: COLOR.gold,
    dark: true,
  },
  food: {
    kicker: "お食事会",
    kanji: "食",
    background: COLOR.peach,
    accent: COLOR.magentaDeep,
    rule: COLOR.magenta,
  },
  market: {
    kicker: "手づくり市",
    kanji: "市",
    background: COLOR.celadon,
    accent: COLOR.indigoDeep,
    rule: COLOR.gold,
  },
  music: {
    kicker: "演奏会",
    kanji: "音",
    background: COLOR.inkDeep,
    accent: COLOR.blossom,
    rule: COLOR.sky,
    dark: true,
  },
  bingo: {
    kicker: "ビンゴ大会",
    kanji: "福",
    background: COLOR.sand,
    accent: COLOR.magenta,
    rule: COLOR.gold,
  },
  community: {
    kicker: "みんなでご一緒に",
    kanji: "縁",
    background: COLOR.paper,
    accent: COLOR.indigo,
    rule: COLOR.gold,
  },
};

// Chrome rasterises a whole page that carries a transparency group, so tints
// are mixed into flat colours up front and no opacity is used on the sheet.
function mix(color, onto, amount) {
  const parse = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r, g, b] = parse(color);
  const [br, bg, bb] = parse(onto);
  const blend = (a, b2) => Math.round(a * amount + b2 * (1 - amount));
  return `#${[blend(r, br), blend(g, bg), blend(b, bb)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

// Real fills rather than the site's CSS mask: Chrome's print path renders a
// masked background only where it first rasterizes it, stranding the pattern.
const SEIGAIHA_OFFSETS = [
  [0, 0], [80, 0], [160, 0],
  [-40, 20], [40, 20], [120, 20], [200, 20],
  [0, 40], [80, 40], [160, 40],
  [-40, 60], [40, 60], [120, 60], [200, 60],
];

function seigaihaSvg(ringColor, discColor) {
  const uses = SEIGAIHA_OFFSETS.map(
    ([x, y]) => `<use href="#ring" x="${x}" y="${y}"/>`
  ).join("");
  return `<svg class="waves" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <g id="ring">
          <circle r="40" fill="${discColor}"/>
          <g fill="none" stroke="${ringColor}" stroke-width="2">
            <circle r="40"/><circle r="30"/><circle r="20"/><circle r="10"/>
          </g>
        </g>
        <pattern id="seigaiha" width="160" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(0.38)">${uses}</pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#seigaiha)"/>
    </svg>`;
}

function logoDataUri(dark) {
  const file = dark ? "logo-mark-white.png" : "logo-mark.png";
  const bytes = readFileSync(path.join("public", file));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const LOGO = { light: logoDataUri(false), dark: logoDataUri(true) };

/** Dates are plain calendar strings here, so they format in UTC. */
function parseDay(date) {
  return new Date(`${date}T12:00:00Z`);
}

function formatDate(date) {
  return parseDay(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function lead(description) {
  if (!description) return null;
  const sentences = description.split("\n\n")[0].match(/[^.!?]+[.!?]+/g);
  if (!sentences) return null;
  let text = "";
  for (const sentence of sentences) {
    if (text.length + sentence.length > 190) break;
    text += sentence;
  }
  return (text || sentences[0]).trim();
}

const TALL_TITLE = (title) => (title.length > 38 ? "40pt" : "50pt");
const WIDE_TITLE = (title) =>
  title.length > 38 ? "33pt" : title.length > 26 ? "38pt" : "44pt";

const ORDINALS = ["First", "Second", "Third", "Fourth", "Fifth"];

/** Mirrors describeRepeat() in src/lib/recurrence.ts. */
function repeatLine(event) {
  if (!event.repeat || event.repeat === "none") return null;
  const day = parseDay(event.date);
  const weekday = day.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  if (event.repeat === "monthly") {
    return `${ORDINALS[Math.ceil(day.getUTCDate() / 7) - 1]} ${weekday} of the month`;
  }
  return event.repeat === "weekly" ? `Every ${weekday}` : `Every other ${weekday}`;
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
}

function flyerHtml(event) {
  const kind = KINDS[event.kind] ?? KINDS.community;
  const text = kind.dark ? COLOR.sand : COLOR.ink;
  const soft = kind.dark ? COLOR.sky : COLOR.inkSoft;
  const card = mix("#ffffff", kind.background, kind.dark ? 0.06 : 0.62);

  const repeats = repeatLine(event);
  const times = [event.start, event.end].filter(Boolean).map(formatTime).join(" – ");
  const [venue, ...address] = (event.location ?? CENTER).split(", ");
  const atCenter = (event.location ?? CENTER) === CENTER;

  const wide = Boolean(event.wide);
  const page = wide ? { width: "10in", height: "8in" } : { width: "8in", height: "10in" };

  const kicker = `<div class="kicker">${kind.kicker}</div>`;
  const heading = `<h1>${escapeHtml(event.title)}</h1>`;
  const leadText = lead(event.description);
  const leadBlock = leadText ? `<p class="lead">${escapeHtml(leadText)}</p>` : "";
  const when = `<div class="when">
        ${repeats ? `<div class="repeats">${repeats}</div>` : ""}
        <div class="date">${formatDate(event.date)}</div>
        ${times ? `<div class="time">${times}</div>` : ""}
      </div>`;
  const where = `<div class="where">
        <img src="${kind.dark ? LOGO.dark : LOGO.light}" alt="">
        <div>
          <div class="venue">${escapeHtml(atCenter ? ORG : venue)}</div>
          <div class="address">${escapeHtml(atCenter ? CENTER : address.join(", "))}</div>
        </div>
      </div>`;
  const signup = event.signup
    ? `<div class="signup">Sign up online<span>${escapeHtml(event.signup)}</span></div>`
    : "";
  const footer = `<footer>
        <span>sejscc.org · ${PHONE}</span>
        <span class="sample">${SAMPLE_NOTE}</span>
      </footer>`;

  const layout = wide
    ? `<div class="body wide">
      <div class="main">${kicker}${heading}${leadBlock}</div>
      <div class="side">${when}${signup}</div>
      <div class="foot">${where}${footer}</div>
    </div>`
    : `<div class="body">${kicker}${heading}${leadBlock}${when}${where}${signup}${footer}</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Zen+Maru+Gothic:wght@400;500&display=swap" rel="stylesheet">
<style>
  @page { size: ${page.width} ${page.height}; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${page.width}; height: ${page.height};
    font-family: "Zen Maru Gothic", sans-serif;
    color: ${text};
    background: ${kind.background};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    position: relative; width: 100%; height: 100%;
    padding: 0.55in; display: flex; flex-direction: column;
    border: 0.16in solid ${kind.rule};
    overflow: hidden;
  }
  .waves { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
  .kanji {
    position: absolute; z-index: 0;
    ${wide ? "right: -0.3in; top: 2.7in; font-size: 3.2in;" : "right: -0.35in; top: 3.25in; font-size: 4in;"}
    font-family: ${JP_SERIF}; line-height: 1;
    color: ${mix(kind.accent, kind.background, kind.dark ? 0.2 : 0.14)};
  }
  .body { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
  .body.wide {
    display: grid; height: 100%;
    grid-template-columns: 1.1fr 1fr;
    grid-template-rows: 1fr auto;
    column-gap: 0.5in;
  }
  .body.wide .main { min-width: 0; }
  .body.wide .side {
    display: flex; flex-direction: column; justify-content: center;
    padding-top: 0.5in;
  }
  .body.wide .foot { grid-column: 1 / -1; }
  .kicker {
    display: flex; align-items: center; gap: 0.16in;
    font-family: ${JP_SERIF}; font-size: 15pt; color: ${kind.accent};
  }
  .kicker::after { content: ""; flex: 1; height: 2px; background: ${kind.rule}; }
  h1 {
    margin-top: 0.26in;
    font-family: "Jost", "Zen Maru Gothic", sans-serif;
    font-weight: 500; font-size: ${(wide ? WIDE_TITLE : TALL_TITLE)(event.title)};
    line-height: 1.06; letter-spacing: -0.01em;
  }
  .lead {
    margin-top: 0.24in; max-width: ${wide ? "100%" : "5.4in"};
    font-size: ${wide ? "14pt" : "15pt"}; line-height: 1.55; color: ${soft};
  }
  .when {
    margin-top: ${wide ? "0" : "0.55in"};
    font-family: "Jost", sans-serif; font-weight: 500;
  }
  .date {
    font-size: ${wide ? "23pt" : "30pt"}; line-height: 1.15; color: ${kind.accent};
    text-wrap: balance;
  }
  .repeats {
    display: inline-block; margin-bottom: 0.12in; padding: 0.07in 0.18in;
    border-radius: 0.6in; background: ${kind.accent}; color: ${kind.dark ? COLOR.inkDeep : "#ffffff"};
    font-size: 14pt; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .time { margin-top: 0.06in; font-size: ${wide ? "19pt" : "22pt"}; color: ${text}; }
  .where {
    margin-top: ${wide ? "0" : "auto"}; padding: 0.24in 0.28in; border-radius: 0.14in;
    background: ${card}; border: 1px solid ${kind.rule};
    display: flex; align-items: center; gap: 0.24in;
  }
  .where img { width: 0.85in; height: 0.85in; object-fit: contain; flex: none; }
  .venue { font-family: "Jost", sans-serif; font-weight: 600; font-size: 15pt; line-height: 1.35; }
  .address { margin-top: 0.04in; font-size: 13pt; color: ${soft}; line-height: 1.35; }
  .signup {
    margin-top: 0.22in; padding: 0.16in 0.24in; border-radius: 0.14in;
    background: ${kind.accent}; color: ${kind.dark ? COLOR.inkDeep : "#ffffff"};
    font-family: "Jost", sans-serif; font-weight: 600; font-size: 15pt;
  }
  .signup span { display: block; margin-top: 0.03in; font-weight: 400; font-size: 12pt; word-break: break-all; }
  footer {
    margin-top: 0.26in; display: flex; justify-content: space-between; align-items: baseline;
    font-family: "Jost", sans-serif; font-size: 11pt; color: ${soft};
  }
  .sample { font-size: 9pt; }
</style>
</head>
<body>
  <div class="sheet">
    ${seigaihaSvg(mix(kind.accent, kind.background, kind.dark ? 0.13 : 0.09), kind.background)}
    <div class="kanji">${kind.kanji}</div>
    ${layout}
  </div>
</body>
</html>`;
}

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const events = DEMO_EVENTS.filter(
  (event) => !event.flyer && event.date && (!only.length || only.includes(event.slug))
);

mkdirSync(OUT_DIR, { recursive: true });

const workDir = mkdtempSync(path.join(tmpdir(), "sejscc-flyer-"));

let drawn = 0;
for (const event of events) {
  const html = path.join(workDir, `${event.slug}.html`);
  const pdf = path.join(OUT_DIR, `${event.slug}.pdf`);
  writeFileSync(html, flyerHtml(event));
  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=6000",
      `--print-to-pdf=${pdf}`,
      `file://${path.resolve(html)}`,
    ],
    { stdio: "ignore" }
  );
  drawn += 1;
  console.log(`  drew ${event.slug}.pdf`);
}

console.log(`Drew ${drawn} flyer(s) into ${OUT_DIR}.`);
