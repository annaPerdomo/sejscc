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
(colors: `paper`, `mist`, `ink`, `ink-soft`, `stone`, `line`, `navy`,
`indigo`, `indigo-deep`, `sky`, `magenta`, `magenta-deep`, `blossom`,
`gold`; aspect ratios: `aspect-flyer`; fonts: `font-sans` (Zen Maru Gothic,
body copy), `font-display` (Jost, headings and UI labels), `font-accent`
(Shippori Mincho, Japanese kicker text)). Every component must be built from
these tokens via Tailwind utility classes.

- Text colors must meet WCAG AA (4.5:1 for body copy, 3:1 for large text)
  against the background they sit on. `sky` and `blossom` are the two
  readable text colors on `navy`; `indigo`, `magenta` and `gold` are not —
  use them for fills and rules there, never for words. On light backgrounds
  `stone` is the lightest color still safe for body copy.
- Jost carries no CJK glyphs, so `font-display` falls back to Zen Maru
  Gothic for Japanese. Never add a font stack without a Japanese face in it.
- Never introduce a raw hex value, arbitrary Tailwind value (`text-[#...]`,
  `w-[13px]`), or a one-off inline style. If a design need isn't covered by
  an existing token, add the token to `@theme` first, then use it — don't
  hardcode around it.
- Don't fork spacing/radius/shadow scales per component. Reuse Tailwind's
  default scale everywhere so spacing stays consistent across the site.
- Recurring UI patterns (card, button, form field, badge) belong in
  [src/components/](src/components/) as shared components, not copy-pasted
  className strings. If you're styling the same combination of utilities in
  a second place, extract it.

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
