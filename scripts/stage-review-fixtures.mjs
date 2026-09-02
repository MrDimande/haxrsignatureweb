import fs from "node:fs/promises";
import path from "node:path";

const srcDir = path.join(process.cwd(), ".qa-pdf-output", "guest-report");
const destDir = path.join(process.cwd(), "review-fixtures");
const artifactDir = "C:\\Users\\Aldim\\.gemini\\antigravity-ide\\brain\\2e2e129d-ef54-4596-822b-200e772ffc24";

await fs.mkdir(destDir, { recursive: true });

const canonicalFiles = [
  // PDFs
  "01_social_event_no_seating.pdf",
  "02_large_guest_book_120.pdf",
  "03_social_event_with_seating.pdf",
  "04_dietary_manifest.pdf",
  "05_empty_or_early_stage.pdf",
  "06_non_haxr_guest_book.pdf",

  // Excels
  "01_guest_operations_no_seating.xlsx",
  "02_guest_operations_with_seating.xlsx",
  "03_guest_operations_dietary.xlsx",
  "04_rsvp_gifting_book.xlsx",
  "05_non_haxr_operations.xlsx",
];

// Read all PNGs matching canonical prefixes
const allFiles = await fs.readdir(srcDir);
const pngFiles = allFiles.filter((f) => f.endsWith(".png") && canonicalFiles.some((c) => f.startsWith(c.replace(".pdf", "").replace(".xlsx", ""))));

const filesToCopy = [...canonicalFiles, ...pngFiles];

for (const file of filesToCopy) {
  const src = path.join(srcDir, file);
  try {
    const data = await fs.readFile(src);
    await fs.writeFile(path.join(destDir, file), data);
    await fs.writeFile(path.join(artifactDir, "review-fixtures", file), data).catch(() => {});
    await fs.writeFile(path.join(artifactDir, file), data).catch(() => {});
  } catch (err) {
    console.error(`Failed to copy ${file}:`, err.message);
  }
}

console.log(`Successfully staged ${filesToCopy.length} files to review-fixtures/ and artifact directory!`);
