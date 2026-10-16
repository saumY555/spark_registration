import { describe, expect, it } from "vitest";
import { createNoteSchema } from "@/lib/feedback.functions";
import { NOTE_COLOR_CONFIG } from "@/components/feedback-wall";

describe("Feedback Wall Validation & Config", () => {
  describe("createNoteSchema (Zod Validation)", () => {
    it("validates a standard feedback note", () => {
      const parsed = createNoteSchema.parse({
        message: "Loved the web track workshop! Super excited to deploy my first website with Spark 🔥",
        authorName: "Ananya",
        color: "yellow",
        rotation: 3.5,
      });

      expect(parsed.message).toBe("Loved the web track workshop! Super excited to deploy my first website with Spark 🔥");
      expect(parsed.authorName).toBe("Ananya");
      expect(parsed.color).toBe("yellow");
      expect(parsed.rotation).toBe(3.5);
    });

    it("defaults color to yellow if not specified", () => {
      const parsed = createNoteSchema.parse({
        message: "Great session on Git and GitHub basics!",
      });

      expect(parsed.color).toBe("yellow");
      expect(parsed.authorName).toBeUndefined();
    });

    it("allows omitting authorName (anonymous sticky notes)", () => {
      const parsed = createNoteSchema.parse({
        message: "Anonymous note on the board",
        color: "pink",
      });

      expect(parsed.authorName).toBeUndefined();
      expect(parsed.message).toBe("Anonymous note on the board");
    });

    it("trims whitespace from message and authorName", () => {
      const parsed = createNoteSchema.parse({
        message: "   Cleaned up spaces   ",
        authorName: "   Dev   ",
        color: "lime",
      });

      expect(parsed.message).toBe("Cleaned up spaces");
      expect(parsed.authorName).toBe("Dev");
    });

    it("accepts all valid physical sticky note palette colors", () => {
      const colors = ["yellow", "lime", "pink", "peach", "blue"] as const;
      for (const color of colors) {
        const parsed = createNoteSchema.parse({
          message: `Testing color ${color}`,
          color,
        });
        expect(parsed.color).toBe(color);
      }
    });

    it("rejects invalid colors", () => {
      expect(() =>
        createNoteSchema.parse({
          message: "Invalid color note",
          color: "neon-black",
        })
      ).toThrow();
    });

    it("rejects empty or whitespace-only messages", () => {
      expect(() =>
        createNoteSchema.parse({
          message: "",
        })
      ).toThrow();

      expect(() =>
        createNoteSchema.parse({
          message: "   ",
        })
      ).toThrow();
    });

    it("rejects single-character messages", () => {
      expect(() =>
        createNoteSchema.parse({
          message: "a",
        })
      ).toThrow();
    });

    it("rejects messages exceeding 300 characters", () => {
      const longMessage = "a".repeat(301);
      expect(() =>
        createNoteSchema.parse({
          message: longMessage,
        })
      ).toThrow();

      const valid300 = "a".repeat(300);
      expect(createNoteSchema.parse({ message: valid300 }).message).toBe(valid300);
    });

    it("rejects author names exceeding 40 characters", () => {
      const longName = "a".repeat(41);
      expect(() =>
        createNoteSchema.parse({
          message: "Valid message",
          authorName: longName,
        })
      ).toThrow();
    });

    it("validates rotation bounds (-12 to 12 degrees)", () => {
      expect(createNoteSchema.parse({ message: "Note", rotation: -12 }).rotation).toBe(-12);
      expect(createNoteSchema.parse({ message: "Note", rotation: 12 }).rotation).toBe(12);
      expect(createNoteSchema.parse({ message: "Note", rotation: 0 }).rotation).toBe(0);

      expect(() => createNoteSchema.parse({ message: "Note", rotation: -15 })).toThrow();
      expect(() => createNoteSchema.parse({ message: "Note", rotation: 15 })).toThrow();
    });
  });

  describe("NOTE_COLOR_CONFIG (Visual Paper Palette)", () => {
    it("has configurations for all 5 sticky note colors", () => {
      const expectedColors = ["yellow", "lime", "pink", "peach", "blue"] as const;
      for (const color of expectedColors) {
        const config = NOTE_COLOR_CONFIG[color];
        expect(config).toBeDefined();
        expect(config.name).toBeTruthy();
        expect(config.bgClass).toBeTruthy();
        expect(config.tapeClass).toBeTruthy();
        expect(config.borderClass).toBeTruthy();
        expect(config.badgeDot).toBeTruthy();
        expect(config.ringClass).toBeTruthy();
      }
    });
  });
});
