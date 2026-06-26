
-- Reassign existing books to brdnrohan@yahoo.com if that account already exists.
UPDATE public.books
SET user_id = u.id
FROM auth.users u
WHERE u.email = 'brdnrohan@yahoo.com'
  AND (public.books.user_id IS DISTINCT FROM u.id);

-- Backfill any remaining NULL user_id rows to the historical owner (safety net).
UPDATE public.books
SET user_id = '39564ba5-6543-44bf-b424-1f160702d097'
WHERE user_id IS NULL;

-- Require ownership going forward.
ALTER TABLE public.books ALTER COLUMN user_id SET NOT NULL;

-- Drop the open public-access policies.
DROP POLICY IF EXISTS "open read" ON public.books;
DROP POLICY IF EXISTS "open insert" ON public.books;
DROP POLICY IF EXISTS "open update" ON public.books;
DROP POLICY IF EXISTS "open delete" ON public.books;

-- Lock grants to authenticated users only.
REVOKE ALL ON public.books FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

-- Owner-scoped policies.
CREATE POLICY "Owners can read their books"
  ON public.books FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert their books"
  ON public.books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their books"
  ON public.books FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their books"
  ON public.books FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
