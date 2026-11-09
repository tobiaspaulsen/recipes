# Recipe app

Phone-first PWA for household recipes and a shared shopping list. See `PLAN.md` for scope, data model and design (direction D, "Papir + glass").

## Working style

- Build incrementally. Each step is one small, self-contained change (one screen or one capability) that can be run, looked at and understood before the next one starts.
- Don't add files or dependencies before the step that needs them.
- Propose the next step and wait for a go-ahead before bundling several features together.
- Prefer getting each step deployed to Vercel and checked on a phone before moving on.

## Commands

- `npm run dev` — local dev server
- `npm run build` — type-check and production build
- `npm run icons` — regenerate PWA icons from `public/logo.svg`
