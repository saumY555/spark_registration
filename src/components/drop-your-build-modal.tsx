import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  Upload,
  RotateCcw,
  Globe,
  Github,
  Loader2,
  ChevronRight,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitBuild, isSafePublicUrl } from "@/lib/build-submission.functions";
import { isValidScholarNumber } from "@/lib/registration.functions";
import { renderInstagramStoryPoster, dataUrlToFile } from "@/lib/poster-generator";
import { SparkStoryStage } from "@/components/spark-story-stage";

interface DropYourBuildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "form" | "poster";

export function DropYourBuildModal({ open, onOpenChange }: DropYourBuildModalProps) {
  const submitBuildFn = useServerFn(submitBuild);

  const [step, setStep] = useState<Step>("form");

  // Form inputs
  const [scholarNumber, setScholarNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manual screenshot upload state
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poster & Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [customCaption, setCustomCaption] = useState(
    "Hey, I am DFB and excited to share my first website! 🚀🔥\n\nSharing my build with Spark Club @spark_iiitb.\n\n#SparkClub #FirstWebsite #BuildInPublic #WebDevelopment"
  );

  // Pre-fill from existing registration if saved in localStorage
  useEffect(() => {
    if (open && step === "form" && !scholarNumber) {
      try {
        const saved = localStorage.getItem("sgt26_registration");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.formValues) {
            if (parsed.formValues.scholarNumber) setScholarNumber(parsed.formValues.scholarNumber);
            if (parsed.formValues.fullName) setStudentName(parsed.formValues.fullName);
            if (parsed.formValues.portfolioUrl && parsed.formValues.portfolioUrl.startsWith("http")) {
              setWebsiteUrl(parsed.formValues.portfolioUrl);
            }
          }
        }
      } catch {
        // Ignore localStorage error
      }
    }
  }, [open]);

  // Validation helper
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    const cleanScholar = scholarNumber.trim().toUpperCase();
    if (!cleanScholar) {
      newErrors.scholarNumber = "Scholar number is required.";
    } else if (!isValidScholarNumber(cleanScholar)) {
      newErrors.scholarNumber = "Enter a valid scholar number (e.g. 25U010061 or 25P02F1028).";
    }

    const cleanName = studentName.trim();
    if (!cleanName) {
      newErrors.studentName = "Please enter your name.";
    } else if (cleanName.length < 2) {
      newErrors.studentName = "Name must be at least 2 characters.";
    }

    const cleanWeb = websiteUrl.trim();
    if (!cleanWeb) {
      newErrors.websiteUrl = "Please enter your deployed website URL.";
    } else {
      const safety = isSafePublicUrl(cleanWeb);
      if (!safety.safe) {
        newErrors.websiteUrl = safety.reason || "Please enter a valid HTTP/HTTPS URL.";
      }
    }

    if (githubUrl.trim()) {
      const ghSafety = isSafePublicUrl(githubUrl.trim());
      if (!ghSafety.safe) {
        newErrors.githubUrl = "Please enter a valid GitHub repository URL.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Handle Manual File Upload
  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file is too large (max 8MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setScreenshotDataUrl(base64);
        toast.success("Screenshot attached!");
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle Direct Submission (Primary Goal: save links + generate poster immediately)
  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const effectiveName = studentName.trim() || "DFB";

      // 1. Primary Goal: Record build submission in backend
      try {
        await submitBuildFn({
          data: {
            scholarNumber: scholarNumber.trim().toUpperCase(),
            studentName: studentName.trim(),
            websiteUrl: websiteUrl.trim(),
            githubUrl: githubUrl.trim() || undefined,
            screenshotUrl: screenshotDataUrl ? "stored_with_submission" : undefined,
          },
        });
        toast.success("Build submitted successfully! 🔥");
      } catch (subErr) {
        console.warn("[Build record non-fatal]", subErr);
      }

      // 2. Render official 1080x1920 Instagram Story poster
      const generatedUrl = await renderInstagramStoryPoster({
        studentName: effectiveName,
        websiteUrl: websiteUrl.trim(),
        screenshotDataUrl: screenshotDataUrl,
        stageElement: stageRef.current,
      });

      setPosterDataUrl(generatedUrl);
      setStep("poster");

      const cleanUrl = websiteUrl.trim();
      setCustomCaption(
        `Hey, I am ${effectiveName} and excited to share my first website! 🚀🔥\n\nCheck out my build: ${cleanUrl}\n\nSharing with @spark_iiitb!\n#SparkClub #FirstWebsite #BuildInPublic #WebDevelopment`
      );
    } catch (err) {
      console.error("[Submission error]", err);
      toast.error("Failed to submit build. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Action: Download Poster
  function handleDownloadPoster() {
    if (!posterDataUrl) return;
    const cleanName = studentName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") || "spark";
    const filename = `spark-drop-your-build-${cleanName}.png`;

    const link = document.createElement("a");
    link.href = posterDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Poster downloaded! Check your downloads folder.");
  }

  // Action: Web Share API (native share on mobile)
  async function handleSharePoster() {
    if (!posterDataUrl) return;

    const cleanName = studentName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") || "spark";
    const filename = `spark-drop-your-build-${cleanName}.png`;
    const file = dataUrlToFile(posterDataUrl, filename);

    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "My First Website - Spark Club",
          text: customCaption,
          files: [file],
        });
        toast.success("Shared successfully!");
      } catch (shareErr) {
        if ((shareErr as Error).name !== "AbortError") {
          toast.error("Sharing was cancelled or unsupported on this device.");
        }
      }
    } else {
      handleDownloadPoster();
      toast.info(
        "Direct image sharing is unsupported on this browser. Your poster has been downloaded—you can upload it to Instagram Stories!"
      );
    }
  }

  // Action: Copy Caption
  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(customCaption);
      setCopiedCaption(true);
      toast.success("Caption copied to clipboard!");
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      toast.error("Unable to copy caption. Please select and copy manually.");
    }
  }

  // Reset to form
  function handleStartOver() {
    setStep("form");
    setScreenshotDataUrl(null);
    setPosterDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto border-2 border-foreground bg-card p-0 shadow-[10px_10px_0_var(--foreground)] sm:rounded-none">
        {/* Header Bar */}
        <div className="border-b-2 border-foreground bg-stage px-6 py-4 text-stage-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded bg-secondary text-base">🔥</span>
              <div>
                <DialogTitle className="font-display text-xl uppercase tracking-wider text-stage-foreground sm:text-2xl">
                  Drop Your Build
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-stage-foreground/75">
                  Submit your first website & get your official Instagram Story poster
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-black uppercase">
              <span
                className={`rounded px-2.5 py-0.5 ${
                  step === "form" ? "bg-secondary text-secondary-foreground" : "bg-stage-foreground/20 text-stage-foreground"
                }`}
              >
                1. Submit Build
              </span>
              <ChevronRight className="size-3 opacity-60" />
              <span
                className={`rounded px-2.5 py-0.5 ${
                  step === "poster" ? "bg-secondary text-secondary-foreground" : "bg-stage-foreground/20 text-stage-foreground"
                }`}
              >
                2. Story Poster
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: FORM */}
          {step === "form" && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="rounded border border-primary/30 bg-primary/10 p-3.5 text-xs text-foreground">
                <p className="font-bold flex items-center gap-1.5 text-primary">
                  <Sparkles className="size-3.5" /> Built your first website for Search for Spark?
                </p>
                <p className="mt-1 text-muted-foreground">
                  Submit your deployed project links here to record your milestone. You can also attach a screenshot
                  to feature inside your official Instagram Story poster!
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-foreground mb-1.5">
                    Scholar Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. 25U010061"
                    value={scholarNumber}
                    onChange={(e) => {
                      setScholarNumber(e.target.value.toUpperCase());
                      if (errors.scholarNumber) setErrors((prev) => ({ ...prev, scholarNumber: "" }));
                    }}
                    required
                    maxLength={20}
                    className="border-foreground bg-background font-mono font-bold"
                  />
                  {errors.scholarNumber && (
                    <p className="mt-1 text-xs text-destructive font-medium">{errors.scholarNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-foreground mb-1.5">
                    Your Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Alex Sharma"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (errors.studentName) setErrors((prev) => ({ ...prev, studentName: "" }));
                    }}
                    required
                    maxLength={60}
                    className="border-foreground bg-background font-semibold"
                  />
                  {errors.studentName && (
                    <p className="mt-1 text-xs text-destructive font-medium">{errors.studentName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-foreground mb-1.5">
                  Deployed Website URL <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="url"
                    placeholder="https://my-first-site.vercel.app"
                    value={websiteUrl}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      if (errors.websiteUrl) setErrors((prev) => ({ ...prev, websiteUrl: "" }));
                    }}
                    required
                    maxLength={300}
                    className="pl-9 border-foreground bg-background font-medium"
                  />
                </div>
                {errors.websiteUrl ? (
                  <p className="mt-1 text-xs text-destructive font-medium">{errors.websiteUrl}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Must be a publicly accessible URL (e.g. Vercel, Netlify, GitHub Pages, Render, Firebase).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-foreground mb-1.5">
                  GitHub Repository URL <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-3.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="url"
                    placeholder="https://github.com/username/my-project"
                    value={githubUrl}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      if (errors.githubUrl) setErrors((prev) => ({ ...prev, githubUrl: "" }));
                    }}
                    maxLength={300}
                    className="pl-9 border-foreground bg-background"
                  />
                </div>
                {errors.githubUrl && (
                  <p className="mt-1 text-xs text-destructive font-medium">{errors.githubUrl}</p>
                )}
              </div>

              {/* Manual Screenshot Upload (Optional) */}
              <div className="rounded border-2 border-foreground/20 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" /> Screenshot{" "}
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </span>
                  {screenshotDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotDataUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  )}
                </div>

                {screenshotDataUrl ? (
                  <div className="flex items-center gap-3.5 rounded border border-foreground/20 bg-background p-2.5">
                    <div className="relative aspect-[720/870] h-18 overflow-hidden rounded border border-foreground/30 bg-muted shrink-0 shadow-sm">
                      <img
                        src={screenshotDataUrl}
                        alt="Screenshot Preview"
                        className="size-full object-cover object-top"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">Screenshot attached</p>
                      <p className="text-[11px] text-muted-foreground">Will be featured inside your story photo frame</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1.5 h-6 text-[10px] font-bold"
                      >
                        Change Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group cursor-pointer rounded border-2 border-dashed border-foreground/30 bg-card/60 p-4 text-center transition-all hover:border-foreground hover:bg-card"
                  >
                    <div className="mx-auto mb-1.5 grid size-9 place-items-center rounded-full bg-secondary/30 text-secondary-foreground group-hover:bg-secondary">
                      <Upload className="size-4" />
                    </div>
                    <p className="text-xs font-bold text-foreground">Upload screenshot from your device</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">PNG, JPG, or WEBP (Max 8MB)</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <p className="text-[11px] text-muted-foreground">
                  💡 <strong>Tip:</strong> You can submit right away! If you omit the screenshot, your poster will automatically feature the official Spark Club purple gradient frame.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-foreground/15">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="electric"
                  disabled={isSubmitting}
                  className="font-bold shadow-[3px_3px_0_var(--foreground)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" /> Submitting Build…
                    </>
                  ) : (
                    <>
                      🔥 Submit Build & Get Poster
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: POSTER PREVIEW & SHARING */}
          {step === "poster" && posterDataUrl && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[.9fr_1.1fr] md:items-start">
                {/* Official Spark Club Poster Preview */}
                <div className="flex flex-col items-center">
                  <div className="relative w-full aspect-[9/16] max-w-[280px] overflow-hidden rounded-lg border-4 border-foreground bg-[#140A3A] shadow-[8px_8px_0_var(--foreground)]">
                    <img
                      src={posterDataUrl}
                      alt="Generated Spark Club Instagram Story Poster"
                      className="size-full object-contain"
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Official 1080 × 1920 Instagram Story
                  </p>
                </div>

                {/* Sharing and Action Controls */}
                <div className="space-y-4">
                  <div className="border-b border-foreground/15 pb-3">
                    <div className="inline-flex items-center gap-1.5 rounded bg-secondary px-2.5 py-0.5 text-xs font-black uppercase text-secondary-foreground">
                      🔥 Build Submitted & Ready
                    </div>
                    <h4 className="mt-1 font-display text-2xl uppercase">Your Poster Is Live!</h4>
                    <p className="text-xs text-muted-foreground">
                      Your build links have been recorded. Download the story poster to share on Instagram!
                    </p>
                  </div>

                  {/* Primary Download & Share Buttons */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="electric"
                      size="lg"
                      onClick={handleDownloadPoster}
                      className="font-extrabold uppercase shadow-[3px_3px_0_var(--foreground)]"
                    >
                      <Download className="mr-2 size-4" /> Download PNG
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleSharePoster}
                      className="border-2 border-foreground font-extrabold uppercase shadow-[3px_3px_0_var(--foreground)]"
                    >
                      <Share2 className="mr-2 size-4 text-primary" /> Share to Story
                    </Button>
                  </div>

                  {/* Copyable Caption Box */}
                  <div className="rounded border border-foreground/20 bg-background p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-muted-foreground">
                        Custom Story Caption
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCaption}
                        className="h-7 px-2 text-xs font-bold"
                      >
                        {copiedCaption ? (
                          <>
                            <Check className="mr-1 size-3 text-green-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 size-3" /> Copy Caption
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      value={customCaption}
                      onChange={(e) => setCustomCaption(e.target.value)}
                      className="text-xs font-medium resize-none bg-muted/20 border-foreground/20"
                    />
                  </div>

                  {/* Instagram Story Step-by-Step Guide */}
                  <div className="rounded border-2 border-secondary/50 bg-secondary/10 p-3.5 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <FaInstagram className="size-4 text-[#E1306C]" /> How to post to Instagram Story:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                      <li>
                        Download the poster using the <strong>Download PNG</strong> button above.
                      </li>
                      <li>
                        Open Instagram, tap <strong>Your Story</strong>, and choose the downloaded image.
                      </li>
                      <li>
                        Tap the <strong>Stickers</strong> icon &gt; select <strong>LINK</strong> &gt; paste your URL (
                        <span className="font-semibold text-foreground">{websiteUrl}</span>).
                      </li>
                      <li>
                        Tag <strong>@spark_iiitb</strong> so we can repost your project to the club story!
                      </li>
                    </ol>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleStartOver}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="mr-1 size-3" /> Submit Another Website
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="border-foreground text-xs font-bold"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Offscreen 1080x1920 Stage for DOM rasterization via html-to-image */}
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: "-9999px",
            width: "1080px",
            height: "1920px",
            pointerEvents: "none",
            opacity: 0,
            overflow: "hidden",
            zIndex: -99,
          }}
          aria-hidden="true"
        >
          <SparkStoryStage
            ref={stageRef}
            studentName={studentName.trim() || "DFB"}
            screenshotUrl={screenshotDataUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
