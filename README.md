# SEJSCC Website

New website for the Southeast Japanese School & Community Center
(14615 S. Gridley Rd., Norwalk, CA). Public site plus a simple admin where
board members publish events and flyers.

## Stack

- **Next.js** (App Router) hosted on **Vercel** — public pages are statically
  generated and revalidated when content changes
- **Neon Postgres** (via Drizzle ORM) — events, groups, users
- **Vercel Blob** — flyer uploads (web image + printable original)
- **Auth.js magic links** (emails via Resend) — passwordless board sign-in,
  gated by an allowlist table
- **Zeffy** embeds for donations/payments (0% fees for nonprofits), plus Zelle
  instructions

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (see comments in the file)
npx drizzle-kit push          # sync schema to the database
npm run dev
```

## First-time provisioning (production)

1. Create a GitHub repo and a Vercel project pointing at it.
2. In the Vercel dashboard: add **Neon** (Storage → Marketplace) and a
   **Blob** store — both populate env vars automatically.
3. Create a [Resend](https://resend.com) account, verify the sending domain,
   and set `AUTH_RESEND_KEY` + `AUTH_EMAIL_FROM`.
4. Set `AUTH_SECRET` (`npx auth secret`).
5. Run `npx drizzle-kit push` against the production `DATABASE_URL`.
6. Insert the first admin: add your email to `allowed_email`, sign in at
   `/admin/login`, then set your row in `user` to `role = 'admin'`.

## Structure

```
src/
├── app/
│   ├── page.tsx              # public site (design in progress)
│   ├── admin/
│   │   ├── login/            # magic-link sign-in (public)
│   │   └── (dashboard)/      # auth-guarded admin pages
│   └── api/auth/[...nextauth]/
├── auth.ts                   # Auth.js config (allowlist check lives here)
└── db/
    ├── schema.ts             # Drizzle schema: auth tables, events, groups
    └── index.ts
```
