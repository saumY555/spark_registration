import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "spark@1234";

export const adminVerifyPassword = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (data.password === ADMIN_PASSWORD) {
      return { success: true };
    }
    throw new Error("Invalid admin password. Access denied.");
  });

export const adminGetApplications = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
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
    if (data.password !== ADMIN_PASSWORD) {
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
    if (data.password !== ADMIN_PASSWORD) {
      throw new Error("Unauthorized. Invalid password.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("applications").delete().eq("id", data.id);

    if (error) {
      throw new Error(error.message || "Failed to delete application.");
    }

    return { success: true };
  });
