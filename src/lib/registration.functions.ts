import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tracks = [
  "Code and Web",
  "AI and Data",
  "Hardware and Robotics",
  "Design and Media",
  "Events and Outreach",
] as const;

export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValid10DigitPhone(val: string): boolean {
  if (!val) return false;
  let clean = val.trim().replace(/[\s\-\(\)]/g, "");
  if (clean.startsWith("+91")) {
    clean = clean.slice(3);
  } else if (clean.startsWith("91") && clean.length === 12) {
    clean = clean.slice(2);
  } else if (clean.startsWith("0") && clean.length === 11) {
    clean = clean.slice(1);
  }
  return /^[6-9]\d{9}$/.test(clean);
}

export const scholarNumberRegex = /^[0-9]{2}[a-zA-Z0-9]{6,10}$/;

export function isValidScholarNumber(val: string): boolean {
  if (!val) return false;
  return scholarNumberRegex.test(val.trim());
}

const baseRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((val) => emailRegex.test(val), {
      message: "Please enter a valid email address (e.g. name@example.com).",
    }),
  phone: z
    .string()
    .trim()
    .refine((val) => isValid10DigitPhone(val), {
      message: "Please enter a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210).",
    }),
  scholarNumber: z
    .string()
    .trim()
    .refine((val) => isValidScholarNumber(val), {
      message: "Please enter a valid scholar number (e.g. 25U010061 or 25P02F1028).",
    }),
  primaryTrack: z.enum(tracks),
  secondaryTrack: z.enum(tracks).optional(),
  portfolioUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
  motivation: z.string().trim().min(20, "Motivation must be at least 20 characters.").max(800),
  consent: z.literal(true),
});

const registrationSchema = baseRegistrationSchema.refine(
  (data) => data.primaryTrack !== data.secondaryTrack,
  {
    message: "Choose a different second track.",
    path: ["secondaryTrack"],
  }
);

export type RegistrationInput = z.infer<typeof registrationSchema>;

const SPREADSHEET_ID = "1O7-6hK2oc4Y_kkwL01GUFVK_gIU9-mB8JLrSTDFnJQ0";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets";

function generateRegistrationNo() {
  return `SGT26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function handleSupabaseError(error: unknown): never {
  if (error && typeof error === "object") {
    const err = error as { code?: string; message?: string; details?: string };
    const errorMsg = (err.message || "").toLowerCase();
    const details = (err.details || "").toLowerCase();

    if (err.code === "23505" || errorMsg.includes("duplicate") || errorMsg.includes("unique")) {
      if (errorMsg.includes("scholar_number") || details.includes("scholar_number")) {
        throw new Error("An application with this Scholar Number has already been submitted.");
      }
      if (
        errorMsg.includes("institute_email") ||
        errorMsg.includes("email") ||
        details.includes("institute_email") ||
        details.includes("email")
      ) {
        throw new Error("An application with this Email Address has already been submitted.");
      }
      throw new Error("An application with this email or scholar number has already been submitted.");
    }
  }

  console.error("[Supabase Error]", error);
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "We couldn't save your registration. Please try again.";
  throw new Error(message);
}

export const submitRegistration = createServerFn({ method: "POST" })
  .validator((input: RegistrationInput) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    const defaultRegNo = generateRegistrationNo();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const insertData = {
      registration_no: defaultRegNo,
      full_name: data.fullName,
      scholar_number: data.scholarNumber.toUpperCase(),
      institute_email: data.email.toLowerCase(),
      phone_number: data.phone,
      primary_track: data.primaryTrack,
      secondary_track: data.secondaryTrack ?? null,
      portfolio_url: data.portfolioUrl || null,
      motivation: data.motivation,
      first_year_confirmed: data.consent,
    };

    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .insert(insertData)
      .select("id, registration_no, created_at")
      .maybeSingle();

    if (error) {
      handleSupabaseError(error);
    }

    const regNo = application?.registration_no || defaultRegNo;
    let sheetSynced = false;
    let sheetSyncError: string | null = null;
    const webhookUrl =
      process.env["GOOGLE_SHEETS_WEBHOOK_URL"] ||
      process.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] ||
      (typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env["GOOGLE_SHEETS_WEBHOOK_URL"] as string) ||
          (import.meta.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] as string)
        : undefined);

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];

    if (webhookUrl && !webhookUrl.includes("YOUR_SCRIPT_ID")) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          redirect: "follow",
          body: JSON.stringify({
            created_at: application?.created_at || new Date().toISOString(),
            registration_no: regNo,
            full_name: data.fullName,
            scholar_number: data.scholarNumber.toUpperCase(),
            institute_email: data.email.toLowerCase(),
            phone_number: data.phone,
            primary_track: data.primaryTrack,
            secondary_track: data.secondaryTrack ?? "",
            portfolio_url: data.portfolioUrl ?? "",
            motivation: data.motivation,
            first_year_confirmed: "Yes",
            status: "pending",
          }),
        });

        if (response.ok) {
          sheetSynced = true;
          console.log("Successfully synced application to Google Sheets:", regNo);
        } else {
          const body = await response.text();
          console.warn("Google Sheets Webhook returned error:", response.status, body);
        }
      } catch (webhookError) {
        sheetSyncError = webhookError instanceof Error ? webhookError.message : "Unknown webhook error";
        console.error("Google Sheets Webhook sync failed:", sheetSyncError);
      }
    } else if (lovableKey && sheetsKey) {
      try {
        const response = await fetch(
          `${GATEWAY_URL}/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": sheetsKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              majorDimension: "ROWS",
              values: [[
                application?.created_at || new Date().toISOString(),
                regNo,
                data.fullName,
                data.email.toLowerCase(),
                data.phone,
                data.scholarNumber.toUpperCase(),
                "First year",
                data.primaryTrack,
                data.secondaryTrack ?? "",
                data.portfolioUrl ?? "",
                data.motivation,
                "Yes",
                "Stored",
              ]],
            }),
          },
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Google Sheets returned ${response.status}: ${body.slice(0, 300)}`);
        }
        sheetSynced = true;
      } catch (syncError) {
        sheetSyncError = syncError instanceof Error ? syncError.message : "Unknown sheet error";
        console.error("Registration saved to Supabase, but Sheet sync failed:", sheetSyncError);
      }
    }

    return {
      registrationNo: regNo,
      candidateId: regNo,
      sheetSynced,
    };
  });

const updateSchema = baseRegistrationSchema
  .extend({
    registrationNo: z.string().trim().min(3),
  })
  .refine((data) => data.primaryTrack !== data.secondaryTrack, {
    message: "Choose a different second track.",
    path: ["secondaryTrack"],
  });

export type UpdateRegistrationInput = z.infer<typeof updateSchema>;

export const updateRegistration = createServerFn({ method: "POST" })
  .validator((input: UpdateRegistrationInput) => updateSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const updatePayload = {
      full_name: data.fullName,
      scholar_number: data.scholarNumber.toUpperCase(),
      institute_email: data.email.toLowerCase(),
      phone_number: data.phone,
      primary_track: data.primaryTrack,
      secondary_track: data.secondaryTrack ?? null,
      portfolio_url: data.portfolioUrl || null,
      motivation: data.motivation,
      first_year_confirmed: data.consent,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedApp, error } = await supabaseAdmin
      .from("applications")
      .update(updatePayload)
      .eq("registration_no", data.registrationNo)
      .select("id, registration_no, created_at, updated_at")
      .maybeSingle();

    if (error) {
      handleSupabaseError(error);
    }

    let sheetSynced = false;
    const webhookUrl =
      process.env["GOOGLE_SHEETS_WEBHOOK_URL"] ||
      process.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] ||
      (typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env["GOOGLE_SHEETS_WEBHOOK_URL"] as string) ||
          (import.meta.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] as string)
        : undefined);

    if (webhookUrl && !webhookUrl.includes("YOUR_SCRIPT_ID")) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          redirect: "follow",
          body: JSON.stringify({
            created_at: updatedApp?.updated_at || new Date().toISOString(),
            registration_no: data.registrationNo,
            full_name: data.fullName,
            scholar_number: data.scholarNumber.toUpperCase(),
            institute_email: data.email.toLowerCase(),
            phone_number: data.phone,
            primary_track: data.primaryTrack,
            secondary_track: data.secondaryTrack ?? "",
            portfolio_url: data.portfolioUrl ?? "",
            motivation: data.motivation,
            first_year_confirmed: "Yes",
            status: "updated",
          }),
        });
        if (response.ok) sheetSynced = true;
      } catch (e) {
        console.warn("Google Sheets update sync error:", e);
      }
    }

    return {
      registrationNo: data.registrationNo,
      candidateId: data.registrationNo,
      sheetSynced,
      isUpdated: true,
    };
  });