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
 * Encodes marks dictionary into an admin_notes tag
 * e.g. [MARKS:{"saumy":{"adminName":"Saumy","score":9,"updatedAt":"..."}}]
 */
export function encodeMarksToNotes(existingNotes: string | null | undefined, scores: Record<string, AdminScoreItem>): string {
  const baseNotes = (existingNotes || "").replace(/\[MARKS:[\s\S]*?\]/g, "").trim();
  const validScores = Object.values(scores).filter((s) => s.score >= 1 && s.score <= 10);
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
  const matches = Array.from(notes.matchAll(/\[MARKS:([\s\S]*?)\]/g));
  if (matches.length === 0) return null;
  const lastMatch = matches[matches.length - 1];
  if (!lastMatch || !lastMatch[1]) return null;

  try {
    const parsed = JSON.parse(lastMatch[1].trim());
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
