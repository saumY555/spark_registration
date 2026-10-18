import fs from "node:fs/promises";
import path from "node:path";

export interface AdminScoreItem {
  adminName: string;
  score: number; // 1 to 10
  updatedAt: string;
}

export interface CandidateEvaluationRecord {
  scholarNumber: string;
  scores: Record<string, AdminScoreItem>;
  average: number;
  count: number;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const EVAL_FILE_PATH = path.join(DATA_DIR, "candidate-evaluations.json");

/**
 * Calculates average and count from a record of admin scores
 */
export function calculateEvaluationSummary(scores: Record<string, AdminScoreItem>): {
  average: number;
  count: number;
} {
  const list = Object.values(scores).filter((s) => typeof s.score === "number" && s.score >= 1 && s.score <= 10);
  if (list.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = list.reduce((acc, curr) => acc + curr.score, 0);
  const average = Number((sum / list.length).toFixed(1));
  return { average, count: list.length };
}

/**
 * Normalizes an admin name key (trimmed, case-insensitive index)
 */
export function normalizeAdminKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Reads local evaluations from the json storage file
 */
export async function getLocalEvaluations(): Promise<Record<string, CandidateEvaluationRecord>> {
  try {
    const raw = await fs.readFile(EVAL_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, CandidateEvaluationRecord>;
    }
  } catch {
    // If file doesn't exist, return empty record
  }
  return {};
}

/**
 * Saves local evaluations to disk
 */
async function writeLocalEvaluations(data: Record<string, CandidateEvaluationRecord>): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(EVAL_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[writeLocalEvaluations error]", err);
  }
}

/**
 * Encodes marks dictionary into an admin_notes tag
 * e.g. [MARKS:{"saumy":{"adminName":"Saumy","score":9,"updatedAt":"..."}}]
 */
export function encodeMarksToNotes(existingNotes: string | null | undefined, scores: Record<string, AdminScoreItem>): string {
  const baseNotes = (existingNotes || "").replace(/\[MARKS:.*?\]/g, "").trim();
  const validScores = Object.values(scores).filter(s => s.score >= 1 && s.score <= 10);
  if (validScores.length === 0) {
    return baseNotes;
  }
  const jsonStr = JSON.stringify(scores);
  const tag = `[MARKS:${jsonStr}]`;
  return baseNotes ? `${baseNotes} ${tag}` : tag;
}

/**
 * Decodes marks dictionary from an admin_notes string
 */
export function decodeMarksFromNotes(notes: string | null | undefined): Record<string, AdminScoreItem> | null {
  if (!notes) return null;
  const match = notes.match(/\[MARKS:(.*?)\]/);
  if (!match || !match[1]) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && typeof parsed === "object") {
      const result: Record<string, AdminScoreItem> = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === "number" && val >= 1 && val <= 10) {
          result[key] = {
            adminName: key,
            score: val,
            updatedAt: new Date().toISOString(),
          };
        } else if (val && typeof val === "object" && typeof (val as AdminScoreItem).score === "number") {
          result[key] = val as AdminScoreItem;
        }
      }
      return result;
    }
  } catch {
    // Parsing error ignored
  }
  return null;
}

/**
 * Retrieves all evaluations, hydrated from local storage and merged with Supabase applications
 */
export async function getAllEvaluations(): Promise<Record<string, CandidateEvaluationRecord>> {
  const localMap = await getLocalEvaluations();

  // Try hydrating missing or updated entries from Supabase applications
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps } = await supabaseAdmin
      .from("applications")
      .select("scholar_number, admin_notes, updated_at")
      .neq("status", "deleted");

    let hasNewFromSupabase = false;

    if (apps && Array.isArray(apps)) {
      for (const app of apps) {
        const scholar = (app.scholar_number || "").toUpperCase().trim();
        if (!scholar || !app.admin_notes) continue;

        const dbScores = decodeMarksFromNotes(app.admin_notes);
        if (!dbScores || Object.keys(dbScores).length === 0) continue;

        const existing = localMap[scholar];
        if (!existing) {
          const { average, count } = calculateEvaluationSummary(dbScores);
          localMap[scholar] = {
            scholarNumber: scholar,
            scores: dbScores,
            average,
            count,
            lastUpdated: app.updated_at || new Date().toISOString(),
          };
          hasNewFromSupabase = true;
        } else {
          // Merge missing admin scores from DB if local didn't have them
          let merged = false;
          for (const [adminKey, item] of Object.entries(dbScores)) {
            if (!existing.scores[adminKey]) {
              existing.scores[adminKey] = item;
              merged = true;
            }
          }
          if (merged) {
            const { average, count } = calculateEvaluationSummary(existing.scores);
            existing.average = average;
            existing.count = count;
            existing.lastUpdated = new Date().toISOString();
            hasNewFromSupabase = true;
          }
        }
      }
    }

    if (hasNewFromSupabase) {
      await writeLocalEvaluations(localMap);
    }
  } catch (err) {
    console.warn("[getAllEvaluations Supabase hydration warning]", err);
  }

  return localMap;
}

/**
 * Saves or updates a score for a candidate by a specific admin
 * score: 1 to 10 (or null / 0 to remove that admin's score)
 */
export async function saveEvaluation(
  scholarNumber: string,
  adminName: string,
  score: number | null
): Promise<{
  evaluation: CandidateEvaluationRecord;
  all: Record<string, CandidateEvaluationRecord>;
}> {
  const scholarKey = scholarNumber.toUpperCase().trim();
  const cleanAdminName = adminName.trim();
  if (!cleanAdminName) {
    throw new Error("Admin name cannot be blank.");
  }
  const adminKey = normalizeAdminKey(cleanAdminName);

  const localMap = await getAllEvaluations();
  const existing = localMap[scholarKey] || {
    scholarNumber: scholarKey,
    scores: {},
    average: 0,
    count: 0,
    lastUpdated: new Date().toISOString(),
  };

  if (score === null || score === 0) {
    // Remove admin score
    delete existing.scores[adminKey];
  } else {
    // Set or update admin score
    const safeScore = Math.max(1, Math.min(10, Math.round(score)));
    existing.scores[adminKey] = {
      adminName: cleanAdminName,
      score: safeScore,
      updatedAt: new Date().toISOString(),
    };
  }

  const { average, count } = calculateEvaluationSummary(existing.scores);
  existing.average = average;
  existing.count = count;
  existing.lastUpdated = new Date().toISOString();

  localMap[scholarKey] = existing;
  await writeLocalEvaluations(localMap);

  // Sync with Supabase applications table if candidate exists
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("applications")
      .select("id, admin_notes")
      .eq("scholar_number", scholarKey)
      .maybeSingle();

    if (app) {
      const updatedNotes = encodeMarksToNotes(app.admin_notes, existing.scores);
      await supabaseAdmin
        .from("applications")
        .update({
          admin_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", app.id);
    }
  } catch (err) {
    console.warn("[saveEvaluation Supabase sync warning]", err);
  }

  return { evaluation: existing, all: localMap };
}
