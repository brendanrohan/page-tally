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

const SHELF_COLOR: Record<Shelf, string> = {
  currently_reading: "var(--color-shelf-reading)",
  on_hold: "var(--color-shelf-hold)",
  to_read: "var(--color-shelf-toread)",
  finished: "var(--color-shelf-finished)",
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

  const byShelf = useMemo(() => {
    const m: Record<Shelf, Book[]> = { currently_reading: [], on_hold: [], to_read: [], finished: [] };
    for (const b of books) (m[b.shelf as Shelf] ||= []).push(b as Book);
    return m;
  }, [books]);

  const addMut = useMutation({
    mutationFn: (v: { title: string; author: string; isbn: string }) =>
      add({ data: { ...v, shelf: "currently_reading" } }),
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
        ) : (
          <div className="space-y-8">
            {SHELVES.map((s) => {
              const items = byShelf[s];
              const color = SHELF_COLOR[s];
              return (
                <section key={s} className="relative">
                  <div
                    className="flex items-baseline gap-3 pl-4 border-l-4 mb-3"
                    style={{ borderColor: color }}
                  >
                    <h2 className="font-serif text-xl tracking-tight">{SHELF_LABELS[s]}</h2>
                    <span
                      className="text-[11px] uppercase tracking-wider font-medium"
                      style={{ color }}
                    >
                      {counts[s]} {counts[s] === 1 ? "book" : "books"}
                    </span>
                  </div>
                  <div
                    className="rounded-md pl-4 pr-2 py-4 border-l-4 bg-card/40"
                    style={{ borderColor: color }}
                  >
                    {items.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground py-6">
                        Nothing here yet.
                      </p>
                    ) : (
                      <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1">
                        {items.map((b) =>
                          editingId === b.id ? (
                            <div key={b.id} className="w-full min-w-0">
                              <AddBookForm
                                initial={{ title: b.title, author: b.author, isbn: b.isbn }}
                                submitLabel="Save changes"
                                saving={editMut.isPending}
                                onCancel={() => setEditingId(null)}
                                onSave={(v) => editMut.mutate({ id: b.id, ...v })}
                              />
                            </div>
                          ) : (
                            <div key={b.id} className="w-[140px] shrink-0">
                              <BookCard
                                book={b}
                                onRate={(stars) => rateMut.mutate({ id: b.id, stars })}
                                onRemove={() => removeMut.mutate(b.id)}
                                onEdit={() => setEditingId(b.id)}
                                onMove={(ns) => moveMut.mutate({ id: b.id, shelf: ns as Shelf })}
                              />
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
