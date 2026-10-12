import fs from "fs";
import path from "path";
import { CODE_WEB_QUIZ_QUESTIONS, type QuizQuestionWithAnswer } from "@/data/code-web-quiz";

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

export const DEFAULT_QUIZ_CONFIG: QuizConfigData = {
  settings: {
    isPaused: true, // Default to paused right now as requested
    startTime: null,
    endTime: null,
    pauseMessage:
      "The Code & Web domain assessment is currently locked / paused by coordinators. Please wait for the scheduled time and official announcement.",
    durationMinutes: 20,
  },
  questions: CODE_WEB_QUIZ_QUESTIONS,
};

const CONFIG_FILE_PATH = path.resolve(process.cwd(), "src/data/quiz-config.json");

// In-memory cache for fast server responses
let cachedConfig: QuizConfigData | null = null;

export async function loadQuizConfig(): Promise<QuizConfigData> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // 1. Try reading from Supabase DB first
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: record, error } = await supabaseAdmin
      .from("applications")
      .select("admin_notes")
      .eq("scholar_number", "SYSTEM_QUIZ_CONFIG")
      .maybeSingle();

    if (!error && record?.admin_notes) {
      const parsed = JSON.parse(record.admin_notes) as QuizConfigData;
      if (parsed?.questions && Array.isArray(parsed.questions) && parsed.settings) {
        cachedConfig = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[QuizStorage] Could not load from Supabase:", err);
  }

  // 2. Fallback to local JSON file
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileData = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      const parsed = JSON.parse(fileData) as QuizConfigData;
      if (parsed?.questions && Array.isArray(parsed.questions) && parsed.settings) {
        cachedConfig = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[QuizStorage] Could not load from local file:", err);
  }

  // 3. Fallback to default
  cachedConfig = DEFAULT_QUIZ_CONFIG;
  return DEFAULT_QUIZ_CONFIG;
}

export async function saveQuizConfig(newConfig: QuizConfigData): Promise<void> {
  cachedConfig = newConfig;

  // 1. Save to local file
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("[QuizStorage] Error saving local config file:", err);
  }

  // 2. Save to Supabase DB for persistence
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const serialized = JSON.stringify(newConfig);

    const { data: existing } = await supabaseAdmin
      .from("applications")
      .select("id")
      .eq("scholar_number", "SYSTEM_QUIZ_CONFIG")
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin
        .from("applications")
        .update({
          admin_notes: serialized,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("applications").insert({
        scholar_number: "SYSTEM_QUIZ_CONFIG",
        registration_no: "SYS-CONFIG-001",
        full_name: "SYSTEM_QUIZ_CONFIG",
        institute_email: "system@spark.iiitb",
        phone_number: "0000000000",
        primary_track: "SYSTEM",
        first_year_confirmed: true,
        motivation: "Internal system configuration for Code and Web quiz",
        admin_notes: serialized,
        status: "system",
      });
    }
  } catch (err) {
    console.error("[QuizStorage] Error saving config to Supabase:", err);
  }
}
