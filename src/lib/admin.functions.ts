import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function getAdminPassword(): string {
  if (typeof process !== "undefined" && process.env?.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }
  return "spark@1234";
}

export const adminVerifyPassword = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const adminPassword = getAdminPassword();
    if (data.password === adminPassword) {
      return { success: true };
    }
    throw new Error("Invalid admin password. Access denied.");
  });

export const adminGetApplications = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const adminPassword = getAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized. Invalid password.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: applications, error } = await supabaseAdmin
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch applications.");
    }

    return { applications: applications || [] };
  });

export const adminUpdateApplication = createServerFn({ method: "POST" })
  .validator((input: {
    password: string;
    id: string;
    status?: string;
    adminNotes?: string | null;
  }) =>
    z
      .object({
        password: z.string(),
        id: z.string(),
        status: z.string().optional(),
        adminNotes: z.string().nullable().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized. Invalid password.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.status !== undefined) {
      updatePayload.status = data.status;
    }
    if (data.adminNotes !== undefined) {
      updatePayload.admin_notes = data.adminNotes;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("applications")
      .update(updatePayload)
      .eq("id", data.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Failed to update application.");
    }

    return { success: true, application: updated };
  });

export const adminDeleteApplication = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: string }) =>
    z.object({ password: z.string(), id: z.string() }).parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized. Invalid password.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id);

    if (error) {
      throw new Error(error.message || "Failed to delete application.");
    }

    return { success: true };
  });

export const adminResetQuizScore = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: string }) =>
    z.object({ password: z.string(), id: z.string() }).parse(input)
  )
  .handler(async ({ data }) => {
    const adminPassword = getAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized. Invalid password.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cand, error: fetchErr } = await supabaseAdmin
      .from("applications")
      .select("admin_notes")
      .eq("id", data.id)
      .maybeSingle();

    if (fetchErr || !cand) {
      throw new Error("Candidate record not found.");
    }

    let cleanedNotes = cand.admin_notes || "";
    cleanedNotes = cleanedNotes.replace(/<!--QUIZ:[\s\S]*?-->/g, "");
    cleanedNotes = cleanedNotes.replace(/\[Code & Web Quiz\][^\n]*\n?/g, "");
    cleanedNotes = cleanedNotes.trim() || null;

    const { error: updateErr } = await supabaseAdmin
      .from("applications")
      .update({
        admin_notes: cleanedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateErr) {
      throw new Error("Failed to reset candidate quiz score.");
    }

    return { success: true, updatedNotes: cleanedNotes };
  });
