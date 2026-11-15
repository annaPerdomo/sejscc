---
version: alpha
name: Southeast Japanese School & Community Center
description: >
  A hundred-year-old Japanese American community center in Norwalk, California,
  drawn the way its centennial book was: deep navy and indigo, a magenta accent,
  gold rules, and warm paper. Traditional Japanese craft (seigaiha waves, asanoha
  lattice, hanging scrolls, folding screens, wooden name tags) frames real
  photographs of the community. Calm, generous and readable for an audience that
  is mostly over fifty and mostly on a phone.
colors:
  paper: "#fcfdff"
  mist: "#f1f6fd"
  cloud: "#f8faff"
  cream: "#fff8f3"
  azure: "#dceafb"
  celadon: "#d9eee7"
  peach: "#ffe0ce"
  lilac: "#e9e3fb"
  butter: "#fbf0c9"
  ink: "#14304f"
  ink-deep: "#0e2540"
  ink-soft: "#46617d"
  stone: "#4f6d8f"
  line: "#d3e4f4"
  navy: "#183c88"
  indigo: "#1e63b0"
  indigo-deep: "#14498a"
  sky: "#9ecaf3"
  magenta: "#b02d76"
  magenta-deep: "#8f2560"
  blossom: "#f2a3c8"
  gold: "#ae9665"
  sand: "#f3e7d3"
  white: "#ffffff"
typography:
  display-lg:
    fontFamily: Jost, Zen Maru Gothic, system-ui, sans-serif
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: 0.02em
  display-md:
    fontFamily: Jost, Zen Maru Gothic, system-ui, sans-serif
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Zen Maru Gothic, system-ui, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.75
  body-md:
    fontFamily: Zen Maru Gothic, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: Jost, Zen Maru Gothic, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
  kicker-accent:
    fontFamily: Shippori Mincho, Zen Maru Gothic, Georgia, serif
    fontSize: 14px
    fontWeight: 700
    letterSpacing: 0.2em
  kicker-caption:
    fontFamily: Jost, Zen Maru Gothic, system-ui, sans-serif
    fontSize: 12px
    fontWeight: 600
    letterSpacing: 0.2em
rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 16px 28px
  button-donate:
    backgroundColor: "{colors.magenta}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 16px 32px
  button-donate-hover:
    backgroundColor: "{colors.magenta-deep}"
    textColor: "{colors.white}"
  surface-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  flyer-mount:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: 14px
  section-kicker:
    textColor: "{colors.indigo}"
    typography: "{typography.kicker-accent}"
---

## Overview

The site should feel like the center's 100th anniversary book opened on a
screen: photographs of real people, mounted and framed with the patience of
Japanese craft, on deep blue and warm paper. It is a community's own record, not
a brochure. Nothing is trendy, glossy or generic.

The source of truth is code. Every value here is a token in `@theme` in
[src/app/globals.css](src/app/globals.css), and the working rules for building
with them are in [CLAUDE.md](CLAUDE.md). If this file and `globals.css`
disagree, `globals.css` is right and this file needs updating.

**Key Characteristics:**

- Full-bleed sections that alternate light paper with deep navy, ink and plum
  scenes. No two dark sections on a page share a tone.
- Real photographs from the centennial photo library, shown large. Flyers are
  shown large too, mounted on cream with gold rules.
- Japanese patterns as texture: seigaiha (wave) rings and asanoha (hemp leaf)
  lattice. No big logo watermarks and no stroke-only arc washes.
- Japanese objects as frames: hanging scroll, folding screen, picture scroll,
  school gate plaque, dojo name tag, tear-off calendar page, envelope and stamp.
- Light, wide display type over round, friendly body type, always with a
  Japanese face behind it.
- Large text, high contrast, slow motion. Anything that moves on its own has a
  visible pause control.
- Bilingual. Every public word exists in English and Japanese. The center's
  Japanese name is サウスイースト日本語学園, never 東南.

## Colors

### Brand & Accent

- `navy` and `indigo` are the center's blues. `navy` fills dark sections;
  `indigo` is the primary action color and the accent on light surfaces.
  `indigo-deep` is its pressed and emphasis shade.
- `magenta` is the single warm accent, reserved for donating and for rules that
  need to stand out. `magenta-deep` is its hover shade.
- `gold` is for rules, frames and ornament. It is never a text color.

### Surface

- `paper` is the page. `mist` and `cloud` are its quiet variations.
- `cream` is the mounting board behind flyers and documents.
- `azure`, `celadon`, `peach`, `lilac` and `butter` are tinted surfaces, for
  backgrounds only.
- `ink-deep` is the darkest surface, darker than `navy`.

### Hairlines

- `line` is the border on light surfaces. `sand` is a light stroke for
  decoration on dark surfaces only.

### Text

- On `paper` and `mist`: `ink` for copy, `ink-soft` for secondary copy, and
  `stone` as the lightest color still safe for body text.
- On the tinted surfaces and `cream`: `ink` or `ink-soft` only. `stone` falls
  below AA there.
- On `navy` and `ink-deep`: white, `sky` and `blossom`. `indigo`, `magenta` and
  `gold` are for fills and rules there, never for words.
- `sky` on `navy` passes AA with almost no margin. A light wash of about 10%
  over the navy drops it below, so re-check before lightening any dark
  background that sits under text.

### Semantic

Error and success states are never conveyed by color alone; they carry words
and are announced to screen readers.

## Typography

- **Display: Jost.** Headings and interface labels. Set light or regular, never
  heavy, with slightly open tracking.
- **Body: Zen Maru Gothic.** All running copy. Rounded and warm, in English and
  Japanese alike.
- **Accent: Shippori Mincho, bold.** Japanese kicker text and vertical
  lettering, such as the school plaque.

### Principles

- Body copy is 16px at minimum and usually 18px. The audience is over fifty.
- Headings scale from 36px on a phone to 48–60px on a desktop.
- A section opens with a kicker: a Japanese word in the accent face, a short
  rule, then a small uppercase caption in the display face.
- Text contrast meets WCAG AA: 4.5:1 for body copy, 3:1 for large text.

### Note on Font Substitutes

Jost has no Japanese glyphs, so the display stack falls back to Zen Maru Gothic
for Japanese. Never write a font stack without a Japanese face in it. If the
web fonts are unavailable, use a rounded Japanese sans (Hiragino Maru Gothic)
for body and a Mincho serif for the accent.

## Layout

- Mobile first. Design the phone layout, then extend upward.
- Sections run the full width of the screen. Content sits in a centered column
  of about 72rem; the event rows may go wider, to 96rem.
- Section edges are straight. Where two sections meet, a gold-edged navy ribbon
  with a medallion straddles the seam. The crest medallion closes each page's
  opening photo; the seams below vary the ornament and alternate sides.
- Prefer open, full-bleed composition over boxes. Do not put content in a
  narrow container or a card when it can sit directly on the section.
- Spacing, radius and shadow come from one shared scale. No per-component
  scales and no arbitrary values.
- Aspect ratios: flyers 4:5, card media 5:4, photos 3:2, bands 5:2.

## Elevation

Depth is soft and low. A card carries a faint ink-tinted shadow and a hairline
border. Mounted pieces (a flyer, the donation form) sit on cream with a gold
keyline and a deeper shadow, like a print on a board. Dark sections get their
depth from layered washes and pattern, not from shadows.

Motion is slow and optional. Content rises or blooms into place as it scrolls
in, photographs warm from black-and-white to color, and backdrops drift. All of
it switches off under `prefers-reduced-motion`. Nothing pauses on hover.

## Components

- **button-primary.** Indigo fill, white label in the display face, soft indigo
  shadow. The default action.
- **button-donate.** Magenta fill, white label. Only for giving.
- **button-donate-hover.** Darkens to `magenta-deep` and lifts by a pixel.
- **surface-card.** White, hairline border, large radius, soft shadow. When the
  whole card is clickable, its main link stretches over it so a second link
  inside stays usable.
- **flyer-mount.** A flyer or form on a cream board with gold rules, square
  cornered, paired with gold seigaiha rings.
- **section-kicker.** The Japanese-word, rule and caption line that opens a
  section. Its colors change with the surface it sits on.

The full set of named treatments (scrolls, screens, plaques, calendars,
envelopes, timelines, reveals) is listed in [CLAUDE.md](CLAUDE.md) and defined
in `@layer components` in [src/app/globals.css](src/app/globals.css). Extend
one of those before inventing a new look.

## Responsive Behavior

| Name    | Width    | Notes                                   |
| ------- | -------- | --------------------------------------- |
| Phone   | < 640px  | One column. The primary design target.  |
| Tablet  | 640px+   | Two columns where content allows.       |
| Laptop  | 1024px+  | Full layouts; staged hero openings.     |
| Desktop | 1280px+  | Wider event rows and larger headings.   |

### Touch Targets

Every control is large enough to tap comfortably and shows a visible focus
ring. Everything works with a keyboard and a screen reader.

### Collapsing Strategy

Grids drop columns before they shrink type. Vertical Japanese text lies flat on
phones. Pinned, scroll-driven pieces (the picture scroll, then-and-now photos)
become simple stacks or swipeable strips where scroll animation is unavailable.

## Flyers and Printed Pieces

A flyer for the center should look like it belongs with the site: the same
blues, magenta and gold, the same three typefaces, a real photograph or a
traditional pattern, and the event's date, time and place in plain words. Avoid
stock illustration, clip art, neon gradients and generic poster templates.

## Known Gaps

- No dark mode. The dark sections are part of one fixed design.
- Spacing and radius values above are Tailwind's default scale, listed for
  reference; the site does not define its own.
- No illustration or icon style is defined beyond the patterns and the crest.
- There is no linter wired up for this file; keep it in step with
  `globals.css` by hand.
