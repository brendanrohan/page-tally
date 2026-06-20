## Goal

Make the shelves feel like an actual bookshelf instead of a tab switcher. All four shelves are visible at once as horizontal color-coded bands, each holding the books on that shelf.

## What changes

**`src/routes/index.tsx`**
- Remove the shelf tab nav and the `shelf` filter state.
- Render all 4 shelves stacked vertically as full-width "bands":
  1. Currently Reading
  2. On Hold
  3. To Read
  4. Finished
- Each band has:
  - A left edge accent stripe in its shelf color + shelf name + count
  - A horizontally-scrolling row of `BookCard`s on that shelf (so a band with many books doesn't break the layout)
  - An empty-state line ("Nothing here yet") when the shelf is empty
- The "Add book" button stays in the header and defaults new books to "Currently Reading" (or opens the existing form which lets the user pick).

**`src/styles.css`**
- Add 4 semantic shelf color tokens to `@theme inline` so each band has a distinct, on-brand accent (warm literary palette — e.g. terracotta, mustard, sage, ink). No hardcoded hex in components.

**`src/components/books/BookCard.tsx`**
- No behavior change. Minor tweak so cards work inside a horizontal scroll row (fixed width, `shrink-0`).

## Out of scope

- No changes to data, mutations, auth, or the Add/Edit form.
- No drag-and-drop between shelves — the existing shelf dropdown on each card still handles moves.

## Visual sketch

```text
┌──────────────────────────────────────────────────────┐
│ ▌ Currently Reading · 2                              │
│ ▌ [book] [book]  →                                   │
├──────────────────────────────────────────────────────┤
│ ▌ On Hold · 1                                        │
│ ▌ [book]  →                                          │
├──────────────────────────────────────────────────────┤
│ ▌ To Read · 5                                        │
│ ▌ [book] [book] [book] [book] [book]  →              │
├──────────────────────────────────────────────────────┤
│ ▌ Finished · 12                                      │
│ ▌ [book] [book] [book] …                             │
└──────────────────────────────────────────────────────┘
```
