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

async function mirrorToSheetsInBackground(params: {
  webhookUrl?: string;
  lovableKey?: string;
  sheetsKey?: string;
  createdAt: string;
  registrationNo: string;
  fullName: string;
  scholarNumber: string;
  email: string;
  phone: string;
  primaryTrack: string;
  secondaryTrack?: string;
  portfolioUrl?: string;
  motivation: string;
  status: "pending" | "updated";
}) {
  const { webhookUrl, lovableKey, sheetsKey } = params;

  if (webhookUrl && !webhookUrl.includes("YOUR_SCRIPT_ID")) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify({
          created_at: params.createdAt,
          registration_no: params.registrationNo,
          full_name: params.fullName,
          scholar_number: params.scholarNumber,
          institute_email: params.email,
          phone_number: params.phone,
          primary_track: params.primaryTrack,
          secondary_track: params.secondaryTrack || "",
          portfolio_url: params.portfolioUrl || "",
          motivation: params.motivation,
          first_year_confirmed: "Yes",
          status: params.status,
        }),
      });
      console.log(`[Google Sheets Webhook] Synced ${params.registrationNo}`);
    } catch (err) {
      console.error("[Google Sheets Webhook Error]", err);
    }
  } else if (lovableKey && sheetsKey) {
    try {
      await fetch(
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
              params.createdAt,
              params.registrationNo,
              params.fullName,
              params.email,
              params.phone,
              params.scholarNumber,
              "First year",
              params.primaryTrack,
              params.secondaryTrack || "",
              params.portfolioUrl || "",
              params.motivation,
              "Yes",
              params.status === "updated" ? "Updated" : "Stored",
            ]],
          }),
        }
      );
      console.log(`[Google Sheets Gateway] Synced ${params.registrationNo}`);
    } catch (err) {
      console.error("[Google Sheets Gateway Error]", err);
    }
  }
}

export const submitRegistration = createServerFn({ method: "POST" })
  .validator((input: RegistrationInput) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const normalizedScholar = data.scholarNumber.toUpperCase().trim();
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if an application already exists for this scholar number or email
    const { data: existingApp } = await supabaseAdmin
      .from("applications")
      .select("id, registration_no, created_at")
      .or(`scholar_number.eq.${normalizedScholar},institute_email.eq.${normalizedEmail}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const webhookUrl =
      process.env["GOOGLE_SHEETS_WEBHOOK_URL"] ||
      process.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] ||
      (typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env["GOOGLE_SHEETS_WEBHOOK_URL"] as string) ||
          (import.meta.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] as string)
        : undefined);

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];

    // If an application already exists, update it instead of creating a duplicate row!
    if (existingApp && existingApp.registration_no) {
      const regNo = existingApp.registration_no;
      const updatePayload = {
        full_name: data.fullName,
        scholar_number: normalizedScholar,
        institute_email: normalizedEmail,
        phone_number: data.phone,
        primary_track: data.primaryTrack,
        secondary_track: data.secondaryTrack ?? null,
        portfolio_url: data.portfolioUrl || null,
        motivation: data.motivation,
        first_year_confirmed: data.consent,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedApp, error: updateError } = await supabaseAdmin
        .from("applications")
        .update(updatePayload)
        .eq("id", existingApp.id)
        .select("id, registration_no, created_at, updated_at")
        .maybeSingle();

      if (updateError) {
        handleSupabaseError(updateError);
      }

      // Non-blocking asynchronous sync to Google Sheets mirror
      void mirrorToSheetsInBackground({
        webhookUrl,
        lovableKey,
        sheetsKey,
        createdAt: updatedApp?.updated_at || new Date().toISOString(),
        registrationNo: regNo,
        fullName: data.fullName,
        scholarNumber: normalizedScholar,
        email: normalizedEmail,
        phone: data.phone,
        primaryTrack: data.primaryTrack,
        secondaryTrack: data.secondaryTrack,
        portfolioUrl: data.portfolioUrl,
        motivation: data.motivation,
        status: "updated",
      });

      return {
        registrationNo: regNo,
        candidateId: regNo,
        sheetSynced: true,
        isUpdated: true,
      };
    }

    // Otherwise, perform a new insertion
    const defaultRegNo = generateRegistrationNo();
    const insertData = {
      registration_no: defaultRegNo,
      full_name: data.fullName,
      scholar_number: normalizedScholar,
      institute_email: normalizedEmail,
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

    // Non-blocking asynchronous sync to Google Sheets mirror
    void mirrorToSheetsInBackground({
      webhookUrl,
      lovableKey,
      sheetsKey,
      createdAt: application?.created_at || new Date().toISOString(),
      registrationNo: regNo,
      fullName: data.fullName,
      scholarNumber: normalizedScholar,
      email: normalizedEmail,
      phone: data.phone,
      primaryTrack: data.primaryTrack,
      secondaryTrack: data.secondaryTrack,
      portfolioUrl: data.portfolioUrl,
      motivation: data.motivation,
      status: "pending",
    });

    return {
      registrationNo: regNo,
      candidateId: regNo,
      sheetSynced: true,
      isUpdated: false,
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
    const normalizedScholar = data.scholarNumber.toUpperCase().trim();
    const normalizedEmail = data.email.toLowerCase().trim();

    const updatePayload = {
      full_name: data.fullName,
      scholar_number: normalizedScholar,
      institute_email: normalizedEmail,
      phone_number: data.phone,
      primary_track: data.primaryTrack,
      secondary_track: data.secondaryTrack ?? null,
      portfolio_url: data.portfolioUrl || null,
      motivation: data.motivation,
      first_year_confirmed: data.consent,
      updated_at: new Date().toISOString(),
    };

    let { data: updatedApp, error } = await supabaseAdmin
      .from("applications")
      .update(updatePayload)
      .eq("registration_no", data.registrationNo)
      .select("id, registration_no, created_at, updated_at")
      .maybeSingle();

    if (!updatedApp && !error) {
      // Fallback: try by scholar_number or email in case registration_no differed
      const fallbackResult = await supabaseAdmin
        .from("applications")
        .update(updatePayload)
        .or(`scholar_number.eq.${normalizedScholar},institute_email.eq.${normalizedEmail}`)
        .select("id, registration_no, created_at, updated_at")
        .maybeSingle();
      
      updatedApp = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      handleSupabaseError(error);
    }

    const regNo = updatedApp?.registration_no || data.registrationNo;
    const webhookUrl =
      process.env["GOOGLE_SHEETS_WEBHOOK_URL"] ||
      process.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] ||
      (typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env["GOOGLE_SHEETS_WEBHOOK_URL"] as string) ||
          (import.meta.env["VITE_GOOGLE_SHEETS_WEBHOOK_URL"] as string)
        : undefined);

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];

    // Non-blocking asynchronous sync to Google Sheets mirror
    void mirrorToSheetsInBackground({
      webhookUrl,
      lovableKey,
      sheetsKey,
      createdAt: updatedApp?.updated_at || new Date().toISOString(),
      registrationNo: regNo,
      fullName: data.fullName,
      scholarNumber: normalizedScholar,
      email: normalizedEmail,
      phone: data.phone,
      primaryTrack: data.primaryTrack,
      secondaryTrack: data.secondaryTrack,
      portfolioUrl: data.portfolioUrl,
      motivation: data.motivation,
      status: "updated",
    });

    return {
      registrationNo: regNo,
      candidateId: regNo,
      sheetSynced: true,
      isUpdated: true,
    };
  });