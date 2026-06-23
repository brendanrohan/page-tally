ALTER TABLE public.books ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "users delete own books" ON public.books;
DROP POLICY IF EXISTS "users insert own books" ON public.books;
DROP POLICY IF EXISTS "users select own books" ON public.books;
DROP POLICY IF EXISTS "users update own books" ON public.books;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

CREATE POLICY "open read" ON public.books FOR SELECT USING (true);
CREATE POLICY "open insert" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "open update" ON public.books FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "open delete" ON public.books FOR DELETE USING (true);