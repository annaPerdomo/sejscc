export type FlyerLettering = {
  title: string;
  kicker: string | null;
  when: string | null;
  where: string | null;
  badge: { month: string; day: string } | null;
};

const WIDTH = 1200;
const HEIGHT = 1500;
const MARGIN = 88;
const FADE = 260;
const TITLE_SIZES = [112, 100, 88, 76, 64];
const TITLE_MAX_LINES = 3;
const DETAIL_MAX_LINES = 2;
const RULE_WIDTH = 120;
const CARD_INSET = 48;
const CARD_PADDING = 56;
const BADGE_SIZE = 200;
const BADGE_MONTH_HEIGHT = 64;
const BLOSSOM_TEXT_WIDTH = 640;
const BLOSSOM_MIN_RADIUS = 400;
const BLOSSOM_BOTTOM = 72;
const JPEG_QUALITY = 0.9;

type Scheme = {
  surface: string;
  title: string;
  when: string;
  where: string;
  kicker: string;
};

// Every pairing clears WCAG AA against the @theme values; re-check if a
// token or a pairing changes.
const DARK_SCHEMES: Scheme[] = [
  { surface: "text-navy", title: "text-white", when: "text-sky", where: "text-white", kicker: "text-blossom" },
  { surface: "text-ink-deep", title: "text-white", when: "text-blossom", where: "text-white", kicker: "text-sky" },
  { surface: "text-magenta-deep", title: "text-white", when: "text-sky", where: "text-white", kicker: "text-blossom" },
  { surface: "text-indigo-deep", title: "text-white", when: "text-sky", where: "text-white", kicker: "text-blossom" },
];

const LIGHT_SCHEMES: Scheme[] = [
  { surface: "text-paper", title: "text-navy", when: "text-magenta-deep", where: "text-ink-soft", kicker: "text-indigo-deep" },
  { surface: "text-mist", title: "text-ink", when: "text-indigo-deep", where: "text-ink-soft", kicker: "text-magenta-deep" },
  { surface: "text-azure", title: "text-navy", when: "text-magenta-deep", where: "text-ink-soft", kicker: "text-indigo-deep" },
  { surface: "text-lilac", title: "text-navy", when: "text-magenta-deep", where: "text-ink-soft", kicker: "text-indigo-deep" },
  { surface: "text-cream", title: "text-ink", when: "text-indigo-deep", where: "text-ink-soft", kicker: "text-magenta-deep" },
];

const TITLE_FACES = [
  { face: "font-display", weight: 600 },
  { face: "font-accent", weight: 700 },
  { face: "font-sans", weight: 700 },
];

const LAYOUTS = ["band", "badge", "mat", "card", "blossom"] as const;
type Layout = (typeof LAYOUTS)[number];

type Look = {
  layout: Layout;
  centered: boolean;
  scheme: Scheme;
  titleFace: (typeof TITLE_FACES)[number];
};

// A picture's look is worked out from its address rather than stored, so
// re-lettering it after a date change keeps the same layout and colors.
function lookFor(artUrl: string): Look {
  let hash = 2166136261;
  for (let i = 0; i < artUrl.length; i++) {
    hash = Math.imul(hash ^ artUrl.charCodeAt(i), 16777619) >>> 0;
  }
  const layout = LAYOUTS[hash % LAYOUTS.length];
  const light = layout === "card" || (layout === "mat" && (hash >>> 2) % 2 === 0);
  const schemes = light ? LIGHT_SCHEMES : DARK_SCHEMES;
  return {
    layout,
    centered: layout === "blossom" || (layout !== "badge" && (hash >>> 3) % 2 === 0),
    scheme: schemes[(hash >>> 4) % schemes.length],
    titleFace: TITLE_FACES[(hash >>> 9) % TITLE_FACES.length],
  };
}

// Canvas can't read Tailwind classes, so colors and faces come from a probe.
function themed(className: string) {
  const probe = document.createElement("span");
  probe.className = className;
  document.body.append(probe);
  const { color, fontFamily } = getComputedStyle(probe);
  probe.remove();
  return { color, fontFamily };
}

function withAlpha(rgb: string, alpha: number) {
  return rgb.replace(/^rgb\((.*)\)$/, `rgba($1, ${alpha})`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The flyer picture couldn’t be loaded."));
    image.src = src;
  });
}

const CJK_RUN = /^[\p{scx=Han}\p{scx=Hira}\p{scx=Kana}]+$/u;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  // Japanese has no spaces: an over-long run may break between any characters.
  const tokens = (text.match(/[\p{scx=Han}\p{scx=Hira}\p{scx=Kana}]+|[^\s\p{scx=Han}\p{scx=Hira}\p{scx=Kana}]+|\s+/gu) ?? []).flatMap(
    (token) => (CJK_RUN.test(token) && ctx.measureText(token).width > maxWidth ? [...token] : [token])
  );
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    if (line.trim() && ctx.measureText(next.trimEnd()).width > maxWidth) {
      lines.push(line.trimEnd());
      line = token.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function fitTitle(ctx: CanvasRenderingContext2D, title: string, font: (size: number) => string, maxWidth: number) {
  for (const size of TITLE_SIZES) {
    ctx.font = font(size);
    const lines = wrap(ctx, title, maxWidth);
    if (lines.length <= TITLE_MAX_LINES) return { size, lines };
  }
  const size = TITLE_SIZES[TITLE_SIZES.length - 1];
  ctx.font = font(size);
  const lines = wrap(ctx, title, maxWidth).slice(0, TITLE_MAX_LINES);
  lines[TITLE_MAX_LINES - 1] = `${lines[TITLE_MAX_LINES - 1]}…`;
  return { size, lines };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, x + (width - drawnWidth) / 2, y + (height - drawnHeight) / 2, drawnWidth, drawnHeight);
  ctx.restore();
}

type Row = { text: string; font: string; color: string; baseline: number };

function textBlock(ctx: CanvasRenderingContext2D, lettering: FlyerLettering, look: Look, maxWidth: number) {
  const { scheme, titleFace } = look;
  const title = themed(`${scheme.title} ${titleFace.face}`);
  const when = themed(`${scheme.when} font-sans`);
  const where = themed(`${scheme.where} font-sans`);
  const kicker = themed(`${scheme.kicker} font-accent`);
  const titleFont = (size: number) => `${titleFace.weight} ${size}px ${title.fontFamily}`;

  const rows: Row[] = [];
  let y = 42;
  if (lettering.kicker) {
    rows.push({ text: lettering.kicker, font: `700 40px ${kicker.fontFamily}`, color: kicker.color, baseline: y + 32 });
    y += 58;
  }
  const fitted = fitTitle(ctx, lettering.title, titleFont, maxWidth);
  const leading = Math.round(fitted.size * 1.12);
  const ascent = Math.round(fitted.size * 0.8);
  fitted.lines.forEach((line, i) => {
    rows.push({ text: line, font: titleFont(fitted.size), color: title.color, baseline: y + ascent + i * leading });
  });
  y += ascent + (fitted.lines.length - 1) * leading + Math.round(fitted.size * 0.28);
  const details = [
    { text: lettering.when, font: `700 44px ${when.fontFamily}`, color: when.color, gap: 50, leading: 54 },
    { text: lettering.where, font: `500 36px ${where.fontFamily}`, color: where.color, gap: 42, leading: 44 },
  ];
  for (const detail of details) {
    if (!detail.text) continue;
    ctx.font = detail.font;
    const lines = wrap(ctx, detail.text, maxWidth).slice(0, DETAIL_MAX_LINES);
    lines.forEach((line, i) => {
      rows.push({ text: line, font: detail.font, color: detail.color, baseline: y + detail.gap + i * detail.leading });
    });
    y += detail.gap + (lines.length - 1) * detail.leading + 12;
  }
  return { rows, height: y };
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  rows: Row[],
  { x, top, maxWidth, centered }: { x: number; top: number; maxWidth: number; centered: boolean }
) {
  const anchor = centered ? x + maxWidth / 2 : x;
  ctx.fillStyle = themed("text-gold").color;
  ctx.fillRect(centered ? anchor - RULE_WIDTH / 2 : x, top, RULE_WIDTH, 6);
  ctx.textAlign = centered ? "center" : "start";
  for (const row of rows) {
    ctx.font = row.font;
    ctx.fillStyle = row.color;
    ctx.fillText(row.text, anchor, top + row.baseline, maxWidth);
  }
  ctx.textAlign = "start";
}

function drawBand(ctx: CanvasRenderingContext2D, image: HTMLImageElement, look: Look, surface: string, rows: Row[], height: number) {
  drawCover(ctx, image, 0, 0, WIDTH, HEIGHT);
  const top = HEIGHT - MARGIN - height;
  const bandTop = top - 56;
  const fade = ctx.createLinearGradient(0, bandTop - FADE, 0, bandTop);
  fade.addColorStop(0, withAlpha(surface, 0));
  fade.addColorStop(1, surface);
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandTop - FADE, WIDTH, FADE);
  ctx.fillStyle = surface;
  ctx.fillRect(0, bandTop, WIDTH, HEIGHT - bandTop);
  drawBlock(ctx, rows, { x: MARGIN, top, maxWidth: WIDTH - MARGIN * 2, centered: look.centered });
}

function drawBadge(ctx: CanvasRenderingContext2D, badge: { month: string; day: string }) {
  const month = themed("text-white font-display");
  const day = themed("text-ink font-display");
  ctx.save();
  ctx.shadowColor = withAlpha(themed("text-ink-deep").color, 0.35);
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = themed("text-paper").color;
  ctx.fillRect(MARGIN, MARGIN, BADGE_SIZE, BADGE_SIZE);
  ctx.restore();
  ctx.fillStyle = themed("text-magenta").color;
  ctx.fillRect(MARGIN, MARGIN, BADGE_SIZE, BADGE_MONTH_HEIGHT);
  ctx.textAlign = "center";
  ctx.font = `600 36px ${month.fontFamily}`;
  ctx.fillStyle = month.color;
  ctx.fillText(badge.month, MARGIN + BADGE_SIZE / 2, MARGIN + 46);
  ctx.font = `600 104px ${day.fontFamily}`;
  ctx.fillStyle = day.color;
  ctx.fillText(badge.day, MARGIN + BADGE_SIZE / 2, MARGIN + BADGE_MONTH_HEIGHT + 104);
  ctx.textAlign = "start";
}

function drawMat(ctx: CanvasRenderingContext2D, image: HTMLImageElement, look: Look, surface: string, rows: Row[], height: number) {
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const top = HEIGHT - MARGIN - height;
  const artHeight = top - MARGIN - 48;
  drawCover(ctx, image, MARGIN, MARGIN, WIDTH - MARGIN * 2, artHeight);
  ctx.strokeStyle = themed("text-gold").color;
  ctx.lineWidth = 4;
  ctx.strokeRect(MARGIN - 16, MARGIN - 16, WIDTH - MARGIN * 2 + 32, artHeight + 32);
  drawBlock(ctx, rows, { x: MARGIN, top, maxWidth: WIDTH - MARGIN * 2, centered: look.centered });
}

function drawCard(ctx: CanvasRenderingContext2D, image: HTMLImageElement, look: Look, surface: string, rows: Row[], height: number) {
  drawCover(ctx, image, 0, 0, WIDTH, HEIGHT);
  const cardHeight = height + CARD_PADDING * 2 - 24;
  const cardTop = HEIGHT - CARD_INSET - cardHeight;
  ctx.save();
  ctx.shadowColor = withAlpha(themed("text-ink-deep").color, 0.35);
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = surface;
  ctx.beginPath();
  ctx.roundRect(CARD_INSET, cardTop, WIDTH - CARD_INSET * 2, cardHeight, 32);
  ctx.fill();
  ctx.restore();
  const x = CARD_INSET + CARD_PADDING;
  drawBlock(ctx, rows, { x, top: cardTop + CARD_PADDING - 24, maxWidth: WIDTH - x * 2, centered: look.centered });
}

function blossomPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  for (let petal = 0; petal < 5; petal++) {
    const angle = -Math.PI / 2 + (petal * 2 * Math.PI) / 5;
    const px = cx + Math.cos(angle) * radius * 0.52;
    const py = cy + Math.sin(angle) * radius * 0.52;
    ctx.moveTo(px + radius * 0.5, py);
    ctx.arc(px, py, radius * 0.5, 0, Math.PI * 2);
  }
  ctx.moveTo(cx + radius * 0.6, cy);
  ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
}

function drawBlossom(ctx: CanvasRenderingContext2D, image: HTMLImageElement, look: Look, surface: string, rows: Row[], height: number) {
  drawCover(ctx, image, 0, 0, WIDTH, HEIGHT);
  const radius = Math.max(BLOSSOM_MIN_RADIUS, height / 2 + 110);
  const cy = HEIGHT - BLOSSOM_BOTTOM - radius;
  ctx.save();
  ctx.shadowColor = withAlpha(themed("text-ink-deep").color, 0.35);
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = themed("text-gold").color;
  blossomPath(ctx, WIDTH / 2, cy, radius + 12);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = surface;
  blossomPath(ctx, WIDTH / 2, cy, radius);
  ctx.fill();
  const x = (WIDTH - BLOSSOM_TEXT_WIDTH) / 2;
  drawBlock(ctx, rows, { x, top: cy - height / 2, maxWidth: BLOSSOM_TEXT_WIDTH, centered: look.centered });
}

function textWidth(layout: Layout) {
  if (layout === "card") return WIDTH - (CARD_INSET + CARD_PADDING) * 2;
  if (layout === "blossom") return BLOSSOM_TEXT_WIDTH;
  return WIDTH - MARGIN * 2;
}

async function loadFaces(lettering: FlyerLettering) {
  const text = [lettering.title, lettering.kicker, lettering.when, lettering.where, lettering.badge?.month, lettering.badge?.day]
    .filter(Boolean)
    .join("");
  const faces = ["font-display", "font-accent", "font-sans"].map((face) => themed(face).fontFamily);
  await Promise.all(
    faces.flatMap((family) =>
      [500, 600, 700].map((weight) => document.fonts.load(`${weight} 64px ${family}`, text))
    )
  );
}

export async function composeFlyer(artUrl: string, lettering: FlyerLettering): Promise<Blob> {
  const look = lookFor(artUrl);
  await loadFaces(lettering);
  const image = await loadImage(artUrl);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can’t make flyers. Please try another one.");
  ctx.textBaseline = "alphabetic";

  const { rows, height } = textBlock(ctx, lettering, look, textWidth(look.layout));
  const surface = themed(look.scheme.surface).color;

  if (look.layout === "mat") {
    drawMat(ctx, image, look, surface, rows, height);
  } else if (look.layout === "card") {
    drawCard(ctx, image, look, surface, rows, height);
  } else if (look.layout === "blossom") {
    drawBlossom(ctx, image, look, surface, rows, height);
  } else {
    drawBand(ctx, image, look, surface, rows, height);
    if (look.layout === "badge" && lettering.badge) drawBadge(ctx, lettering.badge);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The flyer couldn’t be finished."))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}
