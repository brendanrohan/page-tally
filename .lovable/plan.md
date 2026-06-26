# Fix books not loading on `page-tally.brdnrohan.workers.dev`

## What's actually wrong

- Your Cloudflare Worker deployment loads the page fine (HTTP 200).
- Every call to a book server function (`listBooks`, `addBook`, etc.) returns **HTTP 500**.
- Cause: the Worker has no `SUPABASE_URL` or `SUPABASE_PUBLISHABLE_KEY` available at runtime, so the `requireSupabaseAuth` middleware throws before any query runs.

These vars are **server-side, runtime** — Cloudflare injects them per request. They are *not* the `VITE_*` vars (those get baked into the client bundle at build time and only the browser sees them).

## Fix (no code changes needed)

You add two variables to your Worker in the Cloudflare dashboard:

```text
SUPABASE_URL              = https://rticqcrapoarubjncblv.supabase.co
SUPABASE_PUBLISHABLE_KEY  = <your publishable/anon key from .env>
```

Steps in Cloudflare:
1. Cloudflare dashboard → **Workers & Pages** → select **page-tally**.
2. **Settings → Variables and Secrets** (or "Environment Variables").
3. Add the two variables above for the **Production** environment. Plain text is fine — these are publishable, not secret.
4. Save. Cloudflare will prompt to redeploy (or you can re-run your deploy).

## Verification

After redeploy, I'll re-hit the server function endpoint and confirm it returns 200 instead of 500. Then your books should appear on `page-tally.brdnrohan.workers.dev` after login.

## Things this plan deliberately doesn't change

- **No code edits.** Your local Lovable preview and `page-tally.lovable.app` already work because their env is provisioned automatically. Adding env vars on Cloudflare is purely an ops/config fix.
- **Doesn't touch the GitHub Actions workflow.** That workflow still targets GitHub Pages (static-only, won't ever run server functions). If you stop using it, you can delete `.github/workflows/deploy.yml` later — not needed for this fix.
- **No service-role key on the Worker.** Server functions only need the publishable key + the user's bearer token; that's enough for RLS to scope queries to the logged-in user.

## Heads-up about future updates

Right now your Cloudflare Worker is deployed from outside Lovable, so it won't auto-update when you make changes in the editor. Any change to server functions, routes, or schema in Lovable requires you to redeploy the Worker yourself (push to the repo / re-run wrangler / however you deploy it) before it shows up on `page-tally.brdnrohan.workers.dev`. The Lovable-hosted `page-tally.lovable.app` will always be the most up-to-date copy.
