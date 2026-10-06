import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  Copy,
  Edit3,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface SparkRegistrationSummaryData {
  registrationNo: string;
  fullName: string;
  scholarNumber: string;
  email: string;
  phone: string;
  primaryTrack: string;
  secondaryTrack?: string | undefined;
  portfolioUrl?: string | undefined;
  motivation?: string | undefined;
  isUpdated?: boolean | undefined;
  sheetSynced?: boolean | undefined;
}

interface SparkConfirmationFlipCardProps {
  data: SparkRegistrationSummaryData;
  onEdit: () => void;
  onNewApplication: () => void;
}

export const SPARK_SOCIAL_LINKS = [
  {
    name: "Instagram",
    handle: "@spark_iiitbhopal",
    url: "https://instagram.com/spark_iiitbhopal",
    tag: "IG",
    accent: "#E1306C",
    accentBorder: "rgba(225, 48, 108, 0.45)",
    accentGlow: "rgba(225, 48, 108, 0.25)",
    detail: "Event teasers, live updates & stories",
  },
  {
    name: "LinkedIn",
    handle: "SPARK — Technical Society IIIT Bhopal",
    url: "https://linkedin.com/company/spark-iiit-bhopal",
    tag: "IN",
    accent: "#0A66C2",
    accentBorder: "rgba(10, 102, 194, 0.45)",
    accentGlow: "rgba(10, 102, 194, 0.25)",
    detail: "Official announcements & technical network",
  },
  {
    name: "WhatsApp Community",
    handle: "Join First-Year Community",
    url: "https://chat.whatsapp.com/invite/spark-2026-firstyears",
    tag: "WA",
    accent: "#25D366",
    accentBorder: "rgba(37, 211, 102, 0.45)",
    accentGlow: "rgba(37, 211, 102, 0.25)",
    detail: "Live Q&A, Phase A tasks & team forming",
  },
] as const;

export function SparkConfirmationFlipCard({
  data,
  onEdit,
  onNewApplication,
}: SparkConfirmationFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [animStage, setAnimStage] = useState<
    "idle" | "saving" | "saved" | "lift" | "energy" | "midpoint" | "flipped" | "back_content" | "socials"
  >("idle");
  const [buttonState, setButtonState] = useState<"idle" | "saving" | "saved">("idle");
  const [copied, setCopied] = useState(false);

  // Check for prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleSaveResponse = () => {
    if (animStage !== "idle") return;

    if (prefersReducedMotion) {
      setButtonState("saved");
      setIsFlipped(true);
      setAnimStage("socials");
      return;
    }

    // Choreographed Timeline:
    // 0ms: Button compresses & switches to "SAVING..."
    setButtonState("saving");
    setAnimStage("saving");

    // 140ms: Button switches to "✓ SAVED" with checkmark drawing
    setTimeout(() => {
      setButtonState("saved");
      setAnimStage("saved");
    }, 140);

    // 240ms: Card lifts toward viewer (scale + translateY + rotateX)
    setTimeout(() => {
      setAnimStage("lift");
    }, 240);

    // 380ms: Energy border line circuits around card perimeter
    setTimeout(() => {
      setAnimStage("energy");
    }, 380);

    // 520ms: Thunderbolt activates at card center
    setTimeout(() => {
      setAnimStage("midpoint");
    }, 520);

    // 680ms: 3D Card Flip rotation begins
    setTimeout(() => {
      setIsFlipped(true);
    }, 680);

    // 1300ms: Card rotation completes, back face typography begins
    setTimeout(() => {
      setAnimStage("back_content");
    }, 1300);

    // 1550ms+: Staggered social cards reveal
    setTimeout(() => {
      setAnimStage("socials");
    }, 1550);
  };

  const handleFlipToFront = () => {
    setIsFlipped(false);
    setAnimStage("idle");
    setButtonState("saved");
  };

  const handleCopyRegNo = () => {
    if (!data.registrationNo) return;
    navigator.clipboard.writeText(data.registrationNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLifting = animStage === "lift" || animStage === "energy" || animStage === "midpoint";
  const hasEnergyBorder = animStage === "energy" || animStage === "midpoint";
  const showMidpointBolt = animStage === "midpoint";
  const showBackContent = animStage === "back_content" || animStage === "socials";
  const showSocials = animStage === "socials";

  return (
    <div className="perspective-1400 relative w-full select-none">
      {/* 3D Physical Card Wrapper */}
      <div
        className={`transform-style-3d relative w-full transition-all ${
          isFlipped ? "rotate-y-180" : "rotate-y-0"
        } ${isLifting ? "-translate-y-2 scale-[1.015]" : "translate-y-0 scale-100"}`}
        style={{
          transitionDuration: "850ms",
          transitionTimingFunction: "cubic-bezier(0.25, 1, 0.35, 1)",
          transformOrigin: "center center",
        }}
      >
        {/* ========================================================================= */}
        {/* FRONT FACE OF 3D CARD */}
        {/* ========================================================================= */}
        <div
          className={`backface-hidden relative border-2 border-foreground bg-card p-6 shadow-[10px_10px_0_var(--secondary)] transition-shadow duration-500 sm:p-8 ${
            isLifting ? "shadow-[16px_18px_0_var(--secondary),0_20px_40px_rgba(0,0,0,0.15)]" : ""
          }`}
          style={{
            transform: "rotateY(0deg)",
          }}
        >
          {/* Traveling Energy Border on Perimeter */}
          {hasEnergyBorder && (
            <div
              className="pointer-events-none absolute -inset-[2px] z-30 transition-opacity duration-300 opacity-100"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(190, 242, 100, 0.9) 50%, rgba(168, 85, 247, 0.9) 100%)",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                WebkitMaskComposite: "xor",
                padding: "2.5px",
              }}
            />
          )}

          {/* Center Thunderbolt Visual during Energy Ignition */}
          {showMidpointBolt && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-[2px] transition-all duration-300">
              <div className="relative flex size-20 items-center justify-center rounded-2xl bg-black/90 border border-purple-500/60 shadow-[0_0_40px_rgba(168,85,247,0.7)] animate-in zoom-in-75 duration-300">
                <svg viewBox="0 0 32 32" fill="none" className="size-11 spark-thunderbolt-glow">
                  <defs>
                    <linearGradient id="frontBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#bef264" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M18.5 2L5.5 17H15L13.5 30L26.5 15H17L18.5 2Z"
                    fill="url(#frontBoltGrad)"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Status Header */}
          <div className="mb-6 grid size-14 place-items-center bg-secondary">
            <Check className="size-8 stroke-[2.5]" />
          </div>

          <p className="text-xs font-extrabold uppercase text-primary">
            {data.isUpdated ? "Application updated" : "Registration complete"}
          </p>

          <h3 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
            {data.isUpdated ? "Changes saved." : "You’re in."}
          </h3>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {data.isUpdated
              ? "Your updated application is synced with the organizers."
              : "Save your registration number. The Spark team will use your email for updates."}
          </p>

          {/* Candidate Registration Details Card */}
          <div className="mt-6 space-y-4 border border-foreground bg-background p-5">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Registration Number</span>
                <p className="mt-0.5 text-2xl font-extrabold text-primary tracking-tight">
                  {data.registrationNo}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyRegNo}
                className="h-8 gap-1.5 px-2 text-xs font-bold"
              >
                {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Candidate Name</span>
                <p className="font-bold">{data.fullName || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Scholar Number</span>
                <p className="font-bold uppercase">{data.scholarNumber || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Email</span>
                <p className="font-semibold break-all text-xs sm:text-sm">{data.email || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Phone</span>
                <p className="font-semibold">{data.phone || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Primary Track</span>
                <p className="font-bold text-primary">{data.primaryTrack || "—"}</p>
              </div>
              {data.secondaryTrack && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Second Track</span>
                  <p className="font-semibold">{data.secondaryTrack}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions on Front Face */}
          <div className="mt-6 flex flex-col gap-3">
            {/* STEP 1: Animated SAVE RESPONSE Button */}
            <Button
              type="button"
              variant="electric"
              size="lg"
              onClick={handleSaveResponse}
              disabled={buttonState === "saving"}
              className={`group relative w-full overflow-hidden text-base font-black uppercase tracking-wider transition-all duration-200 shadow-[4px_4px_0_var(--foreground)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                buttonState === "saving" ? "scale-[0.975] opacity-95" : "scale-100"
              }`}
            >
              {buttonState === "saved" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="size-5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
                  </svg>
                  SAVED
                </span>
              ) : buttonState === "saving" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-2 rounded-full bg-foreground animate-ping" />
                  SAVING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  SAVE RESPONSE
                  <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              )}
            </Button>

            <div className="flex flex-wrap gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 sm:flex-initial text-xs font-bold"
              >
                <Edit3 className="mr-1.5 size-3.5" /> Edit details
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onNewApplication}
                className="flex-1 sm:flex-initial text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1.5 size-3.5" /> Another response
              </Button>
            </div>
          </div>

          {data.sheetSynced === false && (
            <p className="mt-4 text-xs text-muted-foreground">Your application is safely stored in Supabase.</p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* BACK FACE OF 3D CARD (SPARK 26–27 SOCIAL REVEAL) */}
        {/* ========================================================================= */}
        <div
          className="backface-hidden rotate-y-180 absolute inset-0 z-20 flex flex-col justify-between border-2 border-purple-500/50 bg-[#0c0a17] p-6 text-white shadow-[10px_10px_0_rgba(168,85,247,0.4),0_20px_50px_rgba(0,0,0,0.6)] sm:p-8"
          style={{
            transform: "rotateY(180deg)",
            boxShadow: "0 0 0 1px rgba(168,85,247,0.4), 10px 10px 0 #a855f7, 0 25px 50px -10px rgba(0,0,0,0.8)",
          }}
        >
          {/* Ambient Background Radial Glows */}
          <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-cyan-500/15 blur-3xl" />

          {/* Top Section: Thunderbolt & Kinetic Typography */}
          <div className="relative z-10 text-center">
            {/* Geometric Thunderbolt at Top */}
            <div className="flex justify-center">
              <div
                className={`relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-950 to-black border border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all ${
                  showBackContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
                }`}
                style={{
                  transitionDuration: "400ms",
                  transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <svg viewBox="0 0 32 32" fill="none" className="size-8 spark-thunderbolt-glow">
                  <defs>
                    <linearGradient id="backBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="45%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#bef264" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M18.5 2L5.5 17H15L13.5 30L26.5 15H17L18.5 2Z"
                    fill="url(#backBoltGrad)"
                    stroke="#ffffff"
                    strokeWidth="0.75"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* STEP 6: Kinetic Typography ("FEEL THE SPARK.") */}
            <div className="mt-4">
              <p
                className={`font-display text-2xl uppercase tracking-wider text-neutral-300 transition-all ${
                  showBackContent ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                }`}
                style={{ transitionDuration: "450ms", transitionDelay: "60ms" }}
              >
                FEEL THE
              </p>

              <h2
                className={`font-display text-5xl sm:text-6xl uppercase leading-[0.88] tracking-tight bg-gradient-to-r from-purple-400 via-purple-300 to-lime-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all ${
                  showBackContent ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
                }`}
                style={{
                  transitionDuration: "500ms",
                  transitionDelay: "140ms",
                  transitionTimingFunction: "cubic-bezier(0.34, 1.3, 0.64, 1)",
                }}
              >
                SPARK.
              </h2>

              <p
                className={`mt-2 text-xs sm:text-sm font-semibold text-neutral-300 transition-all ${
                  showBackContent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
                style={{ transitionDuration: "450ms", transitionDelay: "240ms" }}
              >
                You&apos;re officially part of{" "}
                <span className="font-extrabold text-lime-300">SPARK 26–27</span>.
              </p>
            </div>

            {/* Stylish Divider */}
            <div
              className={`my-4 flex items-center justify-center gap-3 transition-all ${
                showBackContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
              }`}
              style={{ transitionDuration: "400ms", transitionDelay: "300ms" }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
              <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">
                STAY CONNECTED
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* STEP 7: Staggered Interactive Social Cards */}
            <div className="space-y-2 text-left">
              {SPARK_SOCIAL_LINKS.map((link, idx) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.08] active:scale-[0.98] ${
                    showSocials
                      ? "translate-y-0 opacity-100 scale-100"
                      : "translate-y-3 opacity-0 scale-[0.97]"
                  }`}
                  style={{
                    transitionDelay: showSocials ? `${idx * 110}ms` : "0ms",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = link.accentBorder;
                    e.currentTarget.style.boxShadow = `0 4px 20px -4px ${link.accentGlow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 items-center justify-center rounded-md font-mono text-[11px] font-extrabold text-white transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: link.accent,
                        boxShadow: `0 0 12px ${link.accentGlow}`,
                      }}
                    >
                      {link.tag}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-bold text-white transition group-hover:text-purple-300">
                          {link.name}
                        </p>
                        <ExternalLink className="size-3 text-neutral-500 opacity-0 transition duration-200 group-hover:opacity-100 group-hover:text-purple-300" />
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono tracking-tight">
                        {link.handle}
                      </p>
                    </div>
                  </div>

                  <div className="flex size-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition-all duration-300 group-hover:translate-x-1 group-hover:border-purple-400 group-hover:bg-purple-500 group-hover:text-white">
                    <ArrowUpRight className="size-3.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom Controls on Back Face */}
          <div
            className={`mt-4 pt-3 border-t border-white/10 flex items-center justify-between transition-all ${
              showSocials ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{ transitionDuration: "400ms", transitionDelay: "450ms" }}
          >
            <button
              type="button"
              onClick={handleFlipToFront}
              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-white transition group"
            >
              <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              <span>View registration details</span>
            </button>

            <button
              type="button"
              onClick={onNewApplication}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-300 transition"
            >
              New application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
