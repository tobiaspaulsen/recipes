# Recipe App — Plan

## Context

A phone-first recipe app for our household (me + partner) to store dinner recipes, scale them to the number of people, and keep a shared shopping list. We want to avoid paying for an Apple Developer account, so the app is a **Progressive Web App (PWA)**: a website that is added to the iPhone home screen ("Share → Add to Home Screen") and runs full screen like a native app.

### Decisions so far

| Topic | Decision |
|---|---|
| Platform | PWA, phone-first, installed to home screen |
| Users | Household (2+ people) sharing recipes and a shopping list, synced live |
| Shopping list | Inside the app, synced via backend. Recipe items + free-form items ("toalettpapir") |
| List sorting | Order added (unchecked on top, checked at the bottom) |
| Adding recipes | Manual form, import from URL, paste text / photo parsed by AI |
| Language | UI in Norwegian. Recipe text stays in its original language (e.g. English) |
| Units | Converted to Norwegian units **on import** (cups → dl, oz/lb → g, °F → °C, tbsp/tsp → ss/ts). Original source URL kept |
| Extras in v1 | Dish photos, tags + search, cooking mode |
| Later | Weekly meal plan, custom store order / categories |

## Stack

- **Frontend:** React + Vite + TypeScript, static web app manifest, React Router, `lucide-react` icons, TanStack Query (when data arrives).
- **Backend:** Supabase (free tier): Postgres, Auth (magic-link email), Realtime (live shopping list), Storage (dish photos), Row Level Security per household.
- **Server functions:** Vercel serverless functions under `/api` (keeps the Anthropic API key secret, and avoids CORS when fetching recipe sites).
- **AI:** Claude API (`claude-sonnet-5-5`) with tool use / structured output to return a recipe in our exact schema.
- **Hosting:** Vercel (free), same project as the API functions.

## Data model (Supabase)

- `households` — id, name
- `household_members` — household_id, user_id (invite partner by email/link)
- `recipes` — id, household_id, title, language (`no`/`en`), servings (base), source_url, image_path, tags `text[]`, notes, prep/cook time, created_at, updated_at
- `ingredients` — id, recipe_id, position, section (optional heading, e.g. "Saus"), quantity `numeric null`, unit `text null`, name (in the recipe's original language, e.g. "onions"), note ("sliced", "finhakket"), scalable `bool` (false for "salt etter smak")
- `steps` — id, recipe_id, position, text
- `shopping_items` — id, household_id, name, quantity `numeric null`, unit `text null`, recipe_id `null` (where it came from), checked, created_at, checked_at

All tables protected by RLS: a user can only read/write rows for households they belong to.

## Core logic

### Units (`src/lib/units.ts`)
- Canonical Norwegian units: `g`, `kg`, `ml`, `dl`, `l`, `ss`, `ts`, `krm`, `stk`, `fedd`, `boks`, `pakke`, `klype`, `neve`.
- Conversion table from imperial/US units used at import time (1 cup = 2.4 dl, 1 oz = 28 g, 1 lb = 454 g, 1 tbsp = 1 ss, 1 tsp = 1 ts, °F → °C in step text).
- Volume stays volume (cup flour → dl, not grams) — no per-ingredient density table.

### Scaling (`src/lib/scale.ts`)
- `factor = desiredServings / recipe.servings`, applied to `quantity` of scalable ingredients only.
- Smart rounding: whole items (`stk`, `fedd`, `boks`) round to nearest 0.5/1; small spoon amounts shown as fractions (½, ¼); large amounts promote units (1000 g → 1 kg, 10 dl → 1 l, 15 ml ↔ 1 ss where sensible).
- Display with Norwegian number formatting (comma decimal).

### Shopping list merging (`src/lib/shopping.ts`)
- Shopping items keep the ingredient's original-language `name` (no translation — nothing gets lost). Prep notes stay on the recipe, not the list.
- When adding a recipe's ingredients (at the chosen servings), merge into an existing **unchecked** item with the same normalized name + compatible unit (300 g + 200 g pasta → 500 g). Otherwise insert a new row.
- User can deselect ingredients before adding ("we already have salt").
- Free-form items: quick-add input at the top of the list, optional quantity.
- Actions: tick off, edit, delete, "clear checked".
- Realtime subscription so both phones update instantly.

## Recipe import (`/api`)

- `POST /api/import-url` — fetch page server-side, extract schema.org `Recipe` JSON-LD (most recipe sites have it). Pass the extracted data (or page text if no JSON-LD) to Claude for normalization into our schema + Norwegian units. Download the recipe image into Supabase Storage.
- `POST /api/parse` — input is pasted text or a photo (cookbook page / handwritten note). Claude returns the structured recipe.
- The AI splits each ingredient into name + note ("onions, sliced" → name "onions", note "sliced"), keeping the original language.
- Both return a **draft** that opens in the normal recipe editor for review before saving — the AI never saves directly.
- Requests require a valid Supabase session (so the endpoint isn't open to the world and burning API credits).

## Design — direction D "Papir + glass"

Mockups (all directions kept for reference; D is chosen): https://claude.ai/artifact/FRxHjFmEKLZDmZCi27jz2p

Scandinavian-minimal, warm. Content looks like Papir (paper, serif headings, hairline rows); navigation and controls float above it as Apple-style liquid glass. Light and dark follow the system setting (`prefers-color-scheme`).

**Tokens**

| Token | Light | Dark |
|---|---|---|
| `bg` | `#F5EFE6` | `#1E1915` |
| `ink` | `#2A211B` | `#F2E9DD` |
| `muted` | `#6F6255` | `#B3A594` |
| `line` (hairlines) | `#E6DCCD` | `#362E27` |
| `ring` (unchecked box) | `#A39482` | `#7D6F61` |
| `accent` (terracotta) | `#B4502D` | `#E07A52` |
| `on-accent` | `#FFF8F0` | `#1E1915` |

**Type:** Newsreader (500) for headings and step numbers; Inter for UI and body; tabular figures for amounts.

**Glass** (navigation layer only — never on list rows or text blocks):
- Floating bottom tab bar (pill), floating "Legg til vare" input above it, floating action bar on the recipe view, round back/favourite buttons over the photo, servings stepper pill.
- CSS: translucent gradient fill + `backdrop-filter: blur(22px) saturate(180%)` + 1px light border + inset top highlight (no outer drop shadow). Primary actions use a terracotta-tinted glass.
- No ambient glows (dropped: slow to render on iOS and left seams at the screen edge).
- Content gets bottom padding so nothing hides under the floating controls; respect iOS safe areas.

**Rules:** one accent colour; no cards-with-shadows, gradients on content, or emoji; tap targets ≥ 44px; ticked items move to a "Handlet" section (undoable) with strike-through.

## Screens

1. **Handleliste** (home — the screen opened most often, so the app launches here) — shared list, quick-add input pinned at top (keyboard-ready), merged items, tick off, clear checked. Items added from a recipe show a small recipe label.
2. **Oppskrifter** — recipe cards with photo, search box, tag filter chips.
3. **Recipe view** — photo, servings stepper (− 4 +) that rescales live, ingredients, steps, "Legg i handleliste" button, "Start matlaging" button.
4. **Cooking mode** — large text, one step at a time or tick-off list, screen kept awake via the Wake Lock API, ingredient amounts at current servings.
5. **Recipe editor** — title, servings, tags, photo upload, ingredient rows (amount / unit picker / name / note), steps, reorder.
6. **Ny oppskrift** — choose: type manually / paste link / paste text / take or pick photo.
7. **Innstillinger** — household, invite partner, sign out.

Floating glass tab bar: Handleliste (default) · Oppskrifter · Innstillinger.

## Computer (secondary)

Phone-first, but the same app works in a desktop browser (and can be installed as a desktop PWA from Chrome/Edge/Safari). Handy for typing in and editing recipes, pasting links, and planning.

- One responsive codebase; design at 390px first, then add breakpoints.
- ≥ 768px: content centred with a max width; the floating glass tab bar stays centred at the bottom (or becomes a slim left rail ≥ 1024px).
- Oppskrifter: single column on phone → grid of recipe cards on desktop.
- Recipe view ≥ 1024px: two columns — ingredients (sticky) left, steps right; photo as a wide banner.
- Recipe editor gets the most from the extra space: wider ingredient rows, keyboard-friendly (Tab between fields, Enter adds a new row).
- Shopping list stays a single centred column — it's a list either way.
- Hover states and visible focus rings for mouse/keyboard use.

## Offline (later, its own step)

Currently no service worker — the first attempt made reloads slow and confusing. Add it back deliberately once there's data worth caching, and test updates on a real iPhone.

- Service worker caches the app shell.
- TanStack Query cache persisted to IndexedDB so recipes and the shopping list are readable offline (e.g. bad reception in the store).
- Shopping-list edits made offline are queued and synced when back online (v1: optimistic updates + retry; conflicts are rare with two users).

## Build phases

**Priority (decided 2026-11-09): a fully working shopping list first, recipe integration later.** The recipe screens stay as they are (example data, scaling) until the list app is complete and shared between phones. The phases below are the original order; the list work now comes first.

1. **Foundation** — Vite/React/TS project, PWA manifest + icons, Supabase project, schema + RLS, magic-link login, household + invite, deploy to Vercel. Verify it installs on iPhone.
2. **Recipes** — CRUD editor, recipe view, scaling + unit display, photos, tags + search.
3. **Shopping list** — list screen, quick-add, add-from-recipe with merging, realtime sync, offline cache.
4. **Import** — URL import (JSON-LD + Claude), paste text, photo parsing, unit conversion on import.
5. **Cooking mode** + polish (empty states, loading, haptics-feel, dark mode).
6. **Later** — weekly meal plan, categories / store order.

## Verification

- Unit tests (Vitest) for `units.ts`, `scale.ts`, `shopping.ts` merge logic — the parts most likely to have subtle bugs (rounding, fractions, unit promotion, merging).
- Import tested against a handful of real sites (Norwegian: matprat.no, tine.no; English: e.g. BBC Good Food, NYT Cooking) and a photo of a cookbook page.
- Manual end-to-end on two iPhones: install to home screen, log in as two users in one household, add recipe → scale → add to list on phone A, see it appear on phone B, tick off offline and confirm sync on reconnect.
- Cooking mode: confirm screen stays on in installed PWA on iOS.

## Secrets

| Value | Secret? | Lives in |
|---|---|---|
| Supabase URL + anon key | No — public by design, shipped to the browser; protection comes from RLS | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Anthropic API key | **Yes** | `ANTHROPIC_API_KEY` — server functions only |
| Supabase service-role key | **Yes** (bypasses RLS) | Not used in v1; if ever needed, server only |

- Vite only exposes `VITE_`-prefixed vars to the browser, so secrets must never get that prefix.
- Local dev: `.env.local` (gitignored). Commit `.env.example` with names only.
- Production: Vercel project → Environment Variables.
- `/api` functions verify the caller's Supabase session token before calling Claude.
- Set a monthly spend limit on the Anthropic key in the Anthropic Console.
- Secret keys are typed into `.env.local` / Vercel by you, not pasted into chat.

## Things you'll need to set up

- Supabase account (free) — project URL + anon key.
- Vercel account (free), linked to a GitHub repo.
- Anthropic API key (pay-as-you-go; parsing a recipe costs well under 1 kr).
