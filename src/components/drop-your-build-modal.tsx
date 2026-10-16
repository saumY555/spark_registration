import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  Upload,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Camera,
  Layers,
  ArrowRight,
  CheckCircle2,
  Globe,
  Github,
  Loader2,
  Info,
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
import { captureWebsiteScreenshot, submitBuild, isSafePublicUrl } from "@/lib/build-submission.functions";
import { isValidScholarNumber } from "@/lib/registration.functions";
import { renderInstagramStoryPoster, dataUrlToFile } from "@/lib/poster-generator";
import { cn } from "@/lib/utils";

interface DropYourBuildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "form" | "screenshot" | "poster";

export function DropYourBuildModal({ open, onOpenChange }: DropYourBuildModalProps) {
  const captureScreenshotFn = useServerFn(captureWebsiteScreenshot);
  const submitBuildFn = useServerFn(submitBuild);

  const [step, setStep] = useState<Step>("form");

  // Form inputs
  const [scholarNumber, setScholarNumber] = useState("");
  const [studentName, setStudentName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [wantsAutoScreenshot, setWantsAutoScreenshot] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Screenshot state
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poster state
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [posterFormat, setPosterFormat] = useState<"poster" | "story">("poster");
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [customCaption, setCustomCaption] = useState(
    "I just built my first website! 🚀🔥\n\nSharing my build with Spark Club @spark_iiitb.\n\n#SparkClub #FirstWebsite #BuildInPublic #WebDevelopment"
  );

  // Reset when dialog is reopened
  useEffect(() => {
    if (open && step === "form" && !scholarNumber) {
      // Pre-fill from existing registration if saved in localStorage
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

  // Handle Form Submit
  async function handleInitialSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    if (wantsAutoScreenshot) {
      // Move to screenshot capture step
      setStep("screenshot");
      await executeScreenshotCapture(websiteUrl.trim());
    } else {
      // Proceed directly to manual or skipped screenshot
      setStep("screenshot");
    }
  }

  // Execute server screenshot capture
  async function executeScreenshotCapture(targetUrl: string) {
    setIsCapturing(true);
    setCaptureError("");
    setScreenshotDataUrl(null);

    try {
      const result = await captureScreenshotFn({
        data: { url: targetUrl },
      });

      if (result.success && result.dataUrl) {
        setScreenshotDataUrl(result.dataUrl);
        toast.success("Website screenshot captured successfully!");
      } else {
        setCaptureError(
          result.error ||
            "Could not automatically capture your site screenshot. You can upload an image manually or continue with the branded poster."
        );
      }
    } catch (err) {
      console.error("[Screenshot Error]", err);
      setCaptureError(
        "Screenshot request timed out. You can upload a screenshot file manually or proceed with the branded placeholder."
      );
    } finally {
      setIsCapturing(false);
    }
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
        setCaptureError("");
        toast.success("Custom screenshot uploaded!");
      }
    };
    reader.readAsDataURL(file);
  }

  // Generate Final Poster & Record Build
  async function handleGeneratePoster(formatOverride?: "poster" | "story") {
    const fmt = formatOverride || posterFormat;
    setIsGeneratingPoster(true);
    try {
      // Render official poster canvas
      const generatedUrl = await renderInstagramStoryPoster({
        studentName: studentName.trim(),
        websiteUrl: websiteUrl.trim(),
        screenshotDataUrl: screenshotDataUrl,
        mode: fmt,
      });

      setPosterDataUrl(generatedUrl);

      // Record build submission in backend
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
      } catch (subErr) {
        console.warn("[Build record non-fatal]", subErr);
      }

      setStep("poster");
      toast.success("Your Spark Club poster is ready! 🔥");
    } catch (err) {
      console.error("[Poster Generation Error]", err);
      toast.error("Failed to generate poster. Please try again.");
    } finally {
      setIsGeneratingPoster(false);
    }
  }

  // Switch between Master Poster (1850x2048) and 9:16 Story (1080x1920)
  async function handleFormatSwitch(nextFormat: "poster" | "story") {
    if (nextFormat === posterFormat) return;
    setPosterFormat(nextFormat);
    if (posterDataUrl) {
      setIsGeneratingPoster(true);
      try {
        const nextUrl = await renderInstagramStoryPoster({
          studentName: studentName.trim(),
          websiteUrl: websiteUrl.trim(),
          screenshotDataUrl: screenshotDataUrl,
          mode: nextFormat,
        });
        setPosterDataUrl(nextUrl);
      } catch (e) {
        console.error("Format switch error", e);
      } finally {
        setIsGeneratingPoster(false);
      }
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
        // User cancelled or aborted
        if ((shareErr as Error).name !== "AbortError") {
          toast.error("Sharing was cancelled or unsupported on this device.");
        }
      }
    } else {
      // Desktop / unsupported browser fallback
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
    setCaptureError("");
    setPosterDataUrl(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto border-2 border-foreground bg-card p-0 shadow-[10px_10px_0_var(--foreground)] sm:rounded-none">
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
                  Showcase your first website & generate an official Instagram Story poster
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-black uppercase">
              <span
                className={`rounded px-2 py-0.5 ${
                  step === "form" ? "bg-secondary text-secondary-foreground" : "bg-stage-foreground/20 text-stage-foreground"
                }`}
              >
                1. Build Info
              </span>
              <ChevronRight className="size-3 opacity-60" />
              <span
                className={`rounded px-2 py-0.5 ${
                  step === "screenshot" ? "bg-secondary text-secondary-foreground" : "bg-stage-foreground/20 text-stage-foreground"
                }`}
              >
                2. Preview
              </span>
              <ChevronRight className="size-3 opacity-60" />
              <span
                className={`rounded px-2 py-0.5 ${
                  step === "poster" ? "bg-secondary text-secondary-foreground" : "bg-stage-foreground/20 text-stage-foreground"
                }`}
              >
                3. Poster
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* STEP 1: FORM */}
          {step === "form" && (
            <form onSubmit={handleInitialSubmit} className="space-y-5">
              <div className="rounded border border-primary/30 bg-primary/10 p-3.5 text-xs text-foreground">
                <p className="font-bold flex items-center gap-1.5 text-primary">
                  <Sparkles className="size-3.5" /> Built your first website for Search for Spark?
                </p>
                <p className="mt-1 text-muted-foreground">
                  Submit your deployed project here. We'll capture a screenshot of your build and render a personalized
                  1080×1920 Instagram Story poster to celebrate your milestone!
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

              <div className="rounded border-2 border-foreground/20 bg-muted/20 p-4 space-y-3">
                <span className="text-xs font-extrabold uppercase text-foreground block">
                  Screenshot Preference
                </span>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="screenshotPref"
                    checked={wantsAutoScreenshot}
                    onChange={() => setWantsAutoScreenshot(true)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <div>
                    <span className="font-bold text-foreground">Auto-Capture Live Viewport (Recommended)</span>
                    <p className="text-muted-foreground">
                      Our worker will visit your website and take a screenshot of your site.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="screenshotPref"
                    checked={!wantsAutoScreenshot}
                    onChange={() => setWantsAutoScreenshot(false)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <div>
                    <span className="font-bold text-foreground">Upload or Skip Screenshot</span>
                    <p className="text-muted-foreground">
                      You can manually upload an image or generate the poster with the Spark Club terminal graphic.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-foreground"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="electric" className="font-bold">
                  Next: Capture & Generate <ArrowRight className="ml-1 size-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: SCREENSHOT REVIEW & ALTERNATIVES */}
          {step === "screenshot" && (
            <div className="space-y-5">
              {isCapturing ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-4">
                    <Loader2 className="size-12 animate-spin text-primary" />
                    <Sparkles className="absolute -top-1 -right-1 size-5 text-secondary animate-pulse" />
                  </div>
                  <h4 className="font-display text-xl uppercase tracking-wider">Capturing Live Viewport…</h4>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Connecting to <span className="font-bold text-foreground">{websiteUrl}</span> and taking a snapshot of
                    your build. This usually takes 3–5 seconds.
                  </p>
                </div>
              ) : screenshotDataUrl ? (
                /* Screenshot Success State */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-foreground/15 pb-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded bg-green-500/15 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="size-3.5" /> Screenshot Ready
                      </div>
                      <h4 className="font-extrabold uppercase text-sm mt-1">Live Viewport Preview</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8"
                      >
                        <Upload className="mr-1 size-3.5" /> Replace with File
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => executeScreenshotCapture(websiteUrl)}
                        className="text-xs h-8"
                      >
                        <RotateCcw className="mr-1 size-3.5" /> Retake
                      </Button>
                    </div>
                  </div>

                  {/* Preview Container */}
                  <div className="relative mx-auto aspect-[16/10] max-h-72 w-full overflow-hidden rounded border-2 border-foreground bg-muted shadow-inner">
                    <img
                      src={screenshotDataUrl}
                      alt="Captured Website Viewport"
                      className="size-full object-cover object-top"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    This snapshot will be placed inside the tilted Polaroid frame on your Instagram Story poster.
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-foreground/15">
                    <Button type="button" variant="outline" onClick={() => setStep("form")}>
                      Back to Form
                    </Button>
                    <Button
                      type="button"
                      variant="electric"
                      onClick={handleGeneratePoster}
                      disabled={isGeneratingPoster}
                      className="font-bold"
                    >
                      {isGeneratingPoster ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Rendering Poster…
                        </>
                      ) : (
                        <>
                          Generate Official Poster <Sparkles className="ml-1.5 size-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Screenshot Fallback / Manual / Skip State */
                <div className="space-y-5">
                  {captureError ? (
                    <div className="rounded border-2 border-destructive/40 bg-destructive/10 p-4 text-xs">
                      <div className="flex items-center gap-2 font-bold text-destructive">
                        <AlertCircle className="size-4 shrink-0" /> Automatic capture didn't respond
                      </div>
                      <p className="mt-1 text-muted-foreground">{captureError}</p>
                    </div>
                  ) : (
                    <div className="rounded border border-primary/30 bg-primary/10 p-4 text-xs">
                      <div className="flex items-center gap-2 font-bold text-primary">
                        <Info className="size-4 shrink-0" /> Select how to display your build
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        You can upload a custom screenshot from your device or use our signature Spark Club branded terminal
                        graphic.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Option A: Manual Upload */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group cursor-pointer rounded border-2 border-foreground bg-card p-5 text-center transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--foreground)]"
                    >
                      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-secondary/30 text-secondary-foreground group-hover:bg-secondary">
                        <Upload className="size-6" />
                      </div>
                      <h5 className="font-extrabold uppercase text-sm">Upload Screenshot</h5>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG or WEBP from your computer (max 8MB)
                      </p>
                      <Button type="button" variant="outline" size="sm" className="mt-3 font-bold uppercase text-xs">
                        Select Image
                      </Button>
                    </div>

                    {/* Option B: Continue with Branded Terminal */}
                    <div
                      onClick={handleGeneratePoster}
                      className="group cursor-pointer rounded border-2 border-foreground bg-card p-5 text-center transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--foreground)]"
                    >
                      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                        <Sparkles className="size-6" />
                      </div>
                      <h5 className="font-extrabold uppercase text-sm">Skip & Use Branded Graphic</h5>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uses the neon Spark Club live build code terminal in the frame
                      </p>
                      <Button type="button" variant="electric" size="sm" className="mt-3 font-bold uppercase text-xs">
                        Continue Without Image
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep("form")}>
                      Back to Form
                    </Button>
                    {captureError && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => executeScreenshotCapture(websiteUrl)}
                        className="text-xs"
                      >
                        <RotateCcw className="mr-1 size-3.5" /> Try Auto-Capture Again
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Hidden file input for manual uploads */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* STEP 3: POSTER PREVIEW & SHARING */}
          {step === "poster" && posterDataUrl && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[.9fr_1.1fr] md:items-start">
                {/* Official Spark Club Poster Preview */}
                <div className="flex flex-col items-center">
                  {/* Format Switcher */}
                  <div className="mb-3 flex w-full max-w-[300px] gap-1 rounded border-2 border-foreground bg-muted/40 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleFormatSwitch("poster")}
                      disabled={isGeneratingPoster}
                      className={cn(
                        "flex-1 rounded py-1.5 px-2 text-center text-[10px] font-extrabold uppercase tracking-wider transition-all",
                        posterFormat === "poster"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Master Poster
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatSwitch("story")}
                      disabled={isGeneratingPoster}
                      className={cn(
                        "flex-1 rounded py-1.5 px-2 text-center text-[10px] font-extrabold uppercase tracking-wider transition-all",
                        posterFormat === "story"
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      9:16 Story
                    </button>
                  </div>

                  <div
                    className={cn(
                      "relative w-full max-w-[300px] overflow-hidden rounded-lg border-4 border-foreground bg-black shadow-[8px_8px_0_var(--foreground)] transition-all",
                      posterFormat === "story" ? "aspect-[9/16]" : "aspect-[925/1024]"
                    )}
                  >
                    <img
                      src={posterDataUrl}
                      alt="Generated Spark Club Poster"
                      className="size-full object-contain"
                    />
                    <div className="absolute bottom-2 left-2 rounded bg-black/85 px-2 py-0.5 text-[10px] font-bold text-[#CCFF00] border border-white/20">
                      {posterFormat === "story" ? "1080 × 1920 STORY" : "OFFICIAL POSTER"}
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {posterFormat === "story" ? "Full-Height Instagram Story" : "Master High-Resolution Poster"}
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
                      Download the poster to share on your Instagram Story or share directly to your favorite apps.
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
      </DialogContent>
    </Dialog>
  );
}
