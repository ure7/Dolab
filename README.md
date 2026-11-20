# Dolab | دولاب

A personal wardrobe app : catalogue your clothes, try outfits on a
mannequin, save looks, get outfit ideas and keep a shopping list — in English or Arabic.

Everything runs on free tiers: no paid APIs, no API keys besides your own Supabase project.

## Features

**Wardrobe**
- Add clothes with a photo (or paste a screenshot). The background is removed
  **in the browser** (free, private), with a clean-up step that keeps dark clothes solid,
  and a before/after choice.
- Search and filter by category, colour, condition and "owned / not owned yet".
- **Try before you buy:** add items you saw in a shop (store, price, link) and try
  them with your own clothes. "I bought it" moves them into your wardrobe.

**Fitting room**
- **Outfit board** (main view): a fashion-style flat-lay of the chosen items.
- **Ghost mannequin**: the outfit layered on a neutral outline — tops, then a
  hoodie, then an outer layer worn **open or closed**.
- Body profile (height, weight, shape) for sizing hints and the mannequin's proportions.

**Outfits**
- Save outfits with codes like **3.1**; "Save as variation" makes 3.2, 3.3 …
- **Outfit ideas** from your own clothes using simple colour rules, and
  **"Thinking of buying?"** — how many outfits a not-owned item would make.

**Shopping list**
- "Need" and "Nice to have" lists, a budget, and suggestions from not-owned and
  worn-out items. Ticking off a linked item moves it into your wardrobe.

**Daily use**
- **Weather outfits:** pick your city once and get today's ideas with the right number
  of layers (hoodie, jacket, rain) from [Open-Meteo](https://open-meteo.com) — free, no key.
- **Wear tracker:** "Wore it today" on any outfit. The **Stats** page shows most-worn
  items, cost per wear, the last two weeks and clothes you've forgotten about.
- **Share an outfit** with a private, read-only link (`/s/…`) — anyone with the link can
  view just that outfit; "Stop sharing" turns the link off. Prices stay private.

**Everywhere**
- **Installable app (PWA):** "Add to Home Screen" on phones or "Install" in the browser;
  shows a friendly page when you're offline.
- **Product tour** on your first visit (and from the **?** button in the header).
- English and Arabic (full right-to-left layout), switchable at any time.
- Responsive from small phones (360px) to big monitors (2560px).

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Supabase (auth, Postgres with Row Level Security, private photo storage) ·
[@imgly/background-removal](https://github.com/imgly/background-removal-js) (runs in the browser)

## Run it locally

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Supabase (free):
   1. Create a project at [supabase.com](https://supabase.com).
   2. Run the database migrations (see the next section).
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
| `0004_outfits_shopping_wear_share_weather.sql` | Jacket open/closed per outfit, shopping-list links, wear tracker, share links, weather location |

Every table has Row Level Security: each person can only ever see and change their own rows
and photos.

## Deploy to Vercel (free)

1. **Push the code to GitHub** (this repository).
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click **Add New → Project**
   and **Import** the `Dolab` repository. Vercel detects Next.js automatically.
3. Before clicking Deploy, open **Environment Variables** and add the same two values
   as in your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Click **Deploy**. After a minute you get a link like `https://dolab-xxxx.vercel.app`.
5. Tell Supabase about the new address, so sign-up confirmation emails link to it:
   in Supabase open **Authentication → URL Configuration** and
   - set **Site URL** to your Vercel link,
   - add `https://YOUR-LINK.vercel.app/auth/callback` under **Redirect URLs**.
6. Open the link, sign up, and you're live. Every `git push` to `main` redeploys automatically.

After deploying:
- **Install it on a phone:** open the link in Safari (iPhone: Share → *Add to Home Screen*)
  or Chrome/Brave (Android: menu → *Install app*).
- **Family members** each sign up with their own email at the same link — everyone gets
  their own private wardrobe.
- **Sharing an outfit** gives a link like `https://YOUR-LINK.vercel.app/s/…` that works
  without an account.

Free-tier notes: Supabase gives 500 MB database + 1 GB photo storage (photos are shrunk
before upload to stay well within it); Vercel's Hobby plan is free for personal use.

## How the main pieces work

| Piece | Where | In short |
| --- | --- | --- |
| Settings | `config/dolab.config.ts` | Colours, categories, clothing colours, colour pairs for ideas, budgets… change things here first. |
| Translations | `lib/i18n/dictionaries/en.ts` + `ar.ts` | Every text in the app. TypeScript makes sure both languages have every key. |
| Background removal | `features/wardrobe/photo/` | AI cut-out in the browser, then `refineCutout.ts` fills holes in dark clothes. |
| Try-on | `lib/try-on/` | **One function, `renderTryOn()`**, decides how the outfit is drawn. Swap in an AI try-on service there later. |
| Outfit ideas | `lib/ideas/suggest.ts` | **One function, `suggestOutfits()`**: colour rules today, AI recommendations later. |
| Security | `supabase/migrations/` | Row Level Security policies: the database itself refuses access to other people's data. |

## Project layout

| Folder | What's inside |
| --- | --- |
| `app/` | Pages and routes. `(auth)` = public pages, `(app)` = logged-in pages |
| `components/` | Shared UI (buttons, header, logo…) |
| `features/` | Code for one feature each: `auth`, `wardrobe`, `fitting-room`, `outfits`, `shopping`, `profile`, `wear`, `weather` |
| `lib/` | Supabase clients, database helpers, body maths, try-on, ideas, translations (`i18n`) |
| `types/` | TypeScript types for database rows |
| `config/dolab.config.ts` | **All colours, categories and settings** |
| `supabase/migrations/` | Database schema (SQL) |

## Roadmap

| Phase | What | Status |
| --- | --- | --- |
| 1 | Setup + login | ✅ |
| 2 | Wardrobe + "try before you buy" | ✅ |
| 3 | Fitting room: outfit board, ghost mannequin, body profile + size hints, better background removal | ✅ |
| 4 | Saved outfits (codes like 1.2, variations, jacket open/closed) + outfit ideas + "Thinking of buying?" | ✅ |
| 5 | Shopping list: Need / Nice to have, budget, suggestions, ticking off moves items into the wardrobe | ✅ |
| 6 | Full Arabic/RTL pass, translated titles, 404 and error pages, loading states, README + deploy guide | ✅ |
| 7 | Weather outfits, wear tracker, share links, installable app (PWA), product tour | ✅ |

**Later — documented plans only:**
- Browser extension: "Add to Dolab" from any shop website
- AI outfit and shopping recommendations (free tier, e.g. Gemini), behind `suggestOutfits()`
