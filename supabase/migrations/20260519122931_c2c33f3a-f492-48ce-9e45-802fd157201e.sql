
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text,
  isbn text,
  shelf text not null default 'to_read' check (shelf in ('currently_reading','on_hold','to_read','finished')),
  stars int not null default 0 check (stars between 0 and 5),
  created_at timestamptz not null default now()
);

create index books_user_shelf_idx on public.books(user_id, shelf);

alter table public.books enable row level security;

create policy "users select own books" on public.books for select using (auth.uid() = user_id);
create policy "users insert own books" on public.books for insert with check (auth.uid() = user_id);
create policy "users update own books" on public.books for update using (auth.uid() = user_id);
create policy "users delete own books" on public.books for delete using (auth.uid() = user_id);
