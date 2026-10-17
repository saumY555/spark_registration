import { describe, expect, it } from "vitest";
import { isSafePublicUrl } from "@/lib/build-submission.functions";
import { isValidScholarNumber } from "@/lib/registration.functions";

describe("Drop Your Build Security & Validation", () => {
  describe("isSafePublicUrl (SSRF Protection)", () => {
    it("allows valid public HTTPS and HTTP URLs", () => {
      expect(isSafePublicUrl("https://my-first-site.vercel.app").safe).toBe(true);
      expect(isSafePublicUrl("https://student.github.io/portfolio/").safe).toBe(true);
      expect(isSafePublicUrl("http://sparkclub-demo.netlify.app").safe).toBe(true);
    });

    it("blocks localhost and loopback addresses", () => {
      expect(isSafePublicUrl("http://localhost:3000").safe).toBe(false);
      expect(isSafePublicUrl("http://127.0.0.1:8080").safe).toBe(false);
      expect(isSafePublicUrl("http://0.0.0.0").safe).toBe(false);
      expect(isSafePublicUrl("http://[::1]").safe).toBe(false);
      expect(isSafePublicUrl("http://app.localhost").safe).toBe(false);
    });

    it("blocks private IPv4 address ranges", () => {
      expect(isSafePublicUrl("http://192.168.1.1").safe).toBe(false);
      expect(isSafePublicUrl("http://10.0.0.5").safe).toBe(false);
      expect(isSafePublicUrl("http://172.16.0.1").safe).toBe(false);
      expect(isSafePublicUrl("http://172.31.255.255").safe).toBe(false);
    });

    it("blocks cloud metadata endpoints", () => {
      expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data/").safe).toBe(false);
      expect(isSafePublicUrl("http://metadata.google.internal").safe).toBe(false);
    });

    it("blocks non-HTTP protocols", () => {
      expect(isSafePublicUrl("javascript:alert(1)").safe).toBe(false);
      expect(isSafePublicUrl("file:///etc/passwd").safe).toBe(false);
      expect(isSafePublicUrl("ftp://ftp.example.com").safe).toBe(false);
      expect(isSafePublicUrl("gopher://example.com").safe).toBe(false);
    });

    it("blocks credentials in URLs", () => {
      expect(isSafePublicUrl("https://admin:secret@example.com").safe).toBe(false);
    });
  });

  describe("Scholar Number Validation", () => {
    it("validates typical IIIT Bhopal scholar numbers", () => {
      expect(isValidScholarNumber("25U010061")).toBe(true);
      expect(isValidScholarNumber("25P02F1028")).toBe(true);
      expect(isValidScholarNumber("24U010012")).toBe(true);
    });

    it("rejects invalid scholar numbers", () => {
      expect(isValidScholarNumber("")).toBe(false);
      expect(isValidScholarNumber("123")).toBe(false);
      expect(isValidScholarNumber("ABC")).toBe(false);
    });
  });

  describe("Poster Title Customization & Defaults", () => {
    function parsePosterTitleLines(rawLine1?: string, rawLine2?: string) {
      const cleanLine1 = (rawLine1 || "EXCITED TO SHARE").trim().toUpperCase().slice(0, 36);
      const cleanLine2 = (rawLine2 || "MY FIRST WEBSITE!").trim().toUpperCase().slice(0, 36);

      const words = cleanLine2.split(/\s+/).filter(Boolean);
      let firstPart = "";
      let lastWord = words[0] || "WEBSITE!";

      if (words.length > 1) {
        lastWord = words.pop()!;
        firstPart = words.join(" ") + " ";
      }

      return { cleanLine1, cleanLine2, firstPart, lastWord };
    }

    it("falls back to ground-truth defaults when lines are omitted or empty", () => {
      const result = parsePosterTitleLines();
      expect(result.cleanLine1).toBe("EXCITED TO SHARE");
      expect(result.cleanLine2).toBe("MY FIRST WEBSITE!");
      expect(result.firstPart).toBe("MY FIRST ");
      expect(result.lastWord).toBe("WEBSITE!");
    });

    it("allows custom Line 1 and Line 2 while styling final word", () => {
      const result = parsePosterTitleLines("BUILT WITH LOVE", "CHECK OUT MY PORTFOLIO");
      expect(result.cleanLine1).toBe("BUILT WITH LOVE");
      expect(result.cleanLine2).toBe("CHECK OUT MY PORTFOLIO");
      expect(result.firstPart).toBe("CHECK OUT MY ");
      expect(result.lastWord).toBe("PORTFOLIO");
    });

    it("handles single-word Line 2 correctly", () => {
      const result = parsePosterTitleLines("JUST LAUNCHED", "PROJECT!");
      expect(result.cleanLine1).toBe("JUST LAUNCHED");
      expect(result.firstPart).toBe("");
      expect(result.lastWord).toBe("PROJECT!");
    });
  });
});
