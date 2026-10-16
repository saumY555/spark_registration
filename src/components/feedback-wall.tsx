import { useState, useEffect, useRef, type KeyboardEvent, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Loader2,
  Clock,
  RotateCcw,
  Check,
  MessageSquare,
  AlertCircle,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getFeedbackNotes,
  submitFeedbackNote,
  type FeedbackNote,
} from "@/lib/feedback.functions";

type NoteColor = FeedbackNote["color"];

interface FeedbackWallProps {
  /** Optional title override */
  title?: string;
  /** Optional custom container class */
  className?: string;
  /** Whether to show a compact or full view */
  compact?: boolean;
}

// Color palette configuration matching physical sticky note paper
export const NOTE_COLOR_CONFIG: Record<
  NoteColor,
  {
    name: string;
    bgClass: string;
    tapeClass: string;
    borderClass: string;
    badgeDot: string;
    ringClass: string;
  }
> = {
  yellow: {
    name: "Classic Yellow",
    bgClass: "bg-[#FEF08A] text-slate-900",
    tapeClass: "bg-[#FACC15]/40",
    borderClass: "border-[#EAB308]/40",
    badgeDot: "bg-[#FACC15]",
    ringClass: "ring-[#EAB308]",
  },
  lime: {
    name: "Neon Lime",
    bgClass: "bg-[#D9F99D] text-slate-900",
    tapeClass: "bg-[#A3E635]/40",
    borderClass: "border-[#84CC16]/40",
    badgeDot: "bg-[#84CC16]",
    ringClass: "ring-[#84CC16]",
  },
  pink: {
    name: "Bubblegum Pink",
    bgClass: "bg-[#FBCFE8] text-slate-900",
    tapeClass: "bg-[#F472B6]/40",
    borderClass: "border-[#EC4899]/40",
    badgeDot: "bg-[#EC4899]",
    ringClass: "ring-[#EC4899]",
  },
  peach: {
    name: "Peach Glow",
    bgClass: "bg-[#FED7AA] text-slate-900",
    tapeClass: "bg-[#FB923C]/40",
    borderClass: "border-[#F97316]/40",
    badgeDot: "bg-[#F97316]",
    ringClass: "ring-[#F97316]",
  },
  blue: {
    name: "Sky Blue",
    bgClass: "bg-[#BAE6FD] text-slate-900",
    tapeClass: "bg-[#38BDF8]/40",
    borderClass: "border-[#0EA5E9]/40",
    badgeDot: "bg-[#0EA5E9]",
    ringClass: "ring-[#0EA5E9]",
  },
};

// Friendly relative time helper
function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return "recently";
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

    if (diffSeconds < 45) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "recently";
  }
}

export function FeedbackWall({ title = "FEEDBACK WALL", className, compact = false }: FeedbackWallProps) {
  const getNotesFn = useServerFn(getFeedbackNotes);
  const submitNoteFn = useServerFn(submitFeedbackNote);

  const [notes, setNotes] = useState<FeedbackNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Input states
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");
  const [activeFilter, setActiveFilter] = useState<NoteColor | "all">("all");

  // Track recently posted note IDs for entry animations
  const [recentlyPostedId, setRecentlyPostedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch initial notes
  const fetchNotes = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setFetchError("");
    try {
      const res = await getNotesFn({ data: { limit: 60 } });
      if (res?.notes) {
        setNotes((prevNotes) => {
          // Merge and deduplicate by id
          const existingIds = new Set(prevNotes.map((n) => n.id));
          const newUniqueNotes = res.notes.filter((n) => !existingIds.has(n.id));
          if (newUniqueNotes.length === 0 && prevNotes.length === res.notes.length) {
            return prevNotes;
          }
          return res.notes;
        });
      }
    } catch (err) {
      console.warn("[FeedbackWall fetch error]", err);
      if (!silent) setFetchError("Unable to load feedback notes. Please try again.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();

    // 1. Supabase Realtime Subscription (Live Notes without refreshing)
    let channel: any = null;
    try {
      import("@/integrations/supabase/client").then(({ supabase }) => {
        try {
          channel = supabase
            .channel("feedback_notes_live")
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "feedback_notes" },
              (payload) => {
                if (payload.new && payload.new.status === "approved") {
                  const incomingNote: FeedbackNote = {
                    id: payload.new.id,
                    message: payload.new.message,
                    authorName: payload.new.author_name,
                    color: (payload.new.color as NoteColor) || "yellow",
                    rotation: Number(payload.new.rotation) || 0,
                    status: "approved",
                    createdAt: payload.new.created_at,
                  };

                  setNotes((prev) => {
                    if (prev.some((n) => n.id === incomingNote.id)) return prev;
                    return [incomingNote, ...prev];
                  });
                }
              }
            )
            .subscribe();
        } catch (subErr) {
          console.warn("[Realtime subscription skipped]", subErr);
        }
      });
    } catch {
      // Ignore if supabase client module unavailable
    }

    // 2. Periodic Polling Fallback (every 18 seconds)
    const pollInterval = setInterval(() => {
      fetchNotes(true);
    }, 18000);

    return () => {
      clearInterval(pollInterval);
      if (channel) {
        try {
          channel.unsubscribe();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Handle Note Submission
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Please type a message before posting.");
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 300) {
      toast.error("Note cannot exceed 300 characters.");
      return;
    }

    setIsSubmitting(true);
    // Slight randomized tilt for the sticky note (-5° to +5°)
    const randomTilt = Math.round((Math.random() * 10 - 5) * 10) / 10;

    try {
      const res = await submitNoteFn({
        data: {
          message: trimmed,
          authorName: authorName.trim() || undefined,
          color: selectedColor,
          rotation: randomTilt,
        },
      });

      if (res?.success && res.note) {
        // Prepend new note immediately to local state
        setRecentlyPostedId(res.note.id);
        setNotes((prev) => [res.note, ...prev.filter((n) => n.id !== res.note.id)]);

        // Reset composer
        setMessage("");
        // Retain author name for convenience
        toast.success("Sticky note posted to the wall! 📌");

        // Rotate to a fun new color for the next note!
        const colors: NoteColor[] = ["yellow", "lime", "pink", "peach", "blue"];
        const nextColor = colors[(colors.indexOf(selectedColor) + 1) % colors.length] || "yellow";
        setSelectedColor(nextColor);
      }
    } catch (err: any) {
      console.error("[Submit Note Error]", err);
      toast.error(err?.message || "Failed to post note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Enter to submit, Shift + Enter for newline
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Filtered notes
  const filteredNotes = notes.filter((note) => {
    if (activeFilter === "all") return true;
    return note.color === activeFilter;
  });

  return (
    <section
      id="feedback"
      className={cn(
        "relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:px-10",
        className
      )}
    >
      {/* 1. RETRO ARCADE RACING HEADER (Inspired by physical wall photo) */}
      <div className="mb-10 text-center">
        {/* Race-track / Arcade Style Title Badge */}
        <div className="inline-block relative">
          <div className="relative z-10 border-4 border-foreground bg-stage px-8 py-3 text-stage-foreground shadow-[8px_8px_0_var(--foreground)] sm:px-12 sm:py-4">
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-secondary sm:text-sm">
              <span>🏁</span>
              <span>COMMUNITY STICKY BOARD</span>
              <span>🏁</span>
            </div>
            <h2 className="mt-1 font-display text-4xl uppercase tracking-wider text-foreground sm:text-6xl md:text-7xl">
              {title}
            </h2>
          </div>
          {/* Subtle neon shadow line */}
          <div className="absolute -inset-1 -z-10 translate-x-3 translate-y-3 bg-primary/40 blur-[2px]" />
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
          Share your candid thoughts, reactions, favorite moments, or suggestions for the upcoming sessions.
          Press <kbd className="rounded border border-foreground/30 bg-muted px-1.5 py-0.5 text-xs font-bold text-foreground">Enter</kbd> to stick it on the wall!
        </p>
      </div>

      {/* 2. MAIN BOARD CONTAINER (Dark textured background with road track dashed borders) */}
      <div className="relative rounded-2xl border-4 border-foreground bg-[#0a081e] p-5 shadow-[12px_12px_0_var(--foreground)] sm:p-8 md:p-10">
        {/* Decorative Track Boundary Dashed Lines (Inspired by the physical board's racing tape) */}
        <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-dashed border-white/20 sm:inset-4" />
        <div className="pointer-events-none absolute right-4 top-4 text-xs font-black uppercase text-white/30 hidden sm:block">
          SPARK CLUB · IIIT BHOPAL
        </div>

        {/* 3. INTERACTIVE STICKY NOTE COMPOSER ("Leave a note 💬") */}
        <div className="relative z-10 mx-auto mb-12 max-w-xl">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#CCFF00]">
              <Sparkles className="size-3.5" /> Leave a note 💬
            </span>
            <span className="text-[11px] font-bold text-white/60">
              {message.length} / 300
            </span>
          </div>

          {/* Sticky Note Styled Writing Card */}
          <div
            className={cn(
              "relative rounded-lg p-5 shadow-[6px_10px_25px_rgba(0,0,0,0.5)] transition-all duration-300 border-2",
              NOTE_COLOR_CONFIG[selectedColor].bgClass,
              NOTE_COLOR_CONFIG[selectedColor].borderClass
            )}
          >
            {/* Top Adhesive Tape Strip */}
            <div
              className={cn(
                "absolute -top-3 left-1/2 h-5 w-32 -translate-x-1/2 rounded-sm shadow-sm",
                NOTE_COLOR_CONFIG[selectedColor].tapeClass
              )}
            />

            {/* Note Textarea Input */}
            <Textarea
              ref={textareaRef}
              rows={3}
              maxLength={300}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind? Share your feedback, shoutouts, or questions…"
              className="resize-none border-none bg-transparent p-0 text-base font-semibold leading-relaxed text-slate-900 placeholder:text-slate-600/70 focus-visible:ring-0 shadow-none font-sans"
            />

            {/* Bottom Row: Optional Name, Color Picker & Post Action */}
            <div className="mt-4 border-t border-black/10 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Optional Author Signature */}
                <div className="flex-1 min-w-[160px]">
                  <Input
                    placeholder="- Your name or nickname (optional)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={40}
                    className="h-8 border-none bg-black/5 text-xs font-bold text-slate-900 placeholder:text-slate-500/70 focus-visible:ring-1 focus-visible:ring-black/20"
                  />
                </div>

                {/* Color Selector Pills */}
                <div className="flex items-center gap-1.5" title="Choose sticky note color">
                  {(["yellow", "lime", "pink", "peach", "blue"] as NoteColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Select ${NOTE_COLOR_CONFIG[c].name}`}
                      onClick={() => setSelectedColor(c)}
                      className={cn(
                        "size-6 rounded-full border border-black/20 transition-transform hover:scale-110",
                        NOTE_COLOR_CONFIG[c].badgeDot,
                        selectedColor === c && "ring-2 ring-black scale-110"
                      )}
                    >
                      {selectedColor === c && (
                        <Check className="mx-auto size-3 text-slate-900 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Visible Post Button */}
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isSubmitting || !message.trim()}
                  onClick={() => handleSubmit()}
                  className="h-8 px-4 text-xs font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Sticking…
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 size-3" /> Post Note
                    </>
                  )}
                </Button>
              </div>

              {/* Enter Key Hint */}
              <div className="mt-2 text-right">
                <span className="text-[10px] font-bold text-slate-600/80">
                  Press <span className="font-extrabold text-slate-900">Enter ↵</span> to post · <span className="font-extrabold text-slate-900">Shift + Enter</span> for new line
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. FILTER BAR & STATS */}
        <div className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs font-bold text-white">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1 text-xs font-bold uppercase text-[#CCFF00]">
              <MessageSquare className="size-3.5" />
              {notes.length} {notes.length === 1 ? "Note" : "Notes"} Posted
            </span>
          </div>

          {/* Color filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase text-white/50 mr-1 flex items-center gap-1">
              <Filter className="size-3" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
                activeFilter === "all"
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/70 hover:bg-white/15"
              )}
            >
              All
            </button>
            {(["yellow", "lime", "pink", "peach", "blue"] as NoteColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveFilter(c)}
                className={cn(
                  "flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold uppercase transition-colors",
                  activeFilter === c
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/15"
                )}
              >
                <span className={cn("size-2 rounded-full", NOTE_COLOR_CONFIG[c].badgeDot)} />
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 5. NOTES MASONRY WALL BOARD */}
        <div className="relative z-10 min-h-[300px]">
          {/* Loading Skeletons */}
          {isLoading && notes.length === 0 && (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-lg bg-white/10 p-5 shadow-lg"
                  style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (i * 1.2)}deg)` }}
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && fetchError && notes.length === 0 && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center text-white">
              <AlertCircle className="mx-auto size-8 text-destructive" />
              <p className="mt-2 text-sm font-semibold">{fetchError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotes()}
                className="mt-4 border-white/20 text-xs font-bold"
              >
                <RotateCcw className="mr-1.5 size-3.5" /> Retry Loading Notes
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredNotes.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-white">
              <div className="text-4xl">📝</div>
              <h4 className="mt-3 font-display text-2xl uppercase tracking-wider text-white">
                The Board Is Fresh & Waiting!
              </h4>
              <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-white/60">
                Be the first to stick a note on the wall. Type your thoughts above and press Enter!
              </p>
            </div>
          )}

          {/* Real Sticky Notes Grid (Dynamic Scatter / Masonry Layout) */}
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-start">
            {filteredNotes.map((note) => {
              const colorCfg = NOTE_COLOR_CONFIG[note.color] || NOTE_COLOR_CONFIG.yellow;
              const isNewlyPosted = note.id === recentlyPostedId;

              return (
                <div
                  key={note.id}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-md p-5 shadow-[4px_8px_16px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:rotate-0 hover:z-30 hover:shadow-[8px_16px_28px_rgba(0,0,0,0.5)] border",
                    colorCfg.bgClass,
                    colorCfg.borderClass,
                    isNewlyPosted && "animate-note-place"
                  )}
                  style={{
                    transform: `rotate(${note.rotation}deg)`,
                  }}
                >
                  {/* Top Adhesive Tape Strip Effect */}
                  <div
                    className={cn(
                      "absolute -top-2.5 left-1/2 h-4 w-24 -translate-x-1/2 rounded-xs shadow-xs",
                      colorCfg.tapeClass
                    )}
                  />

                  {/* Note Body Message (Preserving line breaks, highly legible) */}
                  <div className="text-sm font-semibold leading-relaxed whitespace-pre-wrap break-words text-slate-900 font-sans">
                    {note.message}
                  </div>

                  {/* Note Footer: Author Tag & Timestamp */}
                  <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-2 text-[11px] font-bold text-slate-700/80">
                    <span className="truncate max-w-[120px]">
                      {note.authorName ? `- ${note.authorName}` : "— Anonymous"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-600/70 shrink-0">
                      <Clock className="size-2.5" />
                      {formatRelativeTime(note.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Sync Footer Indicator */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs font-semibold text-white/50">
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live Updates Active · Notes sync across all browsers
          </span>
          <span>Spark Club Community Board · 2026</span>
        </div>
      </div>
    </section>
  );
}
