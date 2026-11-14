# Dolab | دولاب

A personal wardrobe app : catalogue your clothes, try outfits on a
mannequin, save looks, get outfit ideas and keep a shopping list — in English or Arabic.

> 🚧 Work in progress. The full README (screenshots, deployment guide) arrives in phase 6.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (auth, Postgres, storage)

## Run it locally

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Supabase (free):
   1. Create a project at [supabase.com](https://supabase.com).
   2. Open **SQL Editor → New query**, paste the contents of
      `supabase/migrations/0001_init.sql` and click **Run**.
   3. Open **Project Settings → API Keys** and copy the *publishable* key, and
      **Project Settings → Data API** for the project URL.
4. Copy `.env.example` to `.env.local` and paste the two values in.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   and open <http://localhost:3000>.

## Database setup

Run each file in `supabase/migrations/` **once, in order**, in Supabase
(**SQL Editor → New query → paste → Run**):

| File | Adds |
| --- | --- |
| `0001_init.sql` | Tables, security rules, photo storage |
| `0002_items_try_before_you_buy.sql` | "Not owned yet" items (store, price, link) |
| `0003_body_profile.sql` | Body profile (sizing hints, ghost-mannequin proportions) |

## Roadmap

| Phase | What | Status |
| --- | --- | --- |
| 1 | Setup + login | ✅ |
| 2 | Wardrobe + "try before you buy" | ✅ |
| 3 | Fitting room: outfit board (main view), ghost mannequin, body profile + size hints, better background removal | ✅ |
| 4 | Saved outfits + outfit ideas (incl. not-owned items) | |
| 5 | Shopping list (move not-owned items there) | |
| 6 | Arabic/RTL polish, family invite link, README + deploy guide | |
| 7 | Extras (below) | |

**Phase 7 and later — all free, no paid APIs:**

- Weather-based outfit suggestions ([Open-Meteo](https://open-meteo.com), free, no key)
- Wear tracker: "Wore it today" button + stats (most/least worn, cost per wear)
- Share an outfit with a public read-only link
- PWA, so Dolab installs on phones like an app
- Product tour for new users ([driver.js](https://driverjs.com))
- Browser extension: "Add to Dolab" from any shop website
- AI outfit and shopping recommendations (free tier, e.g. Gemini), behind one
  function — like `renderTryOn()` in `lib/try-on/` is for AI try-on

## Project layout

| Folder | What's inside |
| --- | --- |
| `app/` | Pages and routes. `(auth)` = public pages, `(app)` = logged-in pages |
| `components/` | Shared UI (buttons, header, logo…) |
| `features/` | Code for one feature each: `auth`, `wardrobe`, `outfits`, `fitting-room`, `shopping` |
| `lib/` | Supabase clients, database helpers, translations (`i18n`) |
| `types/` | TypeScript types for database rows |
| `config/dolab.config.ts` | **All colours, categories and settings** |
| `supabase/migrations/` | Database schema (SQL) |
