import { useState } from "react";
import { Star, X, Pencil } from "lucide-react";

const SHELF_OPTIONS: { value: string; label: string }[] = [
  { value: "currently_reading", label: "Currently Reading" },
  { value: "on_hold", label: "On Hold" },
  { value: "to_read", label: "To Read" },
  { value: "finished", label: "Finished" },
];

export type Book = {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  shelf: string;
  stars: number;
  created_at: string;
};

function coverUrl(isbn: string | null) {
  if (!isbn) return null;
  const clean = isbn.replace(/[^0-9Xx]/g, "");
  if (!clean) return null;
  return `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg?default=false`;
}

export function BookCard({
  book,
  onRate,
  onRemove,
  onEdit,
  onMove,
}: {
  book: Book;
  onRate: (stars: number) => void;
  onRemove: () => void;
  onEdit: () => void;
  onMove: (shelf: string) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = coverUrl(book.isbn);
  const showImage = url && !imgFailed;

  return (
    <div className="group relative">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-secondary border border-border shadow-[0_2px_8px_-2px_rgba(60,40,20,0.18)]">
        {showImage ? (
          <img
            src={url}
            alt={`Cover of ${book.title}`}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center p-3 text-center"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.92 0.03 70) 0%, oklch(0.85 0.04 55) 100%)",
            }}
          >
            <span className="font-serif italic text-[13px] leading-snug text-primary/80 line-clamp-6">
              {book.title}
            </span>
          </div>
        )}

        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={onEdit}
            aria-label="Edit book"
            className="rounded-full bg-background/90 backdrop-blur p-1 shadow hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            aria-label="Remove book"
            className="rounded-full bg-background/90 backdrop-blur p-1 shadow hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="font-serif text-sm leading-snug text-foreground line-clamp-2">
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
            {book.author}
          </p>
        )}
        <div className="mt-1.5 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= book.stars;
            return (
              <button
                key={n}
                onClick={() => onRate(n === book.stars ? 0 : n)}
                aria-label={`Rate ${n} stars`}
                className="p-0.5 -m-0.5"
              >
                <Star
                  className={`h-3.5 w-3.5 transition ${filled ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground/40 hover:text-[var(--gold)]"}`}
                />
              </button>
            );
          })}
        </div>
        <select
          value={book.shelf}
          onChange={(e) => onMove(e.target.value)}
          aria-label="Move to shelf"
          className="mt-1.5 w-full text-[10px] bg-transparent text-muted-foreground border border-border/60 rounded px-1 py-0.5 hover:text-foreground hover:border-accent focus:outline-none focus:border-accent cursor-pointer"
        >
          {SHELF_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Move to: {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
