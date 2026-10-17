import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidScholarNumber } from "./registration.functions";

/**
 * SSRF & URL safety validator
 * Strictly checks that submitted URLs:
 * - Are valid HTTP/HTTPS URLs
 * - Do not point to localhost, private/link-local IPv4, IPv6 loopbacks, or cloud metadata endpoints
 * - Do not include credentials or non-standard ports
 */
export function isSafePublicUrl(inputUrl: string): { safe: boolean; reason?: string; url?: URL } {
  try {
    const parsed = new URL(inputUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, reason: "Only http:// and https:// URLs are allowed." };
    }

    if (parsed.username || parsed.password) {
      return { safe: false, reason: "Credentials in URLs are not permitted." };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    if (!hostname) {
      return { safe: false, reason: "Invalid hostname." };
    }

    // Check loopback / localhost
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".test") ||
      hostname.endsWith(".example") ||
      hostname.endsWith(".invalid")
    ) {
      return { safe: false, reason: "Local and internal network addresses are not accessible." };
    }

    // Check cloud metadata endpoints
    if (
      hostname === "169.254.169.254" ||
      hostname === "metadata.google.internal" ||
      hostname === "instance-data" ||
      hostname.startsWith("169.254.")
    ) {
      return { safe: false, reason: "Cloud metadata endpoints cannot be accessed." };
    }

    // Check private IPv4 ranges (CIDR blocks: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 0.0.0.0/8)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [_, b0, b1] = ipMatch.map(Number);
      if (b0 === 10) return { safe: false, reason: "Private IP addresses are not permitted." };
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return { safe: false, reason: "Private IP addresses are not permitted." };
      if (b0 === 192 && b1 === 168) return { safe: false, reason: "Private IP addresses are not permitted." };
      if (b0 === 127 || b0 === 0) return { safe: false, reason: "Loopback IP addresses are not permitted." };
    }

    // Restrict to standard ports if port is explicitly provided
    if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
      return { safe: false, reason: "Only standard web ports (80 / 443) are supported." };
    }

    return { safe: true, url: parsed };
  } catch {
    return { safe: false, reason: "Please enter a valid, complete URL (e.g. https://my-site.vercel.app)." };
  }
}

const screenshotInputSchema = z.object({
  url: z.string().trim().min(5, "Please enter a website URL."),
});

/**
 * Server function to safely capture a website screenshot.
 * Fetches through high-availability screenshot providers and converts to Base64
 * data URI on the server to prevent browser CORS canvas tainting during poster generation.
 */
export const captureWebsiteScreenshot = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => screenshotInputSchema.parse(input))
  .handler(async ({ data }) => {
    const safetyCheck = isSafePublicUrl(data.url);
    if (!safetyCheck.safe || !safetyCheck.url) {
      return {
        success: false,
        error: safetyCheck.reason || "Invalid or restricted URL.",
      };
    }

    const targetUrl = safetyCheck.url.toString();

    // 1. Attempt Playwright headless browser capture (720:870 aspect ratio = 1200x1450 @ 2x)
    try {
      const { chromium } = await import("playwright");
      // Try msedge on Windows, or chrome, or standard chromium
      let browser;
      try {
        browser = await chromium.launch({ channel: "msedge", timeout: 6000 });
      } catch {
        try {
          browser = await chromium.launch({ channel: "chrome", timeout: 6000 });
        } catch {
          browser = await chromium.launch({ timeout: 6000 });
        }
      }

      if (browser) {
        const context = await browser.newContext({
          viewport: { width: 1200, height: 1450 },
          deviceScaleFactor: 2,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SparkClub/1.0",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(8000);
        await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
        await page.waitForTimeout(500); // Allow brief hydration

        const buffer = await page.screenshot({
          type: "png",
          fullPage: false,
        });

        await browser.close();

        if (buffer && buffer.byteLength > 1000) {
          const base64 = buffer.toString("base64");
          return {
            success: true,
            dataUrl: `data:image/png;base64,${base64}`,
          };
        }
      }
    } catch (pwErr) {
      console.warn("[Playwright direct capture fallback]", pwErr);
    }

    // 2. High-availability external screenshot providers (1200x1450, 720:870 aspect ratio)
    const providers = [
      `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1200&viewport.height=1450&viewport.deviceScaleFactor=2`,
      `https://s0.wp.com/mshots/v1/${encodeURIComponent(targetUrl)}?w=1200&h=1450`,
    ];

    for (const providerUrl of providers) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(providerUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "SparkClub-BuildDrop/1.0",
            Accept: "image/*",
          },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
          continue;
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength < 500) {
          // Empty or error placeholder
          continue;
        }

        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = contentType.includes("png") ? "image/png" : "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return {
          success: true,
          dataUrl,
        };
      } catch (err) {
        console.warn(`[Screenshot provider failed: ${providerUrl}]`, err);
      }
    }

    return {
      success: false,
      error: "Screenshot capture timed out or the website is currently inaccessible. You can upload a screenshot manually or proceed with the branded poster.",
    };
  });

const buildSubmissionSchema = z.object({
  scholarNumber: z
    .string()
    .trim()
    .refine((val) => isValidScholarNumber(val), {
      message: "Please enter a valid scholar number (e.g. 25U010061 or 25P02F1028).",
    }),
  studentName: z.string().trim().min(2, "Please enter your name.").max(100),
  websiteUrl: z.string().trim().min(5, "Please enter a deployed website URL."),
  githubUrl: z.string().trim().optional(),
  screenshotUrl: z.string().trim().optional(),
});

export type BuildSubmissionInput = z.infer<typeof buildSubmissionSchema>;

/**
 * Server function to record build submissions in Supabase and mirror to Google Sheets
 */
export const submitBuild = createServerFn({ method: "POST" })
  .validator((input: BuildSubmissionInput) => buildSubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const safetyCheck = isSafePublicUrl(data.websiteUrl);
    if (!safetyCheck.safe || !safetyCheck.url) {
      throw new Error(safetyCheck.reason || "Invalid website URL.");
    }

    if (data.githubUrl) {
      const ghSafety = isSafePublicUrl(data.githubUrl);
      if (!ghSafety.safe) {
        throw new Error("Invalid GitHub repository URL.");
      }
    }

    const normalizedScholar = data.scholarNumber.toUpperCase().trim();
    const cleanWebsiteUrl = safetyCheck.url.toString();
    const cleanGithubUrl = data.githubUrl?.trim() || null;

    let submissionId = `BUILD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // 1. Save to Supabase build_submissions table
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: record, error } = await supabaseAdmin
        .from("build_submissions")
        .insert({
          scholar_number: normalizedScholar,
          student_name: data.studentName.trim(),
          website_url: cleanWebsiteUrl,
          github_url: cleanGithubUrl,
          screenshot_url: data.screenshotUrl?.startsWith("http") ? data.screenshotUrl : null,
        })
        .select("id, created_at")
        .maybeSingle();

      if (error) {
        console.warn("[Supabase build_submissions warning]", error.message);
      } else if (record?.id) {
        submissionId = record.id;
      }

      // Also mirror the build link to their applicant profile in applications table
      try {
        await supabaseAdmin
          .from("applications")
          .update({ portfolio_url: cleanWebsiteUrl })
          .eq("scholar_number", normalizedScholar);
      } catch (appUpdateErr) {
        console.warn("[Applications portfolio_url update warning]", appUpdateErr);
      }
    } catch (dbErr) {
      console.warn("[Supabase build_submissions error]", dbErr);
    }

    // 2. Mirror to Google Sheets webhook if configured
    const webhookUrl =
      process.env["GOOGLE_SHEETS_WEBHOOK_URL"] ||
      process.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] ||
      (typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env["GOOGLE_SHEETS_WEBHOOK_URL"] as string) ||
          (import.meta.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] as string)
        : undefined);

    if (webhookUrl && !webhookUrl.includes("YOUR_SCRIPT_ID")) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          redirect: "follow",
          body: JSON.stringify({
            event_type: "drop_your_build",
            created_at: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            scholar_number: normalizedScholar,
            student_name: data.studentName.trim(),
            website_url: cleanWebsiteUrl,
            github_url: cleanGithubUrl || "",
            has_screenshot: Boolean(data.screenshotUrl),
            submission_id: submissionId,
          }),
        });
      } catch (sheetErr) {
        console.warn("[Google Sheets webhook non-fatal error]", sheetErr);
      }
    }

    return {
      success: true,
      submissionId,
    };
  });
