/**
 * Fetches all 604 Quran pages (Arabic quran-uthmani + German de.aburida)
 * and saves them to public/quran-data/pages/{page}.json for offline use.
 * Run: node scripts/fetch-quran-data.mjs
 */
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://api.alquran.cloud/v1';
const OUTPUT_DIR = join(__dirname, '..', 'public', 'quran-data', 'pages');

function toVerseKey(surahNumber, ayahNumber) {
  return `${surahNumber}:${ayahNumber}`;
}

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
  return res.json();
}

async function fetchPage(pageNumber, edition) {
  const data = await fetchJson(`/page/${pageNumber}/${edition}`);
  return data;
}

async function fetchAndSavePage(pageNumber) {
  const [arabicData, translationData] = await Promise.all([
    fetchPage(pageNumber, 'quran-uthmani'),
    fetchPage(pageNumber, 'de.aburida').catch(() => null),
  ]);

  const translationMap = new Map();
  if (translationData?.data?.ayahs) {
    for (const ayah of translationData.data.ayahs) {
      const key = toVerseKey(ayah.surah.number, ayah.numberInSurah);
      translationMap.set(key, ayah.text);
    }
  }

  const verses = (arabicData.data?.ayahs || []).map((ayah) => {
    const key = toVerseKey(ayah.surah.number, ayah.numberInSurah);
    return {
      key,
      surahNumber: ayah.surah.number,
      ayahNumber: ayah.numberInSurah,
      juzNumber: ayah.juz,
      pageNumber: ayah.page,
      arabicText: ayah.text,
      translationText: translationMap.get(key) ?? null,
    };
  });

  const result = {
    pageNumber,
    juzNumber: verses[0]?.juzNumber ?? 1,
    verses,
    translationEditionUsed: translationData ? 'de.aburida' : null,
  };

  const outPath = join(OUTPUT_DIR, `${pageNumber}.json`);
  await writeFile(outPath, JSON.stringify(result), 'utf-8');
  return result;
}

async function main() {
  const baseDir = join(__dirname, '..', 'public', 'quran-data');
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log('Fetching surah list...');
  const surahRes = await fetchJson('/surah');
  const surahs = (surahRes.data || []).map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    ayahCount: s.numberOfAyahs,
  }));
  await writeFile(join(baseDir, 'surahs.json'), JSON.stringify(surahs), 'utf-8');

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log('Fetching Juz start pages...');
  const juzStarts = {};
  for (let j = 1; j <= 30; j++) {
    await delay(200);
    const juzRes = await fetchJson(`/juz/${j}/quran-uthmani`);
    const pages = (juzRes.data?.ayahs || []).map((a) => a.page);
    juzStarts[j] = pages.length > 0 ? Math.min(...pages) : 1;
  }
  await writeFile(join(baseDir, 'juz-starts.json'), JSON.stringify(juzStarts), 'utf-8');

  console.log('Fetching Quran pages 1-604...');
  for (let p = 1; p <= 604; p++) {
    await delay(150);
    await fetchAndSavePage(p);
    if (p % 50 === 0) console.log(`  ${p}/604 done`);
  }

  console.log('Done. Quran data saved to public/quran-data/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
