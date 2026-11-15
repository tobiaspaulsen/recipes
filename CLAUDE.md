# Recipe app

Phone-first PWA for household recipes and a shared shopping list. See `PLAN.md` for scope, data model and design (direction D, "Papir + glass").

## Working style

- Build incrementally. Each step is one small, self-contained change (one screen or one capability) that can be run, looked at and understood before the next one starts.
- Don't add files or dependencies before the step that needs them.
- Propose the next step and wait for a go-ahead before bundling several features together.
- Prefer getting each step deployed to Vercel and checked on a phone before moving on.
- Never commit or push without the user's explicit approval for that change. Show what changed and ask first.
- No emojis in code, docs, commit messages or UI.

## Comments

- Keep comments short and concrete: one line, stating a fact the code can't (why, a constraint, a gotcha).
- No comments that restate the code, explain a name, or describe the edit.

## iOS gotchas (learned the hard way)

- No `filter: blur()` on large elements: it delayed first render by ~10 s on iPhone.
- No outer shadows or effects on bottom-fixed elements: iOS cuts them off at the viewport edge, leaving a visible seam.
- No `apple-mobile-web-app-status-bar-style: black-translucent`: on iOS 26 the home screen app launches one status bar too short.
- Test layout changes on a real iPhone, both in Safari and as a home screen app.

## Database

- Migrations live in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql` (Supabase CLI format).
- Applied with the Supabase CLI (project is linked): `supabase db push --remote --dry-run` to preview, then the user runs `supabase db push --remote --yes` themselves; production writes are blocked from Claude Code.
- Don't push app code that needs a migration before it has been applied to production.
- `supabase/seed.sql` holds optional example recipes; it's only applied with `--include-seed`.
- `supabase start` runs a local copy in Docker (needed by the Supabase VS Code extension); the app's `.env` still points at production.

## Commands

- `npm run dev` — local dev server
- `npm run build` — type-check and production build
- `npm run icons` — regenerate PWA icons from `public/logo.svg`
