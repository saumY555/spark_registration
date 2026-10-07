import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envText = fs.existsSync(".env") ? fs.readFileSync(".env", "utf-8") : "";
const env = {};
envText.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
  }
});

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL || "https://jqjpxzslnhfqojmzlvao.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_-kf1QERrfUEJ4QwKDSdmQw_pEFdDAmO";
const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || env.GOOGLE_SHEETS_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbyG4gttQ7PvmmV5d0fuELi0KFG0-Pn_LXoTW4NfaEG3RrzNgOOz_6FkQeXuGpsSGsuuXQ/exec";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncAllToSheets() {
  console.log("1. Fetching all applications from Supabase database...");
  const { data: applications, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: true }); // Oldest to newest so sheet order matches time

  if (error) {
    console.error("Error fetching applications from Supabase:", error);
    process.exit(1);
  }

  console.log(`Found ${applications.length} total applications in Supabase database.\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    const payload = {
      created_at: app.created_at || new Date().toISOString(),
      registration_no: app.registration_no,
      full_name: app.full_name,
      scholar_number: app.scholar_number,
      institute_email: app.institute_email,
      phone_number: app.phone_number,
      primary_track: app.primary_track,
      secondary_track: app.secondary_track || "",
      portfolio_url: app.portfolio_url || "",
      motivation: app.motivation,
      first_year_confirmed: app.first_year_confirmed ? "Yes" : "No",
      status: app.status || "pending",
    };

    process.stdout.write(`[${i + 1}/${applications.length}] Syncing ${app.registration_no} (${app.full_name})... `);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log("✓ OK");
        successCount++;
      } else {
        console.log(`✗ HTTP ${res.status}`);
        failCount++;
      }
    } catch (err) {
      console.log(`✗ Error: ${err.message}`);
      failCount++;
    }

    // Small delay to prevent hitting Google Apps Script rate/lock limits
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n========================================`);
  console.log(`Sync Completed!`);
  console.log(`Total processed: ${applications.length}`);
  console.log(`Successfully synced: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`========================================`);
}

syncAllToSheets();
