@AGENTS.md

# Engineering standards for this codebase

This is a small nonprofit site maintained long-term by one person, with the
expectation that someone else may eventually pick it up. Every change should
read like it was written by a senior engineer who expects to hand the
codebase off: clear, boring, and consistent — not clever.

## Comments

Do not leave comments unless they are absolutely necessary to understand the
code — e.g. a non-obvious workaround, a constraint imposed by an external
system, or something that would otherwise cause a future edit to reintroduce
a bug. Never comment on what code does; make the code self-explanatory
through naming and structure instead. When in doubt, leave it out.

## Styling: one theme, no one-offs

All design tokens live in `@theme` in [globals.css](src/app/globals.css)
(text and line colors: `ink`, `ink-deep`, `ink-soft`, `stone`, `line`, `navy`,
`indigo`, `indigo-deep`, `sky`, `magenta`, `magenta-deep`, `blossom`, `gold`,
`sand`; surface colors, for backgrounds only: `paper`, `mist`, `cloud`,
`cream`, `azure`, `celadon`, `peach`, `lilac`; aspect ratios: `aspect-flyer` (flyers),
`aspect-card` (card media), `aspect-photo`, `aspect-band`; widths: `max-w-wide`
(the event rows, wider than the `max-w-6xl` the rest of a section sits in);
fonts: `font-sans` (Zen Maru Gothic, body copy), `font-display` (Jost,
headings and UI labels),
`font-accent` (Shippori Mincho, Japanese kicker text)). Every component must
be built from these tokens via Tailwind utility classes.

- Text colors must meet WCAG AA (4.5:1 for body copy, 3:1 for large text)
  against the background they sit on. `sky` and `blossom` are the two
  readable text colors on `navy`; `indigo`, `magenta` and `gold` are not —
  use them for fills and rules there, never for words. On `paper` and `mist`,
  `stone` is the lightest color still safe for body copy; on the tinted
  surfaces (`azure`, `celadon`, `peach`, `lilac`, `cream`) it falls below AA,
  so use `ink-soft` or `ink` there — that's what `PageSection`'s `tinted`
  kicker tone is for. `sand` is a light stroke color for decoration on
  dark surfaces only; `ink-deep` is darker than `navy` and takes the same
  text colors.
- A background that washes over `navy` eats the headroom `sky` text depends
  on: `sky` clears 4.5:1 on flat `navy` by a margin of roughly 0.04 relative
  luminance, so a light wash of even 12–17% drops it below AA. The composed
  backgrounds that sit under text (`section-navy-scene`, the `seigaiha-rings`
  textures) are tuned against that ceiling — re-check the darkest text on
  them, at mobile widths, before lightening any layer.
- Jost carries no CJK glyphs, so `font-display` falls back to Zen Maru
  Gothic for Japanese. Never add a font stack without a Japanese face in it.
- Never introduce a raw hex value, arbitrary Tailwind value (`text-[#...]`,
  `w-[13px]`), or a one-off inline style. If a design need isn't covered by
  an existing token, add the token to `@theme` first, then use it — don't
  hardcode around it.
- Don't fork spacing/radius/shadow scales per component. Reuse Tailwind's
  default scale everywhere so spacing stays consistent across the site.
- Use `overflow-clip`, not `overflow-hidden`, to clip decoration on a section.
  `overflow-hidden` makes the element a scroll container, and `reveal-rise`'s
  `view()` timeline binds to the nearest ancestor scroll container — an
  unscrollable one leaves the animation inert on everything inside.
- Recurring UI patterns (card, button, form field, badge) belong in
  [src/components/](src/components/) as shared components, not copy-pasted
  className strings. If you're styling the same combination of utilities in
  a second place, extract it.
- Shared visual treatments that aren't components in their own right live as
  classes in `@layer components` in [globals.css](src/app/globals.css):
  `surface-card` (plus `surface-card-link` for a clickable card),
  `button-primary`, `button-donate`, `seigaiha-rings` (with
  `seigaiha-rings-sky`, the slow-moving `seigaiha-rings-drift`, and
  `seigaiha-rings-fade` for a section whose texture would otherwise start as a
  hard line under the divider above it), `edge-flush` (on a section that ends
  in a wave or brush edge, so the next one covers the hairline the two
  antialiased edges leave at the join — the next section has to be positioned
  and opaque at its top edge, or the overlap paints over the section it is
  meant to hide behind),
  `reveal-rise` / `reveal-bloom` / `reveal-swing-left` / `reveal-swing-right`
  (plus `reveal-stagger` on a grid to cascade its columns — the cascade
  repeats with the column count, so a grid that isn't two-then-four across
  takes the variant naming its own columns: `reveal-stagger-2`,
  `reveal-stagger-3`, `reveal-stagger-2-3`, `reveal-stagger-3-5`,
  `reveal-stagger-4-7`), `reveal-rule`,
  `reveal-rail`, `reveal-pop`, `reveal-turn`, `watermark-drift`,
  `ken-burns-in` / `ken-burns-out`, `enter-rise` / `enter-stagger` /
  `enter-fade` / `enter-rule` / `brush-draw` / `menu-drop`, `hero-drift`, `link-arrow`,
  `bamboo-sway` (with `bamboo-sway-late` to offset a neighbour),
  `tab-progress` (with a per-strip duration
  class, `hero-progress` or `month-progress`, and `tab-progress-paused` to
  hold the strip while the reader is hovering or focused inside it; the
  strip advances on the bar's `animationend`, so the CSS duration is the
  rotation interval),
  `between-waves`, `event-track`, `card-stretch`, and the
  `section-wash-*` / `section-wash-*-hero` / `section-navy-scene`
  backgrounds. Extend one of these rather than restyling a card or button
  inline, and build them from tokens — use `--alpha(var(--color-x) / 20%)`
  for a tint instead of writing the color out again.
- Motion comes in two families. The `reveal-*` classes are scroll-driven
  (`animation-timeline: view()`) and do nothing for content that is already
  on screen when the page opens, so heroes, menus and tab panels use the
  time-based `enter-rise` / `enter-stagger` / `enter-fade` / `brush-draw`
  entrances instead. Every animation sits behind
  `prefers-reduced-motion: no-preference`; keep new ones there too. Hover
  transforms (a card that lifts, tilts or zooms) are motion as well, and a
  blanket `prefers-reduced-motion: reduce` rule at the end of the file cuts
  every transition to an instant state change — don't reach for a
  transition duration that has to survive that.
- Never nest one `enter-stagger` inside another. The inner grid is itself a
  delayed child, so its own children animate while the parent still sits at
  `opacity: 0` and the cascade is over before anyone sees it.
- A card whose whole surface should be clickable puts `card-stretch` on its
  primary link inside a `relative surface-card`, rather than wrapping the
  card in an anchor — that keeps a second link (a sign-up button) legal,
  since anchors can't nest. Its `::after` sits at `z-index: 1`, so anything
  that must stay clickable or paint above the overlay needs a higher stacking
  position; the card's focus ring is drawn by `surface-card-link:has(...)`,
  so a stretched link must live inside a `surface-card-link` to be visibly
  focusable.
- `event-track` lays out a horizontally scrolling row of equal-width cards
  (1 / 2 / 3 across, set by `--event-cards`). `between-waves` masks a texture
  to the wave lines above and below it — its `--wave-cap` / `--wave-tail`
  must stay in step with `wave-divider.tsx`.
- Anything that auto-advances on a timer (carousel, spotlight) needs a
  visible pause control, not just hover and focus pausing — WCAG 2.2.2 is a
  Level A criterion. Use the shared
  [carousel-play-toggle](src/components/carousel-play-toggle.tsx), and keep
  honoring `prefers-reduced-motion`.

## Built for a non-technical admin

Board members with no technical background maintain this site through
`/admin`. Any content that a board member might reasonably want to change —
event details, flyers, group descriptions, page copy — must flow through the
database and the admin dashboard, never be hardcoded in a page or component.
When adding a content type:

- Model it in [src/db/schema.ts](src/db/schema.ts) and give it a real admin
  form under `src/app/admin/(dashboard)/`, following the pattern already
  established for events (list page, create/edit form, delete action,
  server actions in `actions.ts`).
- Design the admin form for someone who has never used a CMS: plain labels,
  inline validation with clear error messages, and no jargon. Prefer a small
  number of well-labeled fields over flexible-but-confusing ones (e.g. a
  structured date/time picker over a raw datetime string).
- Keep public-site components dumb: they render whatever the database gives
  them. Business logic and validation live in the admin/server layer, not
  scattered across display components.

## Accessibility

Every page must be usable with a keyboard and a screen reader, not just a
mouse:

- Use semantic HTML (`nav`, `main`, `button`, `label`, heading levels in
  order) before reaching for ARIA.
- Every image, including flyers and uploaded photos, needs meaningful `alt`
  text; decorative images get `alt=""`.
- Every form input has a visible, associated `label`. Error and success
  states are announced, not conveyed by color alone.
- Interactive elements have visible focus states and a large enough tap
  target for touch. Color choices from the theme must meet WCAG AA contrast
  for text.

## Mobile

Board members and site visitors will primarily be on phones. Build mobile
layout first, then extend up with Tailwind's responsive prefixes — don't
design for desktop and shrink it down. Check real breakpoints (small phone,
large phone, tablet, desktop) for every new page or component before
considering it done, including admin forms.

## Security

This app runs unsupervised for years, holds a login-gated admin area, and
accepts file uploads from users — treat every input as hostile until proven
otherwise.

- Every server action and route handler that reads or mutates data must
  check the session itself (see `requireUser()` in
  [events/actions.ts](<src/app/admin/(dashboard)/events/actions.ts>) and the
  `onBeforeGenerateToken` check in
  [upload/route.ts](src/app/api/upload/route.ts)). Never rely solely on a
  layout or middleware guard to protect a mutation — pages get restructured
  and guards get missed; the action itself is the last line of defense.
- Validate and sanitize on the server, not just in the form — client-side
  checks are a UX nicety, not a security boundary.
- New upload types follow the existing pattern: an explicit
  `allowedContentTypes` allow-list and `maximumSizeInBytes` ceiling, never an
  unrestricted accept-anything endpoint.
- All Drizzle queries go through its query builder (as they do today) so
  values are always parameterized — never build SQL with string
  interpolation.
- Secrets live only in environment variables, documented in
  [.env.example](.env.example) with no real values. Never commit `.env*`,
  log a secret, or echo one into an error message shown to a user.
- Errors shown to admins should be a plain, actionable sentence (board
  members won't read a stack trace); errors on the public site must never
  leak internals — catch and translate before rendering.

## Type safety

`strict` mode is on in [tsconfig.json](tsconfig.json) — keep it that way.
Let types flow from their source of truth (Drizzle's inferred row types from
`schema.ts`, `next-auth`'s augmented `Session`) instead of hand-duplicating
shape definitions that can drift. Avoid `any` and `as` casts; if a cast
feels necessary, it usually means a type is missing upstream. A change isn't
done until `npm run lint` and a TypeScript check are clean.

## Database changes

Schema changes are currently applied with `npx drizzle-kit push`, which is
fine pre-launch. Once this is serving real board/community data in
production, prefer `drizzle-kit generate` + a reviewed migration over `push`
for anything destructive (dropping/renaming a column, changing a type) —
`push` has no history and no dry-run. Always read the SQL diff before
applying a schema change against production data.

## Internationalization

The site is bilingual (English/Japanese) via
[getDictionary()](src/lib/dictionaries.ts) and the JSON files in
[src/dictionaries/](src/dictionaries/). Every user-facing string on the
public site must be added to both `en.json` and `ja.json` and read through
the dictionary — never hardcode English text in a component. A string in
one language file and not the other is a bug.

## Dependencies

This project is maintained by one person for the long haul, so every
dependency added is a dependency someone has to keep patched and upgraded
for years. Before adding a package, check whether Next.js, React, or an
existing dependency already covers the need. Prefer the smaller, more
narrowly-scoped library when a choice exists, and avoid adding a dependency
for something that's a few lines of code to write directly.
