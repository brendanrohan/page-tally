# My Reading Life — Build Plan

A clean, literary book tracker with four shelves, star ratings, and cover art from Open Library.

## Backend (Lovable Cloud)

Enable Lovable Cloud and add:

- **Auth**: anonymous sessions (auto sign-in on first visit) so books persist per device/user without a login wall.
- **Table `books`**:
  - `id` uuid PK
  - `user_id` uuid (auth.users)
  - `title` text not null
  - `author` text
  - `isbn` text
  - `shelf` text check in ('currently_reading','on_hold','to_read','finished')
  - `stars` int check 0–5 default 0
  - `created_at` timestamptz default now()
- **RLS**: users can select/insert/update/delete only their own rows.

## Frontend

Single route `/` (TanStack Start). Components:

- `ShelfTabs` — 4 tabs with count badges (Currently Reading, On Hold, To Read, Finished).
- `AddBookButton` + inline `AddBookForm` (Title, Author, ISBN). Enter saves, Escape cancels.
- `BookGrid` — responsive grid of ~150px cards, 2:3 cover aspect.
- `BookCard`:
  - Cover from `https://covers.openlibrary.org/b/isbn/{ISBN}-M.jpg` with `onError` fallback to a title placeholder tile.
  - Title (serif), author (sans).
  - 5-star row: click to set, click same star to clear.
  - Hover-revealed remove button (top-right).

Data layer: TanStack Query + server functions wrapping Supabase with `requireSupabaseAuth`. Mutations invalidate the `books` query.

## Design

- Warm off-white background (`#faf7f2`), ink-dark foreground.
- Serif (Lora) for book titles and headings; Inter for UI.
- Subtle card shadow, thin borders, generous whitespace.
- Tokens defined in `src/styles.css` (oklch).

## Technical notes

- Server fns in `src/lib/books.functions.ts`: `listBooks`, `addBook`, `updateBook` (shelf/stars), `deleteBook`.
- Anonymous sign-in via `supabase.auth.signInAnonymously()` on mount if no session.
- Optimistic updates for star clicks and shelf moves.
- Cover URL helper returns `null` when no ISBN → render placeholder.
