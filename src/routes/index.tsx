import { useMemo, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, BookOpen, LogOut } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  addBook,
  deleteBook,
  listBooks,
  updateBook,
  SHELVES,
  type Shelf,
} from "@/lib/books.functions";
import { BookCard, type Book } from "@/components/books/BookCard";
import { AddBookForm } from "@/components/books/AddBookForm";

const SHELF_LABELS: Record<Shelf, string> = {
  currently_reading: "Currently Reading",
  on_hold: "On Hold",
  to_read: "To Read",
  finished: "Finished",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Reading Life" },
      { name: "description", content: "Track the books you're reading, holding, planning, and have finished." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: ShelvesPage,
});

function ShelvesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listBooks);
  const add = useServerFn(addBook);
  const update = useServerFn(updateBook);
  const remove = useServerFn(deleteBook);

  const [shelf, setShelf] = useState<Shelf>("currently_reading");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: () => list(),
  });

  const counts = useMemo(() => {
    const c: Record<Shelf, number> = { currently_reading: 0, on_hold: 0, to_read: 0, finished: 0 };
    for (const b of books) c[b.shelf as Shelf] = (c[b.shelf as Shelf] || 0) + 1;
    return c;
  }, [books]);

  const visible = books.filter((b) => b.shelf === shelf);

  const addMut = useMutation({
    mutationFn: (v: { title: string; author: string; isbn: string }) =>
      add({ data: { ...v, shelf } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setAdding(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rateMut = useMutation({
    mutationFn: ({ id, stars }: { id: string; stars: number }) =>
      update({ data: { id, stars } }),
    onMutate: async ({ id, stars }) => {
      await qc.cancelQueries({ queryKey: ["books"] });
      const prev = qc.getQueryData<Book[]>(["books"]);
      qc.setQueryData<Book[]>(["books"], (old) =>
        (old ?? []).map((b) => (b.id === id ? { ...b, stars } : b)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["books"], ctx.prev); toast.error("Couldn't update rating."); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["books"] });
      const prev = qc.getQueryData<Book[]>(["books"]);
      qc.setQueryData<Book[]>(["books"], (old) => (old ?? []).filter((b) => b.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["books"], ctx.prev); toast.error("Couldn't remove book."); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });

  const editMut = useMutation({
    mutationFn: (v: { id: string; title: string; author: string; isbn: string }) =>
      update({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveMut = useMutation({
    mutationFn: ({ id, shelf: s }: { id: string; shelf: Shelf }) =>
      update({ data: { id, shelf: s } }),
    onMutate: async ({ id, shelf: s }) => {
      await qc.cancelQueries({ queryKey: ["books"] });
      const prev = qc.getQueryData<Book[]>(["books"]);
      qc.setQueryData<Book[]>(["books"], (old) =>
        (old ?? []).map((b) => (b.id === id ? { ...b, shelf: s } : b)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["books"], ctx.prev); toast.error("Couldn't move book."); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-accent" />
            <h1 className="font-serif text-2xl tracking-tight">My Reading Life</h1>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap gap-1 border-b border-border mb-6 -mx-1">
          {SHELVES.map((s) => {
            const active = s === shelf;
            return (
              <button
                key={s}
                onClick={() => setShelf(s)}
                className={`relative px-3 py-2.5 text-sm font-medium transition flex items-center gap-2 ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="font-serif">{SHELF_LABELS[s]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {counts[s]}
                </span>
                {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent" />}
              </button>
            );
          })}
        </nav>

        <div className="mb-6">
          {adding ? (
            <AddBookForm
              onSave={(v) => addMut.mutate(v)}
              onCancel={() => setAdding(false)}
              saving={addMut.isPending}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent hover:bg-card transition"
            >
              <Plus className="h-4 w-4" /> Add a book
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground italic">Pulling books from the shelf…</p>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif italic text-lg text-muted-foreground">
              No books on this shelf yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Add one above to get started.</p>
          </div>
        ) : (
          <div
            className="grid gap-x-5 gap-y-7"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
          >
            {visible.map((b) => (
              editingId === b.id ? (
                <div key={b.id} className="col-span-full">
                  <AddBookForm
                    initial={{ title: b.title, author: b.author, isbn: b.isbn }}
                    submitLabel="Save changes"
                    saving={editMut.isPending}
                    onCancel={() => setEditingId(null)}
                    onSave={(v) => editMut.mutate({ id: b.id, ...v })}
                  />
                </div>
              ) : (
                <BookCard
                  key={b.id}
                  book={b as Book}
                  onRate={(stars) => rateMut.mutate({ id: b.id, stars })}
                  onRemove={() => removeMut.mutate(b.id)}
                  onEdit={() => setEditingId(b.id)}
                  onMove={(s) => moveMut.mutate({ id: b.id, shelf: s as Shelf })}
                />
              )
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
