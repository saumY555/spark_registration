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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatTimestampToIST(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

async function analyze() {
  const { data: rows, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total Applications in Supabase: ${rows.length}\n`);

  const testRows = [];
  const validRows = [];
  const scholarMap = new Map();
  const emailMap = new Map();

  rows.forEach((r, idx) => {
    const isTest =
      r.full_name.toLowerCase().includes("test") ||
      r.full_name.toLowerCase().includes("hello") ||
      r.full_name.toLowerCase().includes("smeiev") ||
      r.registration_no.includes("TEST") ||
      r.scholar_number === "99U999999" ||
      r.scholar_number === "203010061" ||
      r.scholar_number === "25U110061" ||
      r.scholar_number === "25U010061" && r.full_name.toLowerCase().includes("hello");

    const item = {
      index: idx + 1,
      regNo: r.registration_no,
      name: r.full_name,
      scholar: r.scholar_number,
      email: r.institute_email,
      phone: r.phone_number,
      track1: r.primary_track,
      track2: r.secondary_track || "—",
      createdAt: formatTimestampToIST(r.created_at),
      updatedAt: formatTimestampToIST(r.updated_at),
      isTest,
    };

    if (isTest) {
      testRows.push(item);
    } else {
      validRows.push(item);
    }

    if (!scholarMap.has(r.scholar_number)) scholarMap.set(r.scholar_number, []);
    scholarMap.get(r.scholar_number).push(item);

    if (!emailMap.has(r.institute_email)) emailMap.set(r.institute_email, []);
    emailMap.get(r.institute_email).push(item);
  });

  console.log("=========================================");
  console.log(`1. SUSPECTED TEST / DUMMY SUBMISSIONS (${testRows.length} records):`);
  console.log("=========================================");
  testRows.forEach(t => {
    console.log(`- [#${t.index}] ${t.regNo} | Name: "${t.name}" | Scholar: ${t.scholar} | Email: ${t.email} | Time: ${t.createdAt}`);
  });

  console.log("\n=========================================");
  console.log(`2. SCHOLAR NUMBER COLLISIONS / DUPLICATES:`);
  console.log("=========================================");
  let collisionsFound = false;
  scholarMap.forEach((items, scholar) => {
    if (items.length > 1) {
      collisionsFound = true;
      console.log(`\nScholar Number: "${scholar}" (${items.length} submissions):`);
      items.forEach(it => {
        console.log(`  -> [#${it.index}] ${it.regNo} | Name: "${it.name}" | Email: ${it.email} | Track: ${it.track1} | Time: ${it.createdAt}`);
      });
    }
  });
  if (!collisionsFound) console.log("No duplicate scholar numbers found.");

  console.log("\n=========================================");
  console.log(`3. EMAIL ADDRESS COLLISIONS / DUPLICATES:`);
  console.log("=========================================");
  let emailCollisionsFound = false;
  emailMap.forEach((items, email) => {
    if (items.length > 1) {
      emailCollisionsFound = true;
      console.log(`\nEmail: "${email}" (${items.length} submissions):`);
      items.forEach(it => {
        console.log(`  -> [#${it.index}] ${it.regNo} | Name: "${it.name}" | Scholar: ${it.scholar} | Track: ${it.track1} | Time: ${it.createdAt}`);
      });
    }
  });
  if (!emailCollisionsFound) console.log("No duplicate emails found.");

  console.log("\n=========================================");
  console.log(`4. GENUINE CANDIDATE SUBMISSIONS (${validRows.length} records):`);
  console.log("=========================================");
  validRows.forEach((v, i) => {
    console.log(`${i + 1}. [${v.regNo}] ${v.name} | Scholar: ${v.scholar} | ${v.email} | Phone: ${v.phone} | Track: ${v.track1} | ${v.createdAt}`);
  });
}

analyze();
