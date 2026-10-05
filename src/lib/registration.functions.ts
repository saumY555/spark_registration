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

function candidateId() {
  return `SGT26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: RegistrationInput) => registrationSchema.parse(input))
  .handler(async ({ data }) => {
    const id = candidateId();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: registration, error } = await supabaseAdmin
      .from("spark_registrations")
      .insert({
        candidate_id: id,
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        scholar_number: data.scholarNumber.toUpperCase(),
        primary_track: data.primaryTrack,
        secondary_track: data.secondaryTrack ?? null,
        portfolio_url: data.portfolioUrl || null,
        motivation: data.motivation,
        consent: data.consent,
      })
      .select("id, created_at")
      .single();

    if (error || !registration) {
      throw new Error("We couldn't save your registration. Please try again.");
    }

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
                registration.created_at,
                id,
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
        console.error("Registration saved, but Sheet sync failed:", sheetSyncError);
      }
    } else {
      sheetSyncError = "Google Sheets connection is not configured.";
    }

    try {
      await supabaseAdmin
        .from("spark_registrations")
        .update({ sheet_synced: sheetSynced, sheet_sync_error: sheetSyncError })
        .eq("id", registration.id);
    } catch (e) {
      console.warn("Could not update sheet sync status:", e);
    }

    return { candidateId: id, sheetSynced };
  });