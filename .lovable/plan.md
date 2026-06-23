## Goal

Make the app single-user with no sign-in. Remove the login page, the auth gate on `/`, and the sign-out button. Keep all existing books visible and editable.

## Approach

Since this is personal-use only, treat the app as one shared shelf. The backend stops checking who you are; the frontend stops asking you to sign in. Your existing books stay where they are.

## Changes

1. **Remove the login screen**
   - Delete `src/routes/login.tsx`.
   - Remove the `beforeLoad` auth check and the "Sign out" button/header action on `src/routes/index.tsx`.

2. **Open up the backend for personal use**
   - Migration on the `books` table:
     - Make `user_id` nullable (existing rows keep their current `user_id` so nothing is lost).
     - Replace the per-user RLS policies with a single open policy that allows read/insert/update/delete to anyone (`USING (true)`), and grant the needed privileges to the `anon` role.
   - Rewrite `src/lib/books.functions.ts` so each server function uses a server-side publishable Supabase client instead of `requireSupabaseAuth`. Inserts no longer set `user_id`.
   - Leave `src/integrations/supabase/*` (auto-generated) and `src/start.ts` untouched.

3. **Light cleanup**
   - Remove the `/login` link/import usage from `index.tsx`.
   - Leave the Supabase client file in place (still used by the server functions and the existing auth bridge); no schema changes beyond `books`.

## Technical notes

- Existing rows are preserved: the migration only alters the column nullability and swaps policies; no data is deleted or rewritten.
- Server functions move from `requireSupabaseAuth` (which requires a bearer token) to a server-local client built from `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, relying on the new open RLS policy.
- The `_authenticated` folder is not used in this project, so no protected layout needs updating.
- Security tradeoff: anyone who knows the published URL can read and edit the shelf. That matches the "personal use" intent you described. If you ever want to lock it back down, we re-add the auth middleware and per-user policies.

## Files touched

- delete `src/routes/login.tsx`
- edit `src/routes/index.tsx` (drop auth gate, sign-out UI)
- edit `src/lib/books.functions.ts` (drop auth middleware, use publishable server client, stop setting user_id)
- new migration: relax `books` RLS + make `user_id` nullable
