import { describe, it, expect } from "vitest";
import {
  calculateEvaluationSummary,
  normalizeAdminKey,
  encodeMarksToNotes,
  decodeMarksFromNotes,
  type AdminScoreItem,
} from "@/lib/candidate-evaluations.server";

describe("Candidate Evaluations & Admin Marks", () => {
  it("normalizes admin keys case-insensitively", () => {
    expect(normalizeAdminKey(" Saumy ")).toBe("saumy");
    expect(normalizeAdminKey("HARSH")).toBe("harsh");
  });

  it("calculates average marks and count accurately from 1 to 10", () => {
    const scores: Record<string, AdminScoreItem> = {
      saumy: { adminName: "Saumy", score: 8, updatedAt: "2026-10-18T10:00:00Z" },
      ayush: { adminName: "Ayush", score: 9, updatedAt: "2026-10-18T10:05:00Z" },
    };

    const summary = calculateEvaluationSummary(scores);
    expect(summary.count).toBe(2);
    expect(summary.average).toBe(8.5);
  });

  it("returns 0 average when no scores exist", () => {
    const summary = calculateEvaluationSummary({});
    expect(summary.count).toBe(0);
    expect(summary.average).toBe(0);
  });

  it("ignores invalid scores below 1 or above 10", () => {
    const scores: Record<string, AdminScoreItem> = {
      valid1: { adminName: "A", score: 10, updatedAt: "" },
      valid2: { adminName: "B", score: 6, updatedAt: "" },
      invalid1: { adminName: "C", score: 0 as any, updatedAt: "" },
      invalid2: { adminName: "D", score: 12 as any, updatedAt: "" },
    };

    const summary = calculateEvaluationSummary(scores);
    expect(summary.count).toBe(2);
    expect(summary.average).toBe(8.0);
  });

  it("encodes and decodes marks in admin_notes properly", () => {
    const originalNotes = "Good candidate [DROP_YOUR_BUILD] Web: https://example.com";
    const scores: Record<string, AdminScoreItem> = {
      saumy: { adminName: "Saumy", score: 9, updatedAt: "2026-10-18T12:00:00Z" },
      harsh: { adminName: "Harsh", score: 8, updatedAt: "2026-10-18T12:05:00Z" },
    };

    const encoded = encodeMarksToNotes(originalNotes, scores);
    expect(encoded).toContain("Good candidate [DROP_YOUR_BUILD]");
    expect(encoded).toContain("[MARKS:");

    const decoded = decodeMarksFromNotes(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.saumy?.score).toBe(9);
    expect(decoded?.harsh?.score).toBe(8);
  });

  it("replaces existing [MARKS:...] when re-encoding notes", () => {
    const existing = "Candidate note [MARKS:{\"old\":{\"adminName\":\"old\",\"score\":5}}]";
    const newScores: Record<string, AdminScoreItem> = {
      admin1: { adminName: "Admin1", score: 10, updatedAt: "" },
    };

    const updated = encodeMarksToNotes(existing, newScores);
    expect(updated).not.toContain('"old"');
    expect(updated).toContain('"admin1"');
    expect(updated.startsWith("Candidate note")).toBe(true);
  });

  it("correctly ranks candidates based on average marks given by all admins", () => {
    const candidates = [
      { scholar: "26U01", avg: 7.5, count: 2 },
      { scholar: "26U02", avg: 9.5, count: 2 }, // Rank 1
      { scholar: "26U03", avg: 8.5, count: 3 }, // Rank 2 (higher count than 26U04)
      { scholar: "26U04", avg: 8.5, count: 1 }, // Rank 3
    ];

    candidates.sort((a, b) => {
      if (b.avg !== a.avg) return b.avg - a.avg;
      if (b.count !== a.count) return b.count - a.count;
      return a.scholar.localeCompare(b.scholar);
    });

    expect(candidates[0].scholar).toBe("26U02");
    expect(candidates[1].scholar).toBe("26U03");
    expect(candidates[2].scholar).toBe("26U04");
    expect(candidates[3].scholar).toBe("26U01");
  });
});
