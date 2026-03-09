/**
 * Builds ayah-to-page.json from existing page files (no network).
 * Run: node scripts/build-ayah-index.mjs
 */
import { readFile, writeFile } from 'fs/promises';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, '..', 'public', 'quran-data', 'pages');
const OUTPUT = join(__dirname, '..', 'public', 'quran-data', 'ayah-to-page.json');

async function main() {
  const files = await readdir(PAGES_DIR);
  const pageFiles = files.filter((f) => /^\d+\.json$/.test(f)).sort((a, b) => Number(a.replace('.json', '')) - Number(b.replace('.json', '')));
  const ayahToPage = {};
  for (const f of pageFiles) {
    const raw = await readFile(join(PAGES_DIR, f), 'utf-8');
    const data = JSON.parse(raw);
    for (const v of data.verses || []) {
      const key = `${v.surahNumber}:${v.ayahNumber}`;
      if (!ayahToPage[key]) {
        ayahToPage[key] = { pageNumber: v.pageNumber, juzNumber: v.juzNumber };
      }
    }
  }
  await writeFile(OUTPUT, JSON.stringify(ayahToPage), 'utf-8');
  console.log(`ayah-to-page.json written (${Object.keys(ayahToPage).length} verses)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
