import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SHELVES = ["currently_reading", "on_hold", "to_read", "finished"] as const;
export type Shelf = (typeof SHELVES)[number];

const shelfSchema = z.enum(SHELVES);

export const listBooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("books")
      .select("id, title, author, isbn, shelf, stars, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      title: z.string().trim().min(1).max(300),
      author: z.string().trim().max(200).optional().default(""),
      isbn: z.string().trim().max(20).optional().default(""),
      shelf: shelfSchema.default("to_read"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("books")
      .insert({
        user_id: context.userId,
        title: data.title,
        author: data.author || null,
        isbn: data.isbn || null,
        shelf: data.shelf,
      })
      .select("id, title, author, isbn, shelf, stars, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      shelf: shelfSchema.optional(),
      stars: z.number().int().min(0).max(5).optional(),
      title: z.string().trim().min(1).max(300).optional(),
      author: z.string().trim().max(200).optional(),
      isbn: z.string().trim().max(20).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: { shelf?: Shelf; stars?: number; title?: string; author?: string | null; isbn?: string | null } = {};
    if (data.shelf !== undefined) patch.shelf = data.shelf;
    if (data.stars !== undefined) patch.stars = data.stars;
    if (data.title !== undefined) patch.title = data.title;
    if (data.author !== undefined) patch.author = data.author || null;
    if (data.isbn !== undefined) patch.isbn = data.isbn || null;
    const { error } = await context.supabase
      .from("books")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("books").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
