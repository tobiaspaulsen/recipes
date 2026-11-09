# Oppskrifter

A phone-first web app for the household: a shared shopping list that syncs live between devices, and recipes with servings scaling. It runs in the browser and can be added to the iPhone home screen, so no App Store or Apple developer account is needed.

Live: https://recipes-topa.vercel.app

## Stack

- React + TypeScript, built with Vite
- React Router, lucide-react icons
- Supabase for login (email + password), the database and live updates
- Hosted on Vercel, deployed automatically from `main`

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173) and log in with one of the accounts described under [Accounts](#accounts).

The Supabase address and publishable key are in `.env`, which is committed on purpose: both are public by design and access is enforced by Row Level Security in the database. Never put a secret key in `.env` or in any variable starting with `VITE_`, since those end up in the browser.

To try it on a phone on the same Wi-Fi, run `npm run dev -- --host` and open the network address it prints.

## Other commands

| Command           | What it does                                                  |
| ----------------- | ------------------------------------------------------------- |
| `npm run build`   | Type-checks and builds the production version into `dist/`    |
| `npm run preview` | Serves the built `dist/` locally, to check a production build |
| `npm run icons`   | Regenerates the app icons in `public/` from `public/logo.svg` |

## Database

The schema lives in `supabase/migrations/`, one file per change, named `YYYYMMDDHHMMSS_description.sql`.

Migrations are run by hand:

1. Open the Supabase project, then **SQL Editor** and **New query**.
2. Paste the contents of the new migration file and click **Run**.

Run a migration before deploying app code that depends on it.

## Accounts

There is no sign-up in the app. Accounts are created by hand, and everyone who is logged in shares the same data.

- Create a user: Supabase, **Authentication** > **Users** > **Add user** > **Create new user**. Enter email and password and tick **Auto Confirm User**.
- Remove access: delete the user in the same list, or change the password.
- Keep **Allow new users to sign up** turned off under **Authentication** > **Sign In / Providers**. Otherwise anyone could create an account through the Supabase API and see the data.

## Deploy

Pushing to `main` on GitHub deploys to Vercel automatically. There are no environment variables to set in Vercel, since the public Supabase settings come from `.env`.

## Project notes

- `PLAN.md` describes the scope, data model, design and build order.
- `CLAUDE.md` holds working conventions and iOS issues that have bitten before.
