/**
 * Fetches Quran pages for EN, RU, TR (en.sahih, ru.kuliev, tr.diyanet).
 * Arabic comes from existing pages/. Run after fetch-quran-data.
 * Skips when data exists. Run locally (nicht auf Vercel – Rate-Limit).
 */
import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://api.alquran.cloud/v1';
const PAGES_DIR = join(__dirname, '..', 'public', 'quran-data', 'pages');
const LANG_CONFIGS = [
  { lang: 'en', edition: 'en.sahih', outDir: 'pages-en' },
  { lang: 'ru', edition: 'ru.kuliev', outDir: 'pages-ru' },
  { lang: 'tr', edition: 'tr.diyanet', outDir: 'pages-tr' },
];

function toVerseKey(surahNumber, ayahNumber) {
  return `${surahNumber}:${ayahNumber}`;
}

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

async function fetchPage(pageNumber, edition) {
  return fetchJson(`/page/${pageNumber}/${edition}`);
}

async function main() {
  const baseDir = join(__dirname, '..', 'public', 'quran-data');
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const { lang, edition, outDir } of LANG_CONFIGS) {
    const outPath = join(baseDir, outDir);
    await mkdir(outPath, { recursive: true });

    try {
      const existing = await readdir(outPath);
      if (existing.filter((f) => /^\d+\.json$/.test(f)).length >= 604) {
        console.log(`${outDir}: already complete, skipping.`);
        continue;
      }
    } catch {
      /* dir empty */
    }

    console.log(`Fetching ${outDir} (${edition})...`);
    for (let p = 1; p <= 604; p++) {
      await delay(400);
      try {
        const arabicPath = join(PAGES_DIR, `${p}.json`);
        const arabicData = JSON.parse(await readFile(arabicPath, 'utf-8'));
        const translationData = await fetchPage(p, edition);

        const translationMap = new Map();
        if (translationData?.data?.ayahs) {
          for (const ayah of translationData.data.ayahs) {
            translationMap.set(toVerseKey(ayah.surah.number, ayah.numberInSurah), ayah.text);
          }
        }

        const verses = (arabicData.verses || []).map((v) => ({
          ...v,
          translationText: translationMap.get(v.key) ?? null,
        }));

        const result = {
          pageNumber: p,
          juzNumber: arabicData.juzNumber ?? 1,
          verses,
          translationEditionUsed: edition,
        };
        await writeFile(join(outPath, `${p}.json`), JSON.stringify(result), 'utf-8');
      } catch (err) {
        console.error(`  Page ${p} failed:`, err.message);
      }
      if (p % 100 === 0) console.log(`  ${p}/604 done`);
    }
    console.log(`${outDir}: done.`);
  }
  console.log('All translations fetched.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
