import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export function AddBookForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (v: { title: string; author: string; isbn: string }) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const submit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), author: author.trim(), isbn: isbn.trim() });
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-[2fr_1.4fr_0.9fr]">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Title (required)"
          className="px-3 py-2 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring font-serif"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Author"
          className="px-3 py-2 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          onKeyDown={handleKey}
          placeholder="ISBN"
          className="px-3 py-2 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">Enter</kbd> to save · <kbd className="px-1 py-0.5 rounded bg-secondary border border-border">Esc</kbd> to cancel</span>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm hover:bg-secondary">Cancel</button>
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add book"}
          </button>
        </div>
      </div>
    </div>
  );
}
