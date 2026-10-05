import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://jqjpxzslnhfqojmzlvao.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_-kf1QERrfUEJ4QwKDSdmQw_pEFdDAmO";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportData() {
  console.log("Fetching applications from Supabase...");
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching data:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No applications found in table.");
    return;
  }

  const columns = [
    "registration_no",
    "full_name",
    "scholar_number",
    "institute_email",
    "phone_number",
    "primary_track",
    "secondary_track",
    "portfolio_url",
    "motivation",
    "first_year_confirmed",
    "status",
    "created_at",
  ];

  const header = columns.join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCsvCell(row[col])).join(",")
  );

  const csvContent = [header, ...rows].join("\n");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputDir = path.resolve("exports");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csvFile = path.join(outputDir, `applications_${timestamp}.csv`);
  const jsonFile = path.join(outputDir, `applications_${timestamp}.json`);

  fs.writeFileSync(csvFile, csvContent, "utf8");
  fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2), "utf8");

  console.log(`\nExport complete! (${data.length} records)`);
  console.log(`CSV:  ${csvFile}`);
  console.log(`JSON: ${jsonFile}`);
}

exportData();
