import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { QuizQuestion, QuizQuestionWithAnswer } from "@/data/code-web-quiz";

export interface QuizCandidateSummary {
  fullName: string;
  scholarNumber: string;
  email: string;
  primaryTrack: string | null;
  secondaryTrack: string | null;
}

export interface QuizPreviousResult {
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface QuizSettings {
  isPaused: boolean;
  startTime: string | null;
  endTime: string | null;
  pauseMessage: string;
  durationMinutes: number;
}

export interface QuizConfigData {
  settings: QuizSettings;
  questions: QuizQuestionWithAnswer[];
}

function getQuizAdminPassword(): string {
  if (typeof process !== "undefined" && process.env?.QUIZ_ADMIN_PASSWORD) {
    return process.env.QUIZ_ADMIN_PASSWORD;
  }
  return "spark6392";
}

// ---------------------------------------------------------------------------
// 1. PUBLIC: Check Quiz Status (Paused / Scheduled Window)
// ---------------------------------------------------------------------------
export const getQuizStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { loadQuizConfig } = await import("@/lib/quiz-storage.server");
  const config = await loadQuizConfig();

  const now = new Date();
  const settings = config.settings;

  if (settings.isPaused) {
    return {
      isAllowed: false,
      isPaused: true,
      reason:
        settings.pauseMessage ||
        "The Code & Web domain assessment is currently paused by coordinators.",
      settings,
    };
  }

  if (settings.startTime) {
    const start = new Date(settings.startTime);
    if (!isNaN(start.getTime()) && now < start) {
      return {
        isAllowed: false,
        isPaused: false,
        isScheduledFuture: true,
        reason: `The assessment is scheduled to open on ${start.toLocaleString("en-IN")}. Please return at the scheduled time.`,
        settings,
      };
    }
  }

  if (settings.endTime) {
    const end = new Date(settings.endTime);
    if (!isNaN(end.getTime()) && now > end) {
      return {
        isAllowed: false,
        isPaused: false,
        isExpired: true,
        reason: `The assessment window closed on ${end.toLocaleString("en-IN")}. Submissions are no longer accepted.`,
        settings,
      };
    }
  }

  return {
    isAllowed: true,
    isPaused: false,
    reason: null,
    settings,
  };
});

// ---------------------------------------------------------------------------
// 2. CANDIDATE: Verify Eligibility & Fetch Questions
// ---------------------------------------------------------------------------
export const verifyQuizCandidate = createServerFn({ method: "POST" })
  .validator((input: { scholarNumber: string }) =>
    z.object({ scholarNumber: z.string().min(1, "Scholar number is required") }).parse(input)
  )
  .handler(async ({ data }) => {
    const rawScholar = data.scholarNumber.trim();

    const { loadQuizConfig } = await import("@/lib/quiz-storage.server");
    const config = await loadQuizConfig();
    const settings = config.settings;
    const now = new Date();

    // Check if quiz is currently paused
    if (settings.isPaused) {
      return {
        eligible: false,
        isLocked: true,
        reason:
          settings.pauseMessage ||
          "The Code & Web assessment is currently locked / paused by coordinators. Please wait for the scheduled time.",
      };
    }

    // Check start time lock
    if (settings.startTime) {
      const start = new Date(settings.startTime);
      if (!isNaN(start.getTime()) && now < start) {
        return {
          eligible: false,
          isLocked: true,
          reason: `The assessment will unlock on ${start.toLocaleString("en-IN")}. Please check back then.`,
        };
      }
    }

    // Check end time lock
    if (settings.endTime) {
      const end = new Date(settings.endTime);
      if (!isNaN(end.getTime()) && now > end) {
        return {
          eligible: false,
          isLocked: true,
          reason: `The assessment window closed on ${end.toLocaleString("en-IN")}.`,
        };
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Try finding applicant with matching scholar number (case-insensitive)
    const { data: candidates, error } = await supabaseAdmin
      .from("applications")
      .select("id, full_name, scholar_number, institute_email, primary_track, secondary_track, admin_notes, status")
      .ilike("scholar_number", rawScholar)
      .limit(1);

    if (error) {
      console.error("[Quiz] Candidate lookup error:", error);
      throw new Error(`Database error while checking scholar number: ${error.message || "Unknown error"}`);
    }

    if (!candidates || candidates.length === 0) {
      return {
        eligible: false,
        isLocked: false,
        reason: `Scholar number "${rawScholar}" was not found in our registrations. Please verify your scholar number or submit a registration first.`,
      };
    }

    const candidate = candidates[0];

    // Check track eligibility: Must be "Code and Web" in primary or secondary track
    const isCodeAndWeb =
      candidate.primary_track === "Code and Web" || candidate.secondary_track === "Code and Web";

    if (!isCodeAndWeb) {
      return {
        eligible: false,
        isLocked: false,
        reason: `This quiz is exclusively for applicants who selected "Code and Web" as their domain. Your registered preferences are Primary: "${candidate.primary_track || "None"}" and Secondary: "${candidate.secondary_track || "None"}".`,
      };
    }

    // Check if quiz has already been submitted
    const existingNotes = candidate.admin_notes || "";
    const quizTagMatch = existingNotes.match(/<!--QUIZ:(.*?)-->/);

    if (quizTagMatch) {
      try {
        const parsed = JSON.parse(quizTagMatch[1]) as QuizPreviousResult;
        return {
          eligible: false,
          alreadyCompleted: true,
          isLocked: false,
          candidate: {
            fullName: candidate.full_name,
            scholarNumber: candidate.scholar_number,
            email: candidate.institute_email,
            primaryTrack: candidate.primary_track,
            secondaryTrack: candidate.secondary_track,
          },
          previousResult: parsed,
          reason: `You have already completed the Code and Web quiz on ${new Date(
            parsed.submittedAt
          ).toLocaleString("en-IN")}. Multiple attempts are not permitted.`,
        };
      } catch (err) {
        console.error("[Quiz] Failed to parse previous quiz result:", err);
      }
    }

    // Strip answer keys for client
    const publicQuestions: QuizQuestion[] = config.questions.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));

    return {
      eligible: true,
      alreadyCompleted: false,
      isLocked: false,
      candidate: {
        fullName: candidate.full_name,
        scholarNumber: candidate.scholar_number,
        email: candidate.institute_email,
        primaryTrack: candidate.primary_track,
        secondaryTrack: candidate.secondary_track,
      },
      questions: publicQuestions,
      durationSeconds: (settings.durationMinutes || 20) * 60,
    };
  });

// ---------------------------------------------------------------------------
// 3. CANDIDATE: Submit & Grade Quiz
// ---------------------------------------------------------------------------
export const submitQuiz = createServerFn({ method: "POST" })
  .validator(
    (input: {
      scholarNumber: string;
      answers: Record<string, number>;
      timeTakenSeconds: number;
    }) =>
      z
        .object({
          scholarNumber: z.string().min(1),
          answers: z.record(z.string(), z.number()),
          timeTakenSeconds: z.number().min(0),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const rawScholar = data.scholarNumber.trim();

    const { loadQuizConfig } = await import("@/lib/quiz-storage.server");
    const config = await loadQuizConfig();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: candidates, error: findError } = await supabaseAdmin
      .from("applications")
      .select("id, full_name, scholar_number, admin_notes, primary_track, secondary_track")
      .ilike("scholar_number", rawScholar)
      .limit(1);

    if (findError || !candidates || candidates.length === 0) {
      throw new Error("Unable to locate candidate registration for quiz submission.");
    }

    const candidate = candidates[0];

    // Prevent duplicate submission
    const existingNotes = candidate.admin_notes || "";
    if (existingNotes.includes("<!--QUIZ:")) {
      throw new Error("You have already submitted this quiz. Multiple attempts are strictly disallowed.");
    }

    // Evaluate answers against dynamic config questions
    let score = 0;
    const total = config.questions.length;

    for (const q of config.questions) {
      const selectedIndex = data.answers[q.id.toString()] ?? null;
      if (selectedIndex === q.correctOptionIndex) {
        score++;
      }
    }

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const minutes = Math.floor(data.timeTakenSeconds / 60);
    const seconds = data.timeTakenSeconds % 60;
    const timeFormatted = `${minutes}m ${seconds}s`;
    const submittedAt = new Date().toISOString();

    const quizResultObj: QuizPreviousResult = {
      score,
      total,
      percentage,
      timeTakenSeconds: data.timeTakenSeconds,
      submittedAt,
    };

    const quizSummaryLine = `[Code & Web Quiz] Score: ${score}/${total} (${percentage}%) | Time: ${timeFormatted} | Date: ${new Date().toLocaleString("en-IN")}`;
    const quizTag = `<!--QUIZ:${JSON.stringify(quizResultObj)}-->`;

    const updatedAdminNotes = existingNotes
      ? `${existingNotes}\n\n${quizSummaryLine}\n${quizTag}`
      : `${quizSummaryLine}\n${quizTag}`;

    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({
        admin_notes: updatedAdminNotes,
        updated_at: submittedAt,
      })
      .eq("id", candidate.id);

    if (updateError) {
      console.error("[Quiz] Error updating application with quiz score:", updateError);
      throw new Error("Failed to record your quiz score. Please inform the SPARK team immediately.");
    }

    return {
      success: true,
      candidateName: candidate.full_name,
      scholarNumber: candidate.scholar_number,
      score,
      total,
      percentage,
      timeTakenSeconds: data.timeTakenSeconds,
      timeFormatted,
      submittedAt,
    };
  });

// ---------------------------------------------------------------------------
// 4. ADMIN: Verify Quiz Admin Password (spark6392)
// ---------------------------------------------------------------------------
export const quizAdminVerifyPassword = createServerFn({ method: "POST" })
  .validator((input: { password: string }) =>
    z.object({ password: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getQuizAdminPassword();
    if (data.password === adminPassword) {
      return { success: true };
    }
    throw new Error("Invalid Quiz Admin password. Access denied.");
  });

// ---------------------------------------------------------------------------
// 5. ADMIN: Get Full Config (Settings + Questions with Answers)
// ---------------------------------------------------------------------------
export const quizAdminGetConfig = createServerFn({ method: "POST" })
  .validator((input: { password: string }) =>
    z.object({ password: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getQuizAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized access. Invalid password.");
    }

    const { loadQuizConfig } = await import("@/lib/quiz-storage.server");
    const config = await loadQuizConfig();
    return { config };
  });

// ---------------------------------------------------------------------------
// 6. ADMIN: Update Config (Pause, Schedule Window, and Questions Editor)
// ---------------------------------------------------------------------------
export const quizAdminUpdateConfig = createServerFn({ method: "POST" })
  .validator(
    (input: {
      password: string;
      settings: {
        isPaused: boolean;
        startTime: string | null;
        endTime: string | null;
        pauseMessage: string;
        durationMinutes: number;
      };
      questions: Array<{
        id: number;
        question: string;
        options: string[];
        correctOptionIndex: number;
        correctAnswerText?: string;
      }>;
    }) =>
      z
        .object({
          password: z.string().min(1),
          settings: z.object({
            isPaused: z.boolean(),
            startTime: z.string().nullable(),
            endTime: z.string().nullable(),
            pauseMessage: z.string(),
            durationMinutes: z.number().min(1).max(180),
          }),
          questions: z.array(
            z.object({
              id: z.number(),
              question: z.string().min(1, "Question statement cannot be empty"),
              options: z.array(z.string()).min(2, "Must have at least 2 options"),
              correctOptionIndex: z.number().min(0),
              correctAnswerText: z.string().optional(),
            })
          ),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getQuizAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized access. Invalid password.");
    }

    // Format and sanitize questions
    const formattedQuestions: QuizQuestionWithAnswer[] = data.questions.map((q, idx) => {
      const safeCorrectIndex = Math.max(0, Math.min(q.options.length - 1, q.correctOptionIndex));
      return {
        id: q.id || idx + 1,
        question: q.question.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctOptionIndex: safeCorrectIndex,
        correctAnswerText: q.options[safeCorrectIndex] || "",
      };
    });

    const newConfig: QuizConfigData = {
      settings: {
        ...data.settings,
        pauseMessage: data.settings.pauseMessage.trim(),
      },
      questions: formattedQuestions,
    };

    const { saveQuizConfig } = await import("@/lib/quiz-storage.server");
    await saveQuizConfig(newConfig);

    return {
      success: true,
      message: "Quiz configuration and questions updated successfully!",
      config: newConfig,
    };
  });

// ---------------------------------------------------------------------------
// 7. ADMIN: Get Candidates Who Have Completed the Quiz
// ---------------------------------------------------------------------------
export const quizAdminGetAttempts = createServerFn({ method: "POST" })
  .validator((input: { password: string }) =>
    z.object({ password: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getQuizAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized access. Invalid password.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: records, error } = await supabaseAdmin
      .from("applications")
      .select("id, full_name, scholar_number, institute_email, primary_track, secondary_track, admin_notes, updated_at")
      .ilike("admin_notes", "%<!--QUIZ:%")
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch quiz attempts.");
    }

    const attempts = (records || []).map((cand) => {
      let parsedQuiz: QuizPreviousResult | null = null;
      const match = cand.admin_notes?.match(/<!--QUIZ:(.*?)-->/);
      if (match) {
        try {
          parsedQuiz = JSON.parse(match[1]) as QuizPreviousResult;
        } catch {
          // ignore
        }
      }
      return {
        id: cand.id,
        fullName: cand.full_name,
        scholarNumber: cand.scholar_number,
        email: cand.institute_email,
        primaryTrack: cand.primary_track,
        quiz: parsedQuiz,
      };
    });

    return { attempts };
  });

// ---------------------------------------------------------------------------
// 8. ADMIN: Reset Candidate Quiz Attempt (Allow Retake)
// ---------------------------------------------------------------------------
export const quizAdminResetCandidate = createServerFn({ method: "POST" })
  .validator((input: { password: string; scholarNumber: string }) =>
    z.object({ password: z.string().min(1), scholarNumber: z.string().min(1) }).parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getQuizAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized access. Invalid password.");
    }

    const rawScholar = data.scholarNumber.trim();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: candidates, error: findError } = await supabaseAdmin
      .from("applications")
      .select("id, full_name, scholar_number, admin_notes")
      .ilike("scholar_number", rawScholar)
      .limit(1);

    if (findError || !candidates || candidates.length === 0) {
      throw new Error(`Scholar number "${rawScholar}" was not found in registrations.`);
    }

    const cand = candidates[0];

    // Strip quiz metadata from admin notes
    let cleanedNotes = cand.admin_notes || "";
    cleanedNotes = cleanedNotes.replace(/<!--QUIZ:[\s\S]*?-->/g, "");
    cleanedNotes = cleanedNotes.replace(/\[Code & Web Quiz\][^\n]*\n?/g, "");
    cleanedNotes = cleanedNotes.trim() || null;

    const { error: updateErr } = await supabaseAdmin
      .from("applications")
      .update({
        admin_notes: cleanedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cand.id);

    if (updateErr) {
      throw new Error("Failed to reset candidate quiz score in database.");
    }

    return {
      success: true,
      candidateName: cand.full_name,
      scholarNumber: cand.scholar_number,
    };
  });

