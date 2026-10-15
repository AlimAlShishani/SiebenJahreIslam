import fs from "node:fs";
import path from "node:path";

/**
 * Produktfotos werden automatisch erkannt, sobald sie in `public/produkte/`
 * liegen. Dateiname = Duft-Kürzel (slug), optional mit Größe:
 *   layton.webp      -> Foto für alle Größen
 *   layton-100.webp  -> Foto nur für 100 ml
 * Erlaubt: .webp, .png, .jpg, .jpeg, .avif
 */
export type PhotoKey = "15" | "50" | "100" | "all";
export type PhotoMap = Record<string, Partial<Record<PhotoKey, string>>>;

const PATTERN = /^([a-z0-9-]+?)(?:-(15|50|100))?\.(webp|png|jpe?g|avif)$/i;

export function getPhotoMap(): PhotoMap {
  let files: string[] = [];
  try {
    files = fs.readdirSync(path.join(process.cwd(), "public", "produkte"));
  } catch {
    return {};
  }
  const map: PhotoMap = {};
  for (const file of files) {
    const match = file.match(PATTERN);
    if (!match) continue;
    const slug = match[1].toLowerCase();
    const key = (match[2] ?? "all") as PhotoKey;
    (map[slug] ??= {})[key] = `/produkte/${file}`;
  }
  return map;
}
