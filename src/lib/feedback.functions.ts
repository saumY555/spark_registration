import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface FeedbackNote {
  id: string;
  message: string;
  authorName?: string | null;
  color: "yellow" | "lime" | "pink" | "peach" | "blue";
  rotation: number;
  status: "approved" | "hidden";
  createdAt: string;
}

// Zod validation for feedback note submissions
export const createNoteSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "Please write at least 2 characters.")
    .max(300, "Notes cannot exceed 300 characters."),
  authorName: z
    .string()
    .trim()
    .max(40, "Name cannot exceed 40 characters.")
    .optional(),
  color: z.enum(["yellow", "lime", "pink", "peach", "blue"]).default("yellow"),
  rotation: z.number().min(-12).max(12).optional(),
});

// Seed notes inspired by the physical club wall photo for initial ambiance
const initialSeedNotes: FeedbackNote[] = [
  {
    id: "seed-1",
    message: "Loved the web track workshop! Super excited to deploy my first website with Spark Club 🔥",
    authorName: "Saumy",
    color: "yellow",
    rotation: -2.5,
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "seed-2",
    message: "CRAZY STICKERS !!! THE VIBE IS UNMATCHED ⚡",
    authorName: "1st Year Builder",
    color: "lime",
    rotation: 4.2,
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: "seed-3",
    message: "All is Well :) Ready for Day 2 Team Challenge!",
    authorName: "Priyanshu",
    color: "pink",
    rotation: -4.0,
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "seed-4",
    message: "Can't believe my portfolio is working live on Vercel already. Thanks seniors!",
    authorName: "Rohit",
    color: "peach",
    rotation: 3.1,
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "seed-5",
    message: "THE CHAOS :) Best recruitment event ever. More hands-on sessions please!",
    authorName: null,
    color: "lime",
    rotation: -1.8,
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: "seed-6",
    message: "DIEC 129 supremacy! Great energy in the auditorium today 🚀",
    authorName: "Dev",
    color: "blue",
    rotation: 5.5,
    status: "approved",
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

// Fallback in-memory list for local persistence and offline resilience
const localNotesCache: FeedbackNote[] = [...initialSeedNotes];

// Basic memory rate-limiting store (timestamp of last post per IP/key)
const lastSubmissionTimestamps = new Map<string, number>();

/**
 * Server Function: Get all approved feedback notes for the wall
 */
export const getFeedbackNotes = createServerFn({ method: "GET" })
  .validator((d: { limit?: number } = {}) => {
    return {
      limit: Math.min(Math.max(d?.limit ?? 50, 1), 100),
    };
  })
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: records, error } = await supabaseAdmin
        .from("feedback_notes")
        .select("id, message, author_name, color, rotation, status, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (!error && records && records.length > 0) {
        return {
          notes: records.map((r) => ({
            id: r.id,
            message: r.message,
            authorName: r.author_name,
            color: (r.color as FeedbackNote["color"]) || "yellow",
            rotation: Number(r.rotation) || 0,
            status: r.status as "approved",
            createdAt: r.created_at,
          })),
        };
      }
    } catch (err) {
      console.warn("[getFeedbackNotes db read fallback]", err);
    }

    // Return in-memory notes if DB is empty or during local dev
    return {
      notes: [...localNotesCache].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  });

/**
 * Server Function: Submit a new sticky note to the Feedback Wall
 */
export const submitFeedbackNote = createServerFn({ method: "POST" })
  .validator((raw: unknown) => {
    return createNoteSchema.parse(raw);
  })
  .handler(async ({ data }) => {
    // Generate natural random rotation if not provided (-5° to +5°)
    const finalRotation =
      typeof data.rotation === "number"
        ? Math.round(data.rotation * 10) / 10
        : Math.round((Math.random() * 10 - 5) * 10) / 10;

    const newNote: FeedbackNote = {
      id: crypto.randomUUID(),
      message: data.message.trim(),
      authorName: data.authorName?.trim() || null,
      color: data.color,
      rotation: finalRotation,
      status: "approved",
      createdAt: new Date().toISOString(),
    };

    // 1. Save to Supabase feedback_notes table
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: record, error } = await supabaseAdmin
        .from("feedback_notes")
        .insert({
          id: newNote.id,
          message: newNote.message,
          author_name: newNote.authorName,
          color: newNote.color,
          rotation: newNote.rotation,
          status: "approved",
        })
        .select("id, created_at")
        .maybeSingle();

      if (error) {
        console.warn("[submitFeedbackNote DB warning]", error.message);
      } else if (record?.id) {
        newNote.id = record.id;
        newNote.createdAt = record.created_at;
      }
    } catch (dbErr) {
      console.warn("[submitFeedbackNote DB error]", dbErr);
    }

    // 2. Prepend to local memory cache
    localNotesCache.unshift(newNote);
    if (localNotesCache.length > 200) {
      localNotesCache.pop();
    }

    return {
      success: true,
      note: newNote,
    };
  });
