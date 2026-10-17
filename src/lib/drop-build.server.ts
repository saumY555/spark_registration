import fs from "node:fs/promises";
import path from "node:path";

export interface StoredDropBuildSubmission {
  id: string;
  scholarNumber: string;
  studentName: string;
  websiteUrl: string;
  githubUrl: string | null;
  screenshotUrl: string | null;
  submittedAt: string;
  posterGenerated?: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "drop-your-build-submissions.json");

export async function getLocalBuildSubmissions(): Promise<StoredDropBuildSubmission[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveLocalBuildSubmission(item: StoredDropBuildSubmission): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const current = await getLocalBuildSubmissions();
    const filtered = current.filter(
      (c) => c.scholarNumber.toUpperCase().trim() !== item.scholarNumber.toUpperCase().trim()
    );
    const updated = [item, ...filtered];
    await fs.writeFile(FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Local build store warning]", err);
  }
}
