export type FlyerLettering = {
  title: string;
  kicker: string | null;
  when: string | null;
  where: string | null;
};

const WIDTH = 1200;
const HEIGHT = 1500;
const MARGIN = 88;
const TEXT_WIDTH = WIDTH - MARGIN * 2;
const FADE = 260;
const TITLE_SIZES = [112, 100, 88, 76, 64];
const TITLE_MAX_LINES = 3;

// Canvas can't read Tailwind classes, so each color and face is taken from
// a throwaway element styled with its token: the flyer follows the theme.
function themed(className: string) {
  const probe = document.createElement("span");
  probe.className = className;
  document.body.append(probe);
  const { color, fontFamily } = getComputedStyle(probe);
  probe.remove();
  return { color, fontFamily };
}

// Fading to the keyword "transparent" passes through black; fading to the
// band's own color at zero alpha doesn't.
function clear(rgb: string) {
  return rgb.replace(/^rgb\((.*)\)$/, "rgba($1, 0)");
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

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  // Japanese has no spaces, so it breaks between any two characters.
  const tokens = text.match(/[\p{scx=Han}\p{scx=Hira}\p{scx=Kana}]|[^\s\p{scx=Han}\p{scx=Hira}\p{scx=Kana}]+|\s+/gu) ?? [];
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

function fitTitle(ctx: CanvasRenderingContext2D, title: string, fontFamily: string) {
  for (const size of TITLE_SIZES) {
    ctx.font = `600 ${size}px ${fontFamily}`;
    const lines = wrap(ctx, title, TEXT_WIDTH);
    if (lines.length <= TITLE_MAX_LINES) return { size, lines };
  }
  const size = TITLE_SIZES[TITLE_SIZES.length - 1];
  ctx.font = `600 ${size}px ${fontFamily}`;
  const lines = wrap(ctx, title, TEXT_WIDTH).slice(0, TITLE_MAX_LINES);
  lines[TITLE_MAX_LINES - 1] = `${lines[TITLE_MAX_LINES - 1]}…`;
  return { size, lines };
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  const scale = Math.max(WIDTH / image.width, HEIGHT / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
}

// Letters the event's details over the bottom of its AI picture. The words
// are drawn here rather than by the model so they're always spelled right.
export async function composeFlyer(artUrl: string, lettering: FlyerLettering): Promise<Blob> {
  const band = themed("text-navy");
  const rule = themed("text-gold");
  const title = themed("text-white font-display");
  const when = themed("text-sky font-sans");
  const where = themed("text-white font-sans");
  const kicker = themed("text-blossom font-accent");

  const allText = Object.values(lettering).filter(Boolean).join("");
  await Promise.all([
    document.fonts.load(`600 64px ${title.fontFamily}`, allText),
    document.fonts.load(`700 44px ${when.fontFamily}`, allText),
    document.fonts.load(`700 40px ${kicker.fontFamily}`, allText),
  ]);
  const image = await loadImage(artUrl);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can’t make flyers. Please try another one.");
  drawCover(ctx, image);

  const { size: titleSize, lines: titleLines } = fitTitle(ctx, lettering.title, title.fontFamily);
  const titleLeading = Math.round(titleSize * 1.12);

  let y = HEIGHT - MARGIN;
  const rows: { text: string; font: string; color: string; baseline: number }[] = [];
  if (lettering.where) {
    rows.push({ text: lettering.where, font: `500 36px ${where.fontFamily}`, color: where.color, baseline: y });
    y -= 56;
  }
  if (lettering.when) {
    rows.push({ text: lettering.when, font: `700 44px ${when.fontFamily}`, color: when.color, baseline: y });
    y -= 76;
  }
  for (const line of [...titleLines].reverse()) {
    rows.push({ text: line, font: `600 ${titleSize}px ${title.fontFamily}`, color: title.color, baseline: y });
    y -= titleLeading;
  }
  let top = y + titleLeading - Math.round(titleSize * 0.8);
  if (lettering.kicker) {
    const baseline = top - 32;
    rows.push({ text: lettering.kicker, font: `700 40px ${kicker.fontFamily}`, color: kicker.color, baseline });
    top = baseline - 34;
  }
  const ruleY = top - 40;
  const bandTop = ruleY - 56;

  const fade = ctx.createLinearGradient(0, bandTop - FADE, 0, bandTop);
  fade.addColorStop(0, clear(band.color));
  fade.addColorStop(1, band.color);
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandTop - FADE, WIDTH, FADE);
  ctx.fillStyle = band.color;
  ctx.fillRect(0, bandTop, WIDTH, HEIGHT - bandTop);
  ctx.fillStyle = rule.color;
  ctx.fillRect(MARGIN, ruleY, 120, 6);

  ctx.textBaseline = "alphabetic";
  for (const row of rows) {
    ctx.font = row.font;
    ctx.fillStyle = row.color;
    ctx.fillText(row.text, MARGIN, row.baseline, TEXT_WIDTH);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The flyer couldn’t be finished."))),
      "image/png"
    );
  });
}
