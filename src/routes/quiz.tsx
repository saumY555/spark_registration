import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Code2,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Home,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  getQuizStatus,
  verifyQuizCandidate,
  submitQuiz,
  quizAdminVerifyPassword,
  quizAdminGetConfig,
  quizAdminUpdateConfig,
  quizAdminGetAttempts,
  quizAdminResetCandidate,
  type QuizCandidateSummary,
  type QuizPreviousResult,
  type QuizSettings,
  type QuizConfigData,
} from "@/lib/quiz.functions";
import type { QuizQuestion, QuizQuestionWithAnswer } from "@/data/code-web-quiz";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      {
        title: "Code for Code & Web Quiz | Search For Spark 2026",
      },
      {
        name: "description",
        content: "Online technical screening quiz for Code and Web track applicants at SPARK Club IIIT Bhopal.",
      },
    ],
  }),
  component: CodeWebQuizPage,
});

type QuizStage = "verify" | "instructions" | "in_progress" | "submitted" | "already_completed";
type ViewMode = "candidate" | "admin";

function CodeWebQuizPage() {
  const getStatusFn = useServerFn(getQuizStatus);
  const verifyFn = useServerFn(verifyQuizCandidate);
  const submitFn = useServerFn(submitQuiz);

  const adminVerifyPassFn = useServerFn(quizAdminVerifyPassword);
  const adminGetConfigFn = useServerFn(quizAdminGetConfig);
  const adminUpdateConfigFn = useServerFn(quizAdminUpdateConfig);
  const adminGetAttemptsFn = useServerFn(quizAdminGetAttempts);
  const adminResetCandidateFn = useServerFn(quizAdminResetCandidate);

  // Overall View Mode
  const [viewMode, setViewMode] = useState<ViewMode>("candidate");

  // Public status from server
  const [quizStatus, setQuizStatus] = useState<{
    isAllowed: boolean;
    isPaused: boolean;
    isScheduledFuture?: boolean;
    isExpired?: boolean;
    reason: string | null;
    settings?: QuizSettings;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Candidate state
  const [scholarInput, setScholarInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [stage, setStage] = useState<QuizStage>("verify");
  const [candidate, setCandidate] = useState<QuizCandidateSummary | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [previousResult, setPreviousResult] = useState<QuizPreviousResult | null>(null);

  // Active quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(20 * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(20 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    timeFormatted: string;
  } | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Admin state
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState("");
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);

  const [adminTab, setAdminTab] = useState<"settings" | "questions" | "attempts">("settings");
  const [editableSettings, setEditableSettings] = useState<QuizSettings>({
    isPaused: true,
    startTime: null,
    endTime: null,
    pauseMessage:
      "The Code & Web domain assessment is currently paused / locked by coordinators. Please wait for the scheduled time.",
    durationMinutes: 20,
  });
  const [editableQuestions, setEditableQuestions] = useState<QuizQuestionWithAnswer[]>([]);
  const [isLoadingAdminConfig, setIsLoadingAdminConfig] = useState(false);
  const [isSavingAdminConfig, setIsSavingAdminConfig] = useState(false);
  const [adminSaveMessage, setAdminSaveMessage] = useState("");
  const [adminSaveError, setAdminSaveError] = useState("");

  // Admin Attempts & Reset state
  const [attemptsList, setAttemptsList] = useState<
    Array<{
      id: string;
      fullName: string;
      scholarNumber: string;
      email: string;
      primaryTrack: string;
      quiz: QuizPreviousResult | null;
    }>
  >([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [scholarToReset, setScholarToReset] = useState("");
  const [isResettingCandidate, setIsResettingCandidate] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch public quiz status on mount
  const refreshStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await getStatusFn();
      setQuizStatus(res);
      if (res.settings) {
        setEditableSettings(res.settings);
        setTotalDurationSeconds((res.settings.durationMinutes || 20) * 60);
      }
    } catch (err) {
      console.error("Failed to load quiz status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  // Check saved admin session
  useEffect(() => {
    try {
      const savedPass = sessionStorage.getItem("spark_quiz_admin_auth");
      if (savedPass) {
        setAdminPassword(savedPass);
        handleAdminLogin(savedPass);
      }
    } catch {
      // Ignore
    }
  }, []);

  // -------------------------------------------------------------------------
  // CANDIDATE HANDLERS
  // -------------------------------------------------------------------------
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scholarInput.trim()) {
      setVerifyError("Please enter your scholar number.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await verifyFn({
        data: { scholarNumber: scholarInput.trim() },
      });

      if (!res.eligible) {
        if (res.alreadyCompleted && res.previousResult) {
          setCandidate(res.candidate || null);
          setPreviousResult(res.previousResult);
          setStage("already_completed");
        } else {
          setVerifyError(res.reason || "You are not eligible for this quiz.");
        }
        return;
      }

      setCandidate(res.candidate || null);
      setQuestions(res.questions || []);
      const durSec = res.durationSeconds || 20 * 60;
      setTotalDurationSeconds(durSec);
      setTimeRemainingSeconds(durSec);
      setStage("instructions");
    } catch (err: any) {
      console.error("Verification failed:", err);
      setVerifyError(err.message || "Failed to verify scholar number. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartQuiz = () => {
    setStage("in_progress");
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(totalDurationSeconds);
  };

  useEffect(() => {
    if (stage !== "in_progress") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleClearAnswer = (questionId: number) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).length;
  }, [selectedAnswers]);

  const executeSubmission = async () => {
    if (!candidate) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const timeTaken = totalDurationSeconds - timeRemainingSeconds;

    const stringKeyAnswers: Record<string, number> = {};
    for (const [k, v] of Object.entries(selectedAnswers)) {
      stringKeyAnswers[k] = v;
    }

    try {
      const res = await submitFn({
        data: {
          scholarNumber: candidate.scholarNumber,
          answers: stringKeyAnswers,
          timeTakenSeconds: timeTaken,
        },
      });

      setFinalResult({
        score: res.score,
        total: res.total,
        percentage: res.percentage,
        timeFormatted: res.timeFormatted,
      });
      setStage("submitted");
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "Failed to submit quiz. Please retry or contact the admin.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const handleAutoSubmit = () => {
    executeSubmission();
  };

  // -------------------------------------------------------------------------
  // ADMIN HANDLERS (Password: spark6392)
  // -------------------------------------------------------------------------
  const handleAdminLogin = async (passToTry?: string) => {
    const pass = passToTry || adminPassword;
    if (!pass.trim()) {
      setAdminAuthError("Please enter the Quiz Admin password.");
      return;
    }

    setAdminAuthError("");
    setIsAdminVerifying(true);

    try {
      await adminVerifyPassFn({ data: { password: pass } });
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem("spark_quiz_admin_auth", pass);
      } catch {
        // Ignore
      }
      loadAdminConfig(pass);
    } catch (err: any) {
      setAdminAuthError(err.message || "Invalid password. Access denied.");
      setIsAdminAuthenticated(false);
    } finally {
      setIsAdminVerifying(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    try {
      sessionStorage.removeItem("spark_quiz_admin_auth");
    } catch {
      // Ignore
    }
    setViewMode("candidate");
  };

  const loadAdminConfig = async (passOverride?: string) => {
    const pass = passOverride || adminPassword;
    if (!pass) return;

    setIsLoadingAdminConfig(true);
    try {
      const res = await adminGetConfigFn({ data: { password: pass } });
      setEditableSettings(res.config.settings);
      setEditableQuestions(res.config.questions);
      loadAttempts(pass);
    } catch (err: any) {
      setAdminSaveError("Failed to load current configuration: " + err.message);
    } finally {
      setIsLoadingAdminConfig(false);
    }
  };

  const loadAttempts = async (passOverride?: string) => {
    const pass = passOverride || adminPassword;
    if (!pass) return;

    setIsLoadingAttempts(true);
    try {
      const res = await adminGetAttemptsFn({ data: { password: pass } });
      setAttemptsList(res.attempts || []);
    } catch (err: any) {
      console.error("Failed to load quiz attempts:", err);
    } finally {
      setIsLoadingAttempts(false);
    }
  };

  const handleResetCandidateAttempt = async (scholarNum: string, name?: string) => {
    if (!adminPassword || !scholarNum.trim()) return;

    if (
      !confirm(
        `Are you sure you want to reset the quiz attempt for ${name || scholarNum}?\n\nTheir previous score will be erased and they will be allowed to retake the quiz.`
      )
    ) {
      return;
    }

    setIsResettingCandidate(true);
    setAdminSaveMessage("");
    setAdminSaveError("");

    try {
      const res = await adminResetCandidateFn({
        data: {
          password: adminPassword,
          scholarNumber: scholarNum.trim(),
        },
      });

      setAdminSaveMessage(
        `Quiz attempt for ${res.candidateName} (${res.scholarNumber}) has been reset! They can now retake the quiz.`
      );
      setScholarToReset("");
      loadAttempts();
      setTimeout(() => setAdminSaveMessage(""), 4000);
    } catch (err: any) {
      setAdminSaveError(err.message || "Failed to reset candidate quiz attempt.");
    } finally {
      setIsResettingCandidate(false);
    }
  };

  const handleSaveAdminConfig = async () => {
    if (!adminPassword) return;

    setIsSavingAdminConfig(true);
    setAdminSaveMessage("");
    setAdminSaveError("");

    try {
      const res = await adminUpdateConfigFn({
        data: {
          password: adminPassword,
          settings: editableSettings,
          questions: editableQuestions,
        },
      });

      setAdminSaveMessage(res.message || "Settings and questions saved successfully!");
      refreshStatus();
      setTimeout(() => setAdminSaveMessage(""), 3500);
    } catch (err: any) {
      setAdminSaveError(err.message || "Failed to save configuration.");
    } finally {
      setIsSavingAdminConfig(false);
    }
  };

  // Question editing helpers
  const handleUpdateQuestionText = (index: number, text: string) => {
    setEditableQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], question: text };
      return next;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    setEditableQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIndex].options];
      opts[optIndex] = text;
      next[qIndex] = { ...next[qIndex], options: opts };
      return next;
    });
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    setEditableQuestions((prev) => {
      const next = [...prev];
      next[qIndex] = {
        ...next[qIndex],
        correctOptionIndex: optIndex,
        correctAnswerText: next[qIndex].options[optIndex] || "",
      };
      return next;
    });
  };

  const handleAddQuestion = () => {
    const newId =
      editableQuestions.length > 0
        ? Math.max(...editableQuestions.map((q) => q.id)) + 1
        : 1;

    const newQ: QuizQuestionWithAnswer = {
      id: newId,
      question: "New Code / Logic Question Statement",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctOptionIndex: 0,
      correctAnswerText: "Option A",
    };

    setEditableQuestions((prev) => [...prev, newQ]);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!confirm(`Are you sure you want to delete Question #${qIndex + 1}?`)) return;
    setEditableQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-secondary selection:text-foreground">
      {/* Top Header */}
      <header className="border-b border-foreground/20 bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-10 md:py-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3.5 min-w-0"
            aria-label="Search For Spark home"
          >
            <img
              src="/spark-logo.png"
              alt="Spark Club"
              className="size-9 sm:size-12 shrink-0 object-contain rounded-lg shadow-sm"
            />
            <span className="text-xs sm:text-sm font-extrabold uppercase leading-tight">
              Spark Club
              <br />
              <span className="font-medium text-muted-foreground">IIIT Bhopal</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {viewMode === "candidate" && stage === "in_progress" && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 border-2 border-foreground font-mono font-black text-xs sm:text-sm shadow-[3px_3px_0_var(--foreground)] ${
                  timeRemainingSeconds < 180
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Clock3 className="size-4" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>
            )}

            {/* Admin / Candidate Mode Switcher */}
            {stage !== "in_progress" && (
              <>
                {viewMode === "candidate" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("admin")}
                    className="h-9 px-3 text-xs font-extrabold uppercase border-primary/50 text-primary hover:bg-primary/10 hover:border-primary shadow-sm"
                  >
                    <Lock className="mr-1.5 size-3.5" />
                    <span>Admin Mode</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("candidate")}
                    className="h-9 px-3 text-xs font-extrabold uppercase border-foreground/30 hover:border-foreground shadow-sm"
                  >
                    <ChevronLeft className="mr-1.5 size-3.5" />
                    <span>Candidate View</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 px-3 text-xs font-extrabold uppercase border-foreground/30 hover:border-foreground"
                >
                  <Link to="/">
                    <Home className="mr-1.5 size-3.5" />
                    Home
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* ======================================================================= */}
        {/* VIEW 1: ADMIN CONSOLE */}
        {/* ======================================================================= */}
        {viewMode === "admin" && (
          <div className="w-full space-y-6">
            {!isAdminAuthenticated ? (
              // Admin Authentication Screen
              <div className="max-w-md mx-auto w-full">
                <div className="border-2 border-foreground bg-card p-6 sm:p-8 shadow-[10px_10px_0_var(--primary)] space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 border border-foreground bg-primary/20 text-primary px-3 py-1 text-xs font-extrabold uppercase">
                      <KeyRound className="size-3.5" />
                      Quiz Admin Portal
                    </div>
                    <h2 className="font-display text-4xl uppercase">Quiz Control</h2>
                    <p className="text-xs text-muted-foreground font-semibold">
                      Enter the organizer password to edit questions, change options, and control quiz scheduling.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAdminLogin();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold uppercase text-foreground">
                        Admin Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showAdminPassword ? "text" : "password"}
                          placeholder="Enter quiz admin password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          autoFocus
                          className="border-2 border-foreground bg-background pr-10 font-mono text-sm h-11 shadow-[3px_3px_0_var(--foreground)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showAdminPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {adminAuthError && (
                      <div className="border-2 border-destructive bg-destructive/10 p-3 text-xs font-bold text-destructive flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>{adminAuthError}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="electric"
                      disabled={isAdminVerifying || !adminPassword.trim()}
                      className="w-full h-11 uppercase font-extrabold text-xs border-2 border-foreground shadow-[4px_4px_0_var(--foreground)]"
                    >
                      {isAdminVerifying ? "Verifying…" : "Unlock Quiz Console"}
                    </Button>
                  </form>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setViewMode("candidate")}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase underline"
                    >
                      ← Return to Candidate Screen
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Authenticated Admin Dashboard
              <div className="w-full space-y-6">
                {/* Admin Header Banner */}
                <div className="border-2 border-foreground bg-card p-4 sm:p-5 shadow-[6px_6px_0_var(--foreground)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 border-2 border-foreground bg-primary text-primary-foreground font-black flex items-center justify-center shadow-[2px_2px_0_var(--foreground)]">
                      <Settings className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-2xl uppercase leading-none">Quiz Management</h2>
                        <span
                          className={`border border-foreground px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            editableSettings.isPaused
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {editableSettings.isPaused ? "PAUSED / LOCKED" : "ACTIVE / OPEN"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Authenticated as Quiz Admin • Changes affect applicants immediately
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAdminConfig()}
                      disabled={isLoadingAdminConfig}
                      className="border-foreground/30 hover:border-foreground text-xs font-bold uppercase"
                    >
                      <RefreshCw className={`size-3.5 mr-1 ${isLoadingAdminConfig ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAdminLogout}
                      className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs font-bold uppercase"
                    >
                      <LogOut className="size-3.5 mr-1" />
                      Logout
                    </Button>
                  </div>
                </div>

                {/* Status messages */}
                {adminSaveMessage && (
                  <div className="border-2 border-emerald-500 bg-emerald-500/10 p-3.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shadow-[4px_4px_0_var(--foreground)]">
                    <CheckCircle2 className="size-4" />
                    <span>{adminSaveMessage}</span>
                  </div>
                )}

                {adminSaveError && (
                  <div className="border-2 border-destructive bg-destructive/10 p-3.5 text-xs font-bold text-destructive flex items-center gap-2 shadow-[4px_4px_0_var(--foreground)]">
                    <AlertTriangle className="size-4" />
                    <span>{adminSaveError}</span>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b-2 border-foreground gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminTab("settings")}
                    className={`px-5 py-2.5 text-xs font-extrabold uppercase border-2 border-b-0 border-foreground transition-all ${
                      adminTab === "settings"
                        ? "bg-card text-foreground shadow-[3px_-3px_0_var(--foreground)]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    1. Lock & Schedule Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminTab("questions")}
                    className={`px-5 py-2.5 text-xs font-extrabold uppercase border-2 border-b-0 border-foreground transition-all flex items-center gap-2 ${
                      adminTab === "questions"
                        ? "bg-card text-foreground shadow-[3px_-3px_0_var(--foreground)]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>2. Questions & Answer Keys</span>
                    <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.2 text-[10px]">
                      {editableQuestions.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminTab("attempts");
                      loadAttempts();
                    }}
                    className={`px-5 py-2.5 text-xs font-extrabold uppercase border-2 border-b-0 border-foreground transition-all flex items-center gap-2 ${
                      adminTab === "attempts"
                        ? "bg-card text-foreground shadow-[3px_-3px_0_var(--foreground)]"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <RotateCcw className="size-3.5" />
                    <span>3. Attempts & Reset</span>
                    <span className="rounded-full bg-secondary text-secondary-foreground border border-foreground px-2 py-0.2 text-[10px] font-black">
                      {attemptsList.length}
                    </span>
                  </button>
                </div>

                {/* TAB 1: LOCK & SCHEDULE SETTINGS */}
                {adminTab === "settings" && (
                  <div className="border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--foreground)] space-y-6">
                    {/* Pause Toggle Card */}
                    <div className="border-2 border-foreground p-5 space-y-3 bg-background shadow-[4px_4px_0_var(--foreground)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-extrabold uppercase text-primary">
                            Instant Access Switch
                          </span>
                          <h3 className="font-display text-2xl uppercase mt-0.5">
                            {editableSettings.isPaused ? "Quiz is Currently Paused" : "Quiz is Currently Active"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            When paused, candidates entering their scholar number will be told the quiz is locked.
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant={editableSettings.isPaused ? "electric" : "destructive"}
                          size="lg"
                          onClick={() =>
                            setEditableSettings((prev) => ({
                              ...prev,
                              isPaused: !prev.isPaused,
                            }))
                          }
                          className="uppercase font-extrabold text-xs border-2 border-foreground shadow-[3px_3px_0_var(--foreground)] shrink-0"
                        >
                          {editableSettings.isPaused ? (
                            <>
                              <Play className="size-4 mr-1.5" /> Resume / Unpause Quiz
                            </>
                          ) : (
                            <>
                              <Pause className="size-4 mr-1.5" /> Pause Quiz Now
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Scheduled Day and Time Lock */}
                    <div className="border-2 border-foreground p-5 space-y-4 bg-background shadow-[4px_4px_0_var(--foreground)]">
                      <div>
                        <span className="text-xs font-extrabold uppercase text-primary">
                          Scheduled Window Lock
                        </span>
                        <h3 className="font-display text-2xl uppercase mt-0.5">
                          Date & Time Restrictions (Optional)
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Lock specific date and time bounds when students can attempt the assessment.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold uppercase text-foreground flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-primary" />
                            Start Date & Time (Unlock)
                          </label>
                          <Input
                            type="datetime-local"
                            value={editableSettings.startTime || ""}
                            onChange={(e) =>
                              setEditableSettings((prev) => ({
                                ...prev,
                                startTime: e.target.value ? e.target.value : null,
                              }))
                            }
                            className="border-2 border-foreground bg-card text-foreground font-mono text-xs font-bold h-11"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold uppercase text-foreground flex items-center gap-1.5">
                            <Clock className="size-3.5 text-destructive" />
                            End Date & Time (Lockout)
                          </label>
                          <Input
                            type="datetime-local"
                            value={editableSettings.endTime || ""}
                            onChange={(e) =>
                              setEditableSettings((prev) => ({
                                ...prev,
                                endTime: e.target.value ? e.target.value : null,
                              }))
                            }
                            className="border-2 border-foreground bg-card text-foreground font-mono text-xs font-bold h-11"
                          />
                        </div>
                      </div>

                      {(editableSettings.startTime || editableSettings.endTime) && (
                        <div className="pt-1 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditableSettings((prev) => ({
                                ...prev,
                                startTime: null,
                                endTime: null,
                              }))
                            }
                            className="text-xs font-bold border-foreground/30 hover:border-foreground"
                          >
                            Clear Date & Time Window
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Announcement Message & Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5 border-2 border-foreground p-4 bg-background shadow-[4px_4px_0_var(--foreground)]">
                        <label className="text-xs font-extrabold uppercase text-foreground">
                          Message Shown to Candidates While Locked
                        </label>
                        <Textarea
                          rows={3}
                          value={editableSettings.pauseMessage}
                          onChange={(e) =>
                            setEditableSettings((prev) => ({
                              ...prev,
                              pauseMessage: e.target.value,
                            }))
                          }
                          className="border-2 border-foreground bg-card text-xs font-medium min-h-20"
                          placeholder="Explain when the quiz will open or why it is paused…"
                        />
                      </div>

                      <div className="space-y-1.5 border-2 border-foreground p-4 bg-background shadow-[4px_4px_0_var(--foreground)]">
                        <label className="text-xs font-extrabold uppercase text-foreground">
                          Quiz Duration (Minutes)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={180}
                          value={editableSettings.durationMinutes}
                          onChange={(e) =>
                            setEditableSettings((prev) => ({
                              ...prev,
                              durationMinutes: parseInt(e.target.value) || 20,
                            }))
                          }
                          className="border-2 border-foreground bg-card font-mono text-base font-bold h-11"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Standard: 20 minutes countdown for 20 questions.
                        </p>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-2 flex justify-end">
                      <Button
                        type="button"
                        variant="electric"
                        size="lg"
                        disabled={isSavingAdminConfig}
                        onClick={handleSaveAdminConfig}
                        className="uppercase font-extrabold text-sm border-2 border-foreground shadow-[4px_4px_0_var(--foreground)] hover:shadow-[6px_6px_0_var(--foreground)]"
                      >
                        <Save className="size-4 mr-2" />
                        {isSavingAdminConfig ? "Saving Changes…" : "Save Settings"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* TAB 2: QUESTIONS & OPTIONS EDITOR */}
                {adminTab === "questions" && (
                  <div className="border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--foreground)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-foreground">
                      <div>
                        <h3 className="font-display text-3xl uppercase">Question Bank</h3>
                        <p className="text-xs text-muted-foreground">
                          Edit questions, customize option choices, and designate correct answer keys.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddQuestion}
                          className="border-foreground uppercase font-extrabold text-xs shadow-[2px_2px_0_var(--foreground)]"
                        >
                          <Plus className="size-4 mr-1" /> Add Question
                        </Button>

                        <Button
                          type="button"
                          variant="electric"
                          size="sm"
                          disabled={isSavingAdminConfig}
                          onClick={handleSaveAdminConfig}
                          className="border-2 border-foreground uppercase font-extrabold text-xs shadow-[3px_3px_0_var(--foreground)]"
                        >
                          <Save className="size-4 mr-1.5" />
                          {isSavingAdminConfig ? "Saving…" : "Save All Questions"}
                        </Button>
                      </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6">
                      {editableQuestions.map((q, qIndex) => (
                        <div
                          key={q.id || qIndex}
                          className="border-2 border-foreground bg-background p-5 shadow-[4px_4px_0_var(--foreground)] space-y-4"
                        >
                          {/* Question Header */}
                          <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="border-2 border-foreground bg-secondary px-3 py-0.5 font-mono text-xs font-black uppercase text-secondary-foreground shadow-[2px_2px_0_var(--foreground)]">
                                Question #{qIndex + 1}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                (ID: {q.id})
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs font-bold"
                            >
                              <Trash2 className="size-4 mr-1" /> Delete
                            </Button>
                          </div>

                          {/* Question Text */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-extrabold uppercase text-foreground">
                              Question Statement / Code Prompt
                            </label>
                            <Textarea
                              rows={3}
                              value={q.question}
                              onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                              className="border-2 border-foreground bg-card font-mono text-xs sm:text-sm font-bold min-h-20 whitespace-pre-wrap"
                              placeholder="Enter question text or C code snippet…"
                            />
                          </div>

                          {/* Options Grid */}
                          <div className="space-y-2 pt-1">
                            <label className="text-xs font-extrabold uppercase text-foreground flex items-center justify-between">
                              <span>Options (Select the correct answer button)</span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                Marked Correct: Option {String.fromCharCode(65 + q.correctOptionIndex)}
                              </span>
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {q.options.map((optText, optIdx) => {
                                const isCorrect = q.correctOptionIndex === optIdx;
                                const optionLetter = String.fromCharCode(65 + optIdx);

                                return (
                                  <div
                                    key={optIdx}
                                    className={`border-2 p-3 flex items-center gap-2.5 transition-all ${
                                      isCorrect
                                        ? "border-primary bg-primary/10 shadow-[3px_3px_0_var(--primary)] font-bold"
                                        : "border-foreground bg-card"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleSetCorrectOption(qIndex, optIdx)}
                                      title="Click to set as correct answer"
                                      className={`size-7 border-2 border-foreground flex items-center justify-center font-mono font-black text-xs shrink-0 cursor-pointer ${
                                        isCorrect
                                          ? "bg-primary text-primary-foreground shadow-[1px_1px_0_var(--foreground)]"
                                          : "bg-muted text-foreground hover:bg-secondary"
                                      }`}
                                    >
                                      {optionLetter}
                                    </button>

                                    <Input
                                      type="text"
                                      value={optText}
                                      onChange={(e) =>
                                        handleUpdateOption(qIndex, optIdx, e.target.value)
                                      }
                                      className="border border-foreground/30 bg-background font-mono text-xs h-9 flex-1"
                                      placeholder={`Option ${optionLetter} text`}
                                    />

                                    {isCorrect && (
                                      <span className="text-[10px] font-black uppercase text-primary shrink-0">
                                        ✓ KEY
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Save Action */}
                    <div className="pt-4 border-t-2 border-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddQuestion}
                        className="w-full sm:w-auto uppercase font-extrabold text-xs border-foreground shadow-[2px_2px_0_var(--foreground)]"
                      >
                        <Plus className="size-4 mr-1.5" /> Add Another Question
                      </Button>

                      <Button
                        type="button"
                        variant="electric"
                        size="lg"
                        disabled={isSavingAdminConfig}
                        onClick={handleSaveAdminConfig}
                        className="w-full sm:w-auto uppercase font-extrabold text-sm border-2 border-foreground shadow-[4px_4px_0_var(--foreground)] hover:shadow-[6px_6px_0_var(--foreground)]"
                      >
                        <Save className="size-4 mr-2" />
                        {isSavingAdminConfig ? "Saving All Questions…" : "Save All Questions"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* TAB 3: CANDIDATE ATTEMPTS & RESET */}
                {adminTab === "attempts" && (
                  <div className="border-2 border-foreground bg-card p-6 shadow-[8px_8px_0_var(--foreground)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-foreground">
                      <div>
                        <h3 className="font-display text-3xl uppercase">Candidate Attempts</h3>
                        <p className="text-xs text-muted-foreground">
                          View students who completed the assessment and reset scores to allow retakes.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadAttempts()}
                        disabled={isLoadingAttempts}
                        className="border-foreground/30 hover:border-foreground text-xs font-bold uppercase"
                      >
                        <RefreshCw className={`size-3.5 mr-1 ${isLoadingAttempts ? "animate-spin" : ""}`} />
                        Refresh Attempts
                      </Button>
                    </div>

                    {/* Quick Reset by Scholar Number Card */}
                    <div className="border-2 border-foreground bg-background p-5 shadow-[4px_4px_0_var(--foreground)] space-y-3">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="size-4 text-primary" />
                        <span className="text-xs font-extrabold uppercase text-foreground">
                          Quick Reset by Scholar Number
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Type any applicant's scholar number to instantly wipe their quiz score and let them retake.
                      </p>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleResetCandidateAttempt(scholarToReset);
                        }}
                        className="flex flex-col sm:flex-row gap-2.5 pt-1"
                      >
                        <Input
                          type="text"
                          placeholder="e.g. 26U021041"
                          value={scholarToReset}
                          onChange={(e) => setScholarToReset(e.target.value.toUpperCase())}
                          className="border-2 border-foreground bg-card font-mono text-sm font-bold uppercase h-11 flex-1 shadow-[2px_2px_0_var(--foreground)]"
                        />
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={isResettingCandidate || !scholarToReset.trim()}
                          className="h-11 px-5 uppercase font-extrabold text-xs border-2 border-foreground shadow-[3px_3px_0_var(--foreground)]"
                        >
                          {isResettingCandidate ? "Resetting…" : "Reset Candidate Score"}
                        </Button>
                      </form>
                    </div>

                    {/* Attempts Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-extrabold uppercase text-muted-foreground">
                        <span>Completed Attempts ({attemptsList.length})</span>
                      </div>

                      {attemptsList.length === 0 ? (
                        <div className="border-2 border-foreground/30 border-dashed p-8 text-center bg-background/50 text-xs text-muted-foreground font-semibold">
                          {isLoadingAttempts
                            ? "Loading attempts from database…"
                            : "No quiz submissions recorded yet."}
                        </div>
                      ) : (
                        <div className="overflow-x-auto border-2 border-foreground bg-background shadow-[4px_4px_0_var(--foreground)]">
                          <table className="w-full text-left text-xs font-medium">
                            <thead className="border-b-2 border-foreground bg-foreground text-background">
                              <tr>
                                <th className="p-3 font-extrabold uppercase">Candidate</th>
                                <th className="p-3 font-extrabold uppercase">Scholar No</th>
                                <th className="p-3 font-extrabold uppercase">Track</th>
                                <th className="p-3 font-extrabold uppercase">Score</th>
                                <th className="p-3 font-extrabold uppercase">Time Taken</th>
                                <th className="p-3 font-extrabold uppercase">Submitted At</th>
                                <th className="p-3 text-right font-extrabold uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-foreground/10">
                              {attemptsList.map((cand) => (
                                <tr key={cand.id} className="hover:bg-muted/40 transition-colors">
                                  <td className="p-3 font-bold text-foreground">
                                    {cand.fullName}
                                    <div className="text-[11px] text-muted-foreground font-normal">
                                      {cand.email}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono font-extrabold uppercase">
                                    {cand.scholarNumber}
                                  </td>
                                  <td className="p-3 text-primary font-bold">
                                    {cand.primaryTrack}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    {cand.quiz ? (
                                      <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-mono font-extrabold text-secondary-foreground border border-foreground">
                                        🎯 {cand.quiz.score}/{cand.quiz.total} ({cand.quiz.percentage}%)
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-muted-foreground">
                                    {cand.quiz?.timeTakenSeconds !== undefined
                                      ? `${Math.floor(cand.quiz.timeTakenSeconds / 60)}m ${cand.quiz.timeTakenSeconds % 60}s`
                                      : "—"}
                                  </td>
                                  <td className="p-3 font-mono text-muted-foreground text-[11px]">
                                    {cand.quiz?.submittedAt
                                      ? new Date(cand.quiz.submittedAt).toLocaleString("en-IN")
                                      : "—"}
                                  </td>
                                  <td className="p-3 text-right">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleResetCandidateAttempt(cand.scholarNumber, cand.fullName)
                                      }
                                      className="h-7 px-2.5 text-xs font-bold border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm"
                                    >
                                      <RotateCcw className="size-3 mr-1" /> Reset
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* VIEW 2: CANDIDATE INTERFACE (DEFAULT) */}
        {/* ======================================================================= */}
        {viewMode === "candidate" && (
          <>
            {/* STAGE 1: VERIFICATION & ENTRANCE SCREEN */}
            {stage === "verify" && (
              <div className="w-full max-w-xl mx-auto space-y-5">
                {/* Check if quiz is currently paused or outside schedule */}
                {!isLoadingStatus && quizStatus && !quizStatus.isAllowed && (
                  <div className="border-2 border-foreground bg-secondary/30 p-5 shadow-[6px_6px_0_var(--foreground)] space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 border-2 border-foreground bg-destructive text-destructive-foreground font-black flex items-center justify-center text-xs">
                        <Lock className="size-4" />
                      </div>
                      <span className="font-extrabold uppercase text-xs tracking-wider text-foreground">
                        Quiz Currently Locked
                      </span>
                    </div>

                    <p className="text-sm font-bold text-foreground leading-relaxed">
                      {quizStatus.reason}
                    </p>

                    <div className="text-xs text-muted-foreground font-medium pt-1 border-t border-foreground/20 flex items-center justify-between">
                      <span>Are you a coordinator?</span>
                      <button
                        type="button"
                        onClick={() => setViewMode("admin")}
                        className="text-primary font-extrabold uppercase underline hover:opacity-80"
                      >
                        Access Admin Console →
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-2 border-foreground bg-card p-6 sm:p-8 shadow-[10px_10px_0_var(--primary)]">
                  <div className="mb-4 inline-flex items-center gap-2 border border-foreground bg-secondary/30 px-3 py-1 text-xs font-extrabold uppercase">
                    <span className="size-2 bg-secondary" /> Domain Screening · 2026
                  </div>

                  <h1 className="font-display text-4xl sm:text-6xl uppercase leading-none">
                    Code for <span className="text-primary">Code & Web.</span>
                  </h1>
                  <p className="mt-3 text-sm text-muted-foreground font-semibold">
                    Enter your registered Scholar Number to verify your eligibility and enter the technical screening.
                  </p>

                  <form onSubmit={handleVerify} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold uppercase text-foreground flex items-center justify-between">
                        <span>Scholar Number</span>
                        <span className="text-[11px] text-muted-foreground font-mono">e.g. 26U021041</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter Scholar Number (e.g. 26U021041)"
                        value={scholarInput}
                        onChange={(e) => {
                          setScholarInput(e.target.value.toUpperCase());
                          if (verifyError) setVerifyError(null);
                        }}
                        autoFocus
                        disabled={quizStatus ? !quizStatus.isAllowed : false}
                        className="border-2 border-foreground bg-background text-foreground font-mono text-base font-bold uppercase placeholder:text-muted-foreground placeholder:normal-case h-12 shadow-[4px_4px_0_var(--foreground)] focus:ring-primary focus:border-primary disabled:opacity-60"
                      />
                    </div>

                    {verifyError && (
                      <div className="border-2 border-destructive bg-destructive/10 p-3.5 text-xs font-bold text-destructive flex items-start gap-2.5">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <div>{verifyError}</div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="electric"
                      disabled={
                        isVerifying ||
                        !scholarInput.trim() ||
                        (quizStatus ? !quizStatus.isAllowed : false)
                      }
                      className="w-full h-12 uppercase font-extrabold text-sm border-2 border-foreground shadow-[5px_5px_0_var(--foreground)] hover:shadow-[7px_7px_0_var(--foreground)] disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <div className="flex items-center gap-2">
                          <div className="size-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                          Verifying Eligibility…
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Verify & Enter Quiz</span>
                          <ChevronRight className="size-4" />
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Assessment Specs */}
                  <div className="mt-6 pt-5 border-t border-foreground/20 grid grid-cols-2 gap-3 text-left">
                    <div className="border border-foreground/20 bg-background p-3 shadow-sm">
                      <div className="text-[10px] font-extrabold uppercase text-muted-foreground">Test Format</div>
                      <div className="text-sm font-extrabold text-foreground mt-0.5">MCQ Assessment</div>
                      <div className="text-[11px] text-muted-foreground">C, Logic, Web, SPARK</div>
                    </div>
                    <div className="border border-foreground/20 bg-background p-3 shadow-sm">
                      <div className="text-[10px] font-extrabold uppercase text-muted-foreground">Time Limit</div>
                      <div className="text-sm font-extrabold text-primary mt-0.5">
                        {editableSettings.durationMinutes || 20} Minutes
                      </div>
                      <div className="text-[11px] text-muted-foreground">Auto-Submits on Expiry</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-foreground/10 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Restricted to Code & Web applicants</span>
                    <button
                      type="button"
                      onClick={() => setViewMode("admin")}
                      className="text-primary font-bold hover:underline"
                    >
                      Admin Access →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: INSTRUCTIONS SCREEN */}
            {stage === "instructions" && candidate && (
              <div className="w-full max-w-2xl mx-auto space-y-6">
                <div className="border-2 border-foreground bg-card p-6 sm:p-8 shadow-[10px_10px_0_var(--foreground)] space-y-6">
                  {/* Candidate Info Card */}
                  <div className="border-2 border-foreground bg-secondary/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[4px_4px_0_var(--foreground)]">
                    <div className="flex items-center gap-3">
                      <div className="size-11 border-2 border-foreground bg-primary text-primary-foreground font-black flex items-center justify-center text-lg shadow-[2px_2px_0_var(--foreground)]">
                        {candidate.fullName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-foreground text-base uppercase">
                          {candidate.fullName}
                        </h2>
                        <p className="text-xs font-mono font-bold text-primary">
                          {candidate.scholarNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="border border-foreground bg-card px-2.5 py-1 text-[11px] font-extrabold uppercase">
                        1st: {candidate.primaryTrack || "None"}
                      </span>
                      {candidate.secondaryTrack && (
                        <span className="border border-foreground bg-card px-2.5 py-1 text-[11px] font-extrabold uppercase">
                          2nd: {candidate.secondaryTrack}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="font-display text-3xl uppercase text-foreground flex items-center gap-2">
                      <FileText className="size-6 text-primary" />
                      Quiz Rules & Format
                    </h3>

                    <ul className="mt-4 space-y-3 text-sm text-foreground/90 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary mt-0.5">✦</span>
                        <span>
                          The test contains <strong>{questions.length} Multiple Choice Questions</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary mt-0.5">✦</span>
                        <span>
                          Time limit:{" "}
                          <strong className="font-mono text-primary">
                            {Math.floor(totalDurationSeconds / 60)}:00 minutes
                          </strong>
                          . A countdown timer will run in the header.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary mt-0.5">✦</span>
                        <span>
                          When time expires, your answers will <strong>automatically submit</strong>.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary mt-0.5">✦</span>
                        <span>
                          Navigate freely between questions using the Question Palette.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary mt-0.5">✦</span>
                        <span>
                          <strong className="text-destructive">Single Attempt Only:</strong> Multiple attempts are disallowed once submitted.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-foreground/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStage("verify")}
                      className="w-full sm:w-auto text-xs font-extrabold uppercase border-foreground/40 hover:border-foreground"
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Change Scholar No
                    </Button>

                    <Button
                      variant="electric"
                      size="lg"
                      onClick={handleStartQuiz}
                      className="w-full sm:w-auto uppercase font-extrabold text-sm border-2 border-foreground shadow-[4px_4px_0_var(--foreground)] hover:shadow-[6px_6px_0_var(--foreground)]"
                    >
                      <span>Begin Assessment</span>
                      <ChevronRight className="size-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: ACTIVE QUIZ */}
            {stage === "in_progress" && currentQ && (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Top Status & Progress Bar */}
                <div className="border-2 border-foreground bg-card p-4 shadow-[4px_4px_0_var(--foreground)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-foreground">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-primary font-mono font-extrabold">
                        {answeredCount} / {questions.length} Answered
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground uppercase">
                      Candidate: <span className="font-extrabold text-foreground">{candidate?.scholarNumber}</span>
                    </div>
                  </div>

                  <Progress
                    value={((currentQuestionIndex + 1) / questions.length) * 100}
                    className="h-2 border border-foreground/30 bg-muted"
                  />
                </div>

                {/* Question & Options Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Question Main Column */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="border-2 border-foreground bg-card p-6 sm:p-8 shadow-[8px_8px_0_var(--foreground)] space-y-6">
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <span className="border-2 border-foreground bg-secondary px-3 py-0.5 text-xs font-mono font-extrabold uppercase text-secondary-foreground shadow-[2px_2px_0_var(--foreground)]">
                          Question {currentQuestionIndex + 1}
                        </span>

                        {selectedAnswers[currentQ.id] !== undefined ? (
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase">
                            <Check className="size-3.5" /> Answered
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 uppercase">
                            <HelpCircle className="size-3.5" /> Unanswered
                          </span>
                        )}
                      </div>

                      {/* Question Statement */}
                      <div className="text-base sm:text-lg font-bold text-foreground leading-relaxed whitespace-pre-line">
                        {currentQ.question}
                      </div>

                      {/* Multiple Choice Options */}
                      <div className="space-y-3 pt-2">
                        {currentQ.options.map((optionText, optIdx) => {
                          const isSelected = selectedAnswers[currentQ.id] === optIdx;
                          const optionLetter = String.fromCharCode(65 + optIdx);

                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSelectOption(currentQ.id, optIdx)}
                              className={`flex items-center gap-3.5 p-4 border-2 cursor-pointer transition-all select-none ${
                                isSelected
                                  ? "border-primary bg-primary/10 shadow-[5px_5px_0_var(--primary)] font-bold text-foreground"
                                  : "border-foreground bg-background hover:bg-muted/30 shadow-[3px_3px_0_var(--foreground)] text-foreground hover:translate-x-0.5"
                              }`}
                            >
                              <div
                                className={`size-8 shrink-0 flex items-center justify-center font-mono font-black text-xs border-2 border-foreground shadow-[1px_1px_0_var(--foreground)] ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                {optionLetter}
                              </div>
                              <div className="flex-1 font-mono text-sm sm:text-base leading-snug whitespace-pre-wrap">
                                {optionText}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Navigation Controls */}
                      <div className="pt-4 border-t border-foreground/20 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                            className="border-foreground/30 hover:border-foreground uppercase font-extrabold text-xs"
                          >
                            <ChevronLeft className="size-4 mr-1" />
                            Previous
                          </Button>

                          {selectedAnswers[currentQ.id] !== undefined && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClearAnswer(currentQ.id)}
                              className="text-xs font-bold text-muted-foreground hover:text-destructive"
                            >
                              Clear Choice
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                setCurrentQuestionIndex((prev) =>
                                  Math.min(questions.length - 1, prev + 1)
                                )
                              }
                              className="bg-primary text-primary-foreground font-extrabold uppercase text-xs border border-foreground shadow-[3px_3px_0_var(--foreground)] hover:bg-primary/90"
                            >
                              Next
                              <ChevronRight className="size-4 ml-1" />
                            </Button>
                          ) : (
                            <Button
                              variant="electric"
                              size="sm"
                              onClick={() => setShowConfirmSubmit(true)}
                              className="font-extrabold uppercase text-xs border-2 border-foreground shadow-[4px_4px_0_var(--foreground)]"
                            >
                              Submit Assessment
                              <Send className="size-3.5 ml-1.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigator Palette Column */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="border-2 border-foreground bg-card p-4 shadow-[6px_6px_0_var(--foreground)] space-y-4">
                      <h4 className="text-xs font-extrabold uppercase text-muted-foreground">
                        Question Palette
                      </h4>

                      {/* Grid 1-N */}
                      <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                          const isAnswered = selectedAnswers[q.id] !== undefined;
                          const isCurrent = idx === currentQuestionIndex;

                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`h-9 font-mono text-xs font-extrabold border-2 border-foreground cursor-pointer transition-all flex items-center justify-center ${
                                isCurrent
                                  ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground font-black shadow-[2px_2px_0_var(--foreground)]"
                                  : isAnswered
                                  ? "bg-secondary text-secondary-foreground shadow-[2px_2px_0_var(--foreground)]"
                                  : "bg-background text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="pt-3 border-t border-foreground/20 space-y-1.5 text-xs font-bold">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2.5 bg-secondary border border-foreground inline-block" />
                            Answered:
                          </span>
                          <span className="font-mono text-foreground">{answeredCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2.5 bg-background border border-foreground inline-block" />
                            Unanswered:
                          </span>
                          <span className="font-mono text-foreground">
                            {questions.length - answeredCount}
                          </span>
                        </div>
                      </div>

                      {/* Quick Finish Button */}
                      <Button
                        variant="electric"
                        onClick={() => setShowConfirmSubmit(true)}
                        className="w-full uppercase font-extrabold text-xs border-2 border-foreground shadow-[3px_3px_0_var(--foreground)] hover:shadow-[5px_5px_0_var(--foreground)]"
                      >
                        Finish & Submit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBMISSION CONFIRMATION MODAL */}
            {showConfirmSubmit && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="border-2 border-foreground bg-card p-6 sm:p-8 max-w-md w-full shadow-[10px_10px_0_var(--foreground)] space-y-5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="space-y-2 text-center">
                    <div className="size-12 border-2 border-foreground bg-secondary text-secondary-foreground font-black flex items-center justify-center mx-auto text-xl shadow-[3px_3px_0_var(--foreground)]">
                      ⚠️
                    </div>
                    <h3 className="font-display text-3xl uppercase text-foreground">
                      Confirm Submission
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      Are you ready to submit your assessment? Once submitted, your answers cannot be altered.
                    </p>
                  </div>

                  <div className="border-2 border-foreground bg-background p-4 space-y-2 text-xs font-bold">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground uppercase">Answered:</span>
                      <span className="font-mono text-primary font-black">
                        {answeredCount} / {questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground uppercase">Unanswered:</span>
                      <span className="font-mono text-destructive font-black">
                        {questions.length - answeredCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground uppercase">Time Left:</span>
                      <span className="font-mono text-foreground font-black">
                        {formatTime(timeRemainingSeconds)}
                      </span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="border-2 border-destructive bg-destructive/10 p-3 text-destructive text-xs font-bold">
                      {submitError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmSubmit(false)}
                      disabled={isSubmitting}
                      className="w-1/2 uppercase font-extrabold text-xs border-foreground/30 hover:border-foreground h-11"
                    >
                      Review
                    </Button>
                    <Button
                      variant="electric"
                      onClick={executeSubmission}
                      disabled={isSubmitting}
                      className="w-1/2 uppercase font-extrabold text-xs border-2 border-foreground shadow-[3px_3px_0_var(--foreground)] h-11"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="size-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                          Submitting…
                        </div>
                      ) : (
                        "Confirm Submit"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: SUBMITTED SUCCESSFULLY SCREEN */}
            {stage === "submitted" && finalResult && (
              <div className="w-full max-w-lg mx-auto">
                <div className="border-2 border-foreground bg-card p-6 sm:p-8 shadow-[12px_12px_0_var(--primary)] text-center space-y-6">
                  <div className="size-16 border-2 border-foreground bg-secondary text-secondary-foreground font-black flex items-center justify-center mx-auto shadow-[4px_4px_0_var(--foreground)]">
                    <Check className="size-9" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-primary">Assessment Complete</p>
                    <h2 className="font-display text-4xl sm:text-5xl uppercase text-foreground mt-1">
                      You’re Done.
                    </h2>
                    <p className="mt-2 text-xs text-muted-foreground font-medium">
                      Your assessment score has been recorded and synchronized with the SPARK recruitment database.
                    </p>
                  </div>

                  {/* Score Box */}
                  <div className="border-2 border-foreground bg-background p-6 shadow-[5px_5px_0_var(--foreground)] space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Your Score</span>
                    <p className="font-display text-6xl font-black text-primary leading-none">
                      {finalResult.score} / {finalResult.total}
                    </p>
                    <div className="pt-2">
                      <span className="border border-foreground bg-secondary px-3 py-1 text-xs font-mono font-extrabold uppercase text-secondary-foreground shadow-[2px_2px_0_var(--foreground)]">
                        {finalResult.percentage}% Accuracy
                      </span>
                    </div>
                    <p className="pt-2 text-xs font-mono text-muted-foreground font-semibold">
                      Time Taken: <span className="text-foreground font-bold">{finalResult.timeFormatted}</span>
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground font-medium">
                    Candidate: <strong className="text-foreground">{candidate?.fullName}</strong> (<span className="font-mono font-bold">{candidate?.scholarNumber}</span>)
                  </div>

                  <Button asChild variant="electric" size="lg" className="w-full uppercase font-extrabold border-2 border-foreground shadow-[4px_4px_0_var(--foreground)]">
                    <Link to="/">
                      <Home className="size-4 mr-2" />
                      Back to SPARK Homepage
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* STAGE 5: ALREADY COMPLETED SCREEN */}
            {stage === "already_completed" && candidate && previousResult && (
              <div className="w-full max-w-lg mx-auto">
                <div className="border-2 border-foreground bg-card p-6 sm:p-8 shadow-[10px_10px_0_var(--foreground)] text-center space-y-6">
                  <div className="size-14 border-2 border-foreground bg-secondary text-secondary-foreground font-black flex items-center justify-center mx-auto shadow-[3px_3px_0_var(--foreground)]">
                    <Award className="size-8" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase text-primary">Already Evaluated</p>
                    <h2 className="font-display text-4xl uppercase text-foreground mt-1">Quiz Completed</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Scholar Number <strong className="font-mono text-foreground">{candidate.scholarNumber}</strong> has already completed the assessment.
                    </p>
                  </div>

                  {/* Previous Result Summary */}
                  <div className="border-2 border-foreground bg-background p-5 shadow-[4px_4px_0_var(--foreground)] space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Recorded Score</span>
                    <p className="font-display text-5xl font-black text-primary leading-none">
                      {previousResult.score} / {previousResult.total}
                    </p>
                    <div>
                      <span className="border border-foreground bg-secondary px-2.5 py-0.5 text-xs font-mono font-extrabold uppercase text-secondary-foreground">
                        {previousResult.percentage}% Accuracy
                      </span>
                    </div>
                    <p className="pt-1 text-[11px] font-mono text-muted-foreground">
                      Submitted: {new Date(previousResult.submittedAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium">
                    Multiple attempts are strictly restricted. If you believe this is an error, please reach out to the SPARK coordinators.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStage("verify");
                        setScholarInput("");
                      }}
                      className="w-1/2 uppercase font-extrabold text-xs border-foreground/30 hover:border-foreground"
                    >
                      <RotateCcw className="size-3.5 mr-1.5" />
                      Try Another
                    </Button>
                    <Button asChild variant="electric" className="w-1/2 uppercase font-extrabold text-xs border-2 border-foreground shadow-[3px_3px_0_var(--foreground)]">
                      <Link to="/">
                        <Home className="size-3.5 mr-1.5" />
                        Homepage
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground/20 py-4 text-center text-xs text-muted-foreground font-bold uppercase">
        Spark Club • IIIT Bhopal • Recruitment 2026
      </footer>
    </div>
  );
}
