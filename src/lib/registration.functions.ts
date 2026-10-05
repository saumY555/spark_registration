import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tracks = [
  "Code and Web",
  "AI and Data",
  "Hardware and Robotics",
  "Design and Media",
  "Events and Outreach",
] as const;

const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().regex(/^\+?[0-9\s-]{10,15}$/),
    scholarNumber: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9/-]+$/),
    primaryTrack: z.enum(tracks),
    secondaryTrack: z.enum(tracks).optional(),
    portfolioUrl: z.union([z.literal(""), z.string().trim().url().max(500)]).optional(),
    motivation: z.string().trim().min(20).max(800),
    consent: z.literal(true),
  })
  .refine((data) => data.primaryTrack !== data.secondaryTrack, {
    message: "Choose a different second track.",
    path: ["secondaryTrack"],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

const SPREADSHEET_ID = "1O7-6hK2oc4Y_kkwL01GUFVK_gIU9-mB8JLrSTDFnJQ0";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets";

function generateRegistrationNo() {
  return `SGT26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
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
      .single();

    if (error || !application) {
      if (error) {
        const errorMsg = (error.message || "").toLowerCase();
        const details = (error.details || "").toLowerCase();

        if (error.code === "23505" || errorMsg.includes("duplicate") || errorMsg.includes("unique")) {
          if (errorMsg.includes("scholar_number") || details.includes("scholar_number")) {
            throw new Error("An application with this Scholar Number has already been submitted.");
          }
          if (
            errorMsg.includes("institute_email") ||
            errorMsg.includes("email") ||
            details.includes("institute_email") ||
            details.includes("email")
          ) {
            throw new Error("An application with this Institute Email has already been submitted.");
          }
          throw new Error("An application with this email or scholar number has already been submitted.");
        }
      }

      console.error("[Supabase Error]", error);
      throw new Error(error?.message || "We couldn't save your registration. Please try again.");
    }

    const regNo = application.registration_no || defaultRegNo;
    let sheetSynced = false;
    let sheetSyncError: string | null = null;
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];

    if (lovableKey && sheetsKey) {
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
                application.created_at,
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