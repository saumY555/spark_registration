import fs from "node:fs/promises";
import path from "node:path";

export {
  calculateEvaluationSummary,
  normalizeAdminKey,
  encodeMarksToNotes,
  decodeMarksFromNotes,
  type AdminScoreItem,
  type CandidateEvaluationRecord,
} from "./candidate-evaluations";
import {
  calculateEvaluationSummary,
  normalizeAdminKey,
  encodeMarksToNotes,
  decodeMarksFromNotes,
  type AdminScoreItem,
  type CandidateEvaluationRecord,
} from "./candidate-evaluations";

const DATA_DIR = path.join(process.cwd(), "data");
const EVAL_FILE_PATH = path.join(DATA_DIR, "candidate-evaluations.json");

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
 * Saves local evaluations to disk (cache fallback)
 */
async function writeLocalEvaluations(data: Record<string, CandidateEvaluationRecord>): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(EVAL_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[writeLocalEvaluations cache warning]", err);
  }
}

/**
 * Retrieves all evaluations, using Supabase (Lovable Cloud) as primary source of truth,
 * merged with any newer local entries.
 */
export async function getAllEvaluations(): Promise<Record<string, CandidateEvaluationRecord>> {
  const localMap = await getLocalEvaluations();
  const evaluationsMap: Record<string, CandidateEvaluationRecord> = {};

  // 1. Load all evaluations from Supabase (source of truth)
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps, error } = await supabaseAdmin
      .from("applications")
      .select("scholar_number, admin_notes, updated_at")
      .neq("status", "deleted");

    if (error) {
      console.warn("[getAllEvaluations Supabase fetch error]", error.message);
    } else if (apps && Array.isArray(apps)) {
      for (const app of apps) {
        const scholar = (app.scholar_number || "").toUpperCase().trim();
        if (!scholar || !app.admin_notes) continue;

        const dbScores = decodeMarksFromNotes(app.admin_notes);
        if (!dbScores || Object.keys(dbScores).length === 0) continue;

        const { average, count } = calculateEvaluationSummary(dbScores);
        evaluationsMap[scholar] = {
          scholarNumber: scholar,
          scores: dbScores,
          average,
          count,
          lastUpdated: app.updated_at || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("[getAllEvaluations Supabase hydration warning]", err);
  }

  // 2. Merge local cache if it has newer entries not yet in DB
  let hasNewFromLocal = false;
  for (const [scholar, localRecord] of Object.entries(localMap)) {
    const dbRecord = evaluationsMap[scholar];
    if (!dbRecord) {
      evaluationsMap[scholar] = localRecord;
      hasNewFromLocal = true;
    } else {
      let merged = false;
      for (const [adminKey, localScore] of Object.entries(localRecord.scores || {})) {
        if (!dbRecord.scores) {
          dbRecord.scores = {};
        }
        const dbScore = dbRecord.scores[adminKey];
        if (!dbScore) {
          dbRecord.scores[adminKey] = localScore;
          merged = true;
        } else if (
          localScore.updatedAt &&
          dbScore.updatedAt &&
          new Date(localScore.updatedAt).getTime() > new Date(dbScore.updatedAt).getTime()
        ) {
          dbRecord.scores[adminKey] = localScore;
          merged = true;
        }
      }
      if (merged) {
        const { average, count } = calculateEvaluationSummary(dbRecord.scores);
        dbRecord.average = average;
        dbRecord.count = count;
        hasNewFromLocal = true;
      }
    }
  }

  // Cache to disk if possible
  writeLocalEvaluations(evaluationsMap).catch(() => {});

  return evaluationsMap;
}

/**
 * Saves or updates a score for a candidate by a specific admin.
 * Updates Supabase applications table immediately and reliably.
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

  // 1. Fetch current candidate records from Supabase case-insensitively
  let existingScores: Record<string, AdminScoreItem> = {};
  let candidateFoundInDb = false;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps, error: fetchErr } = await supabaseAdmin
      .from("applications")
      .select("id, scholar_number, admin_notes, updated_at")
      .ilike("scholar_number", scholarKey)
      .neq("status", "deleted");

    if (fetchErr) {
      console.warn("[saveEvaluation Supabase find error]", fetchErr.message);
    }

    if (apps && apps.length > 0) {
      candidateFoundInDb = true;
      // Get existing scores from DB
      for (const app of apps) {
        const decoded = decodeMarksFromNotes(app.admin_notes);
        if (decoded) {
          existingScores = { ...existingScores, ...decoded };
        }
      }

      // Update or delete score for this admin
      if (score === null || score === 0) {
        delete existingScores[adminKey];
      } else {
        const safeScore = Math.max(1, Math.min(100, Math.round(score)));
        existingScores[adminKey] = {
          adminName: cleanAdminName,
          score: safeScore,
          updatedAt: new Date().toISOString(),
        };
      }

      // Update all matching application rows in Supabase
      for (const app of apps) {
        const updatedNotes = encodeMarksToNotes(app.admin_notes, existingScores);
        const { error: updateErr } = await supabaseAdmin
          .from("applications")
          .update({
            admin_notes: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", app.id);

        if (updateErr) {
          console.error("[saveEvaluation Supabase update failed]", updateErr);
          throw new Error(`Failed to save mark in database: ${updateErr.message}`);
        }
      }
    }
  } catch (dbErr) {
    if (dbErr instanceof Error && dbErr.message.startsWith("Failed to save mark")) {
      throw dbErr;
    }
    console.warn("[saveEvaluation Supabase sync warning]", dbErr);
  }

  // 2. If candidate wasn't in applications table, check local cache
  if (!candidateFoundInDb) {
    const localMap = await getLocalEvaluations();
    const existing = localMap[scholarKey] || {
      scholarNumber: scholarKey,
      scores: {},
      average: 0,
      count: 0,
      lastUpdated: new Date().toISOString(),
    };
    existingScores = { ...(existing.scores || {}) };

    if (score === null || score === 0) {
      delete existingScores[adminKey];
    } else {
      const safeScore = Math.max(1, Math.min(100, Math.round(score)));
      existingScores[adminKey] = {
        adminName: cleanAdminName,
        score: safeScore,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const { average, count } = calculateEvaluationSummary(existingScores);
  const evaluation: CandidateEvaluationRecord = {
    scholarNumber: scholarKey,
    scores: existingScores,
    average,
    count,
    lastUpdated: new Date().toISOString(),
  };

  // Update local cache
  const allMap = await getAllEvaluations();
  allMap[scholarKey] = evaluation;
  writeLocalEvaluations(allMap).catch(() => {});

  return { evaluation, all: allMap };
}
