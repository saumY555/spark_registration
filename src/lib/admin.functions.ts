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

export interface AdminBuildSubmissionItem {
  id: string;
  scholarNumber: string;
  studentName: string;
  websiteUrl: string;
  githubUrl: string | null;
  screenshotUrl: string | null;
  submittedAt: string;
  posterGenerated: boolean;
  isRegisteredCandidate: boolean;
  registrationNo?: string;
  email?: string;
  phone?: string;
  track?: string;
  status?: string;
}

export const adminGetBuildSubmissions = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }): Promise<{ submissions: AdminBuildSubmissionItem[] }> => {
    const adminPassword = getAdminPassword();
    if (data.password !== adminPassword) {
      throw new Error("Unauthorized. Invalid password.");
    }

    const { getLocalBuildSubmissions } = await import("@/lib/drop-build.server");
    const localList = await getLocalBuildSubmissions();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: applications } = await supabaseAdmin
      .from("applications")
      .select("*")
      .neq("status", "deleted");

    const appMap = new Map<string, (typeof applications extends (infer T)[] | null ? T : never)>();
    (applications || []).forEach((app) => {
      if (app.scholar_number) {
        appMap.set(app.scholar_number.toUpperCase().trim(), app);
      }
    });

    const map = new Map<string, AdminBuildSubmissionItem>();

    // 1. Add all from local persistent store
    for (const item of localList) {
      const scholar = item.scholarNumber.toUpperCase().trim();
      const app = appMap.get(scholar);
      map.set(scholar, {
        id: item.id,
        scholarNumber: scholar,
        studentName: item.studentName || app?.full_name || "Unknown Candidate",
        websiteUrl: item.websiteUrl,
        githubUrl: item.githubUrl || null,
        screenshotUrl: item.screenshotUrl || null,
        submittedAt: item.submittedAt || new Date().toISOString(),
        posterGenerated: Boolean(item.posterGenerated),
        isRegisteredCandidate: Boolean(app),
        registrationNo: app?.registration_no,
        email: app?.institute_email,
        phone: app?.phone_number,
        track: app?.primary_track,
        status: app?.status,
      });
    }

    // 2. Also check if any Supabase application has [DROP_YOUR_BUILD] in admin_notes
    for (const app of applications || []) {
      const scholar = (app.scholar_number || "").toUpperCase().trim();
      if (!scholar) continue;

      const notes = app.admin_notes || "";
      if (notes.includes("[DROP_YOUR_BUILD]") && !map.has(scholar)) {
        const webMatch = notes.match(/Web:\s*(https?:\/\/[^\s|]+)/i);
        const ghMatch = notes.match(/GitHub:\s*(https?:\/\/[^\s|)]+)/i);
        map.set(scholar, {
          id: app.id,
          scholarNumber: scholar,
          studentName: app.full_name,
          websiteUrl: webMatch ? webMatch[1] : app.portfolio_url || "",
          githubUrl: ghMatch ? ghMatch[1] : null,
          screenshotUrl: null,
          submittedAt: app.updated_at || app.created_at,
          posterGenerated: false,
          isRegisteredCandidate: true,
          registrationNo: app.registration_no,
          email: app.institute_email,
          phone: app.phone_number,
          track: app.primary_track,
          status: app.status,
        });
      }
    }

    // Sort newest first
    const list = Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return { submissions: list };
  });

