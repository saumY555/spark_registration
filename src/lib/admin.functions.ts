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
      .neq("status", "deleted")
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
    
    // 1. Immediately update status to 'deleted' so it is guaranteed to be filtered out
    await supabaseAdmin
      .from("applications")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", data.id);

    // 2. Also execute hard delete in case delete permissions are granted
    const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id);

    if (error) {
      console.warn("[Admin Delete Note]", error.message);
    }

    return { success: true };
  });
