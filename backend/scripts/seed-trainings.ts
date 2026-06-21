/**
 * Mevcut 3 eğitimi (eski index.html'deki koda gömülü dizi) ve
 * trainings/<id>/page-N.png görsellerini Supabase Storage + DB'ye taşır.
 *
 * Çalıştır:  npm run seed   (kökten)  veya  npm run seed --workspace backend
 *
 * Idempotent: aynı slug zaten varsa ve sayfaları varsa atlar.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { supabase, STORAGE_BUCKET } from '../src/lib/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/scripts -> proje kökü
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

interface SeedTraining {
  slug: string;
  title: string;
  subtitle: string;
  pages: string[]; // proje köküne göre göreli yollar
}

const TRAININGS: SeedTraining[] = [
  {
    slug: 'depo-sayimi',
    title: 'Depo Sayımı Oluşturma',
    subtitle: "Foodsoft'ta depo sayımı oluşturma rehberi",
    pages: [
      'trainings/depo-sayimi/page-1.png',
      'trainings/depo-sayimi/page-2.png',
      'trainings/depo-sayimi/page-3.png',
      'trainings/depo-sayimi/page-4.png',
      'trainings/depo-sayimi/page-5.png',
      'trainings/depo-sayimi/page-6.png',
    ],
  },
  {
    slug: 'talep-acma',
    title: 'Talep Açma',
    subtitle: "Foodsoft'ta talep açma işlemleri rehberi",
    pages: [
      'trainings/talep-acma/page-1.png',
      'trainings/talep-acma/page-2.png',
      'trainings/talep-acma/page-3.png',
      'trainings/talep-acma/page-4.png',
      'trainings/talep-acma/page-5.png',
    ],
  },
  {
    slug: 'irsaliye-isleme',
    title: 'İrsaliye İşleme',
    subtitle: "Foodsoft'ta irsaliye işleme rehberi",
    pages: [
      'trainings/irsaliye-isleme/page-1.png',
      'trainings/irsaliye-isleme/page-2.png',
      'trainings/irsaliye-isleme/page-3.png',
      'trainings/irsaliye-isleme/page-4.png',
      'trainings/irsaliye-isleme/page-5.png',
      'trainings/irsaliye-isleme/page-6.png',
      'trainings/irsaliye-isleme/page-7.png',
    ],
  },
];

async function upsertTraining(t: SeedTraining, sortOrder: number): Promise<string> {
  const { data: existing } = await supabase
    .from('trainings')
    .select('id')
    .eq('slug', t.slug)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from('trainings')
    .insert({ slug: t.slug, title: t.title, subtitle: t.subtitle, sort_order: sortOrder })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function seedPages(trainingId: string, t: SeedTraining): Promise<void> {
  const { count } = await supabase
    .from('training_pages')
    .select('id', { count: 'exact', head: true })
    .eq('training_id', trainingId);
  if ((count ?? 0) > 0) {
    console.log(`  ↷ "${t.title}" zaten ${count} sayfaya sahip, atlanıyor.`);
    return;
  }

  let pageNumber = 0;
  for (const rel of t.pages) {
    const abs = path.join(PROJECT_ROOT, rel);
    if (!existsSync(abs)) {
      console.warn(`  ⚠ dosya yok, atlanıyor: ${rel}`);
      continue;
    }
    pageNumber += 1;
    const buffer = await readFile(abs);
    const storagePath = `trainings/${trainingId}/page-${pageNumber}.png`;

    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
    if (upErr) throw upErr;

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    const { error: insErr } = await supabase.from('training_pages').insert({
      training_id: trainingId,
      page_number: pageNumber,
      storage_path: storagePath,
      image_url: urlData.publicUrl,
    });
    if (insErr) throw insErr;
    console.log(`  ✓ sayfa ${pageNumber} yüklendi`);
  }
}

async function main() {
  console.log('Seed başlıyor...\n');
  for (let i = 0; i < TRAININGS.length; i++) {
    const t = TRAININGS[i];
    console.log(`• ${t.title} (${t.slug})`);
    const id = await upsertTraining(t, i);
    await seedPages(id, t);
  }
  console.log('\n✅ Seed tamamlandı.');
}

main().catch((err) => {
  console.error('\n❌ Seed hatası:', err);
  process.exit(1);
});
