import { supabase } from '../../lib/supabase.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { uploadTrainingPage, deleteStorageObjects } from '../../lib/storage.js';

export interface TrainingPage {
  id: string;
  page_number: number;
  image_url: string;
  storage_path?: string;
}

export interface Training {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const TRAINING_COLUMNS = 'id, slug, title, subtitle, sort_order, active, created_at, updated_at';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'egitim';
}

export async function listTrainings(onlyActive: boolean): Promise<(Training & { pageCount: number })[]> {
  let query = supabase
    .from('trainings')
    .select(`${TRAINING_COLUMNS}, training_pages(count)`)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (onlyActive) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((t: any) => ({
    ...t,
    pageCount: Array.isArray(t.training_pages) ? (t.training_pages[0]?.count ?? 0) : 0,
    training_pages: undefined,
  })) as (Training & { pageCount: number })[];
}

export async function getTraining(id: string): Promise<Training & { pages: TrainingPage[] }> {
  const { data, error } = await supabase
    .from('trainings')
    .select(TRAINING_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Eğitim bulunamadı.');

  const { data: pages, error: pErr } = await supabase
    .from('training_pages')
    .select('id, page_number, image_url')
    .eq('training_id', id)
    .order('page_number', { ascending: true });
  if (pErr) throw pErr;

  return { ...(data as Training), pages: (pages ?? []) as TrainingPage[] };
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = supabase.from('trainings').select('id').eq('slug', slug);
  if (exceptId) query = query.neq('id', exceptId);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export interface CreateTrainingInput {
  title: string;
  subtitle?: string;
  slug?: string;
  sort_order?: number;
}

export async function createTraining(input: CreateTrainingInput): Promise<Training> {
  const title = input.title.trim();
  if (!title) throw badRequest('Başlık boş olamaz.');
  let slug = (input.slug && input.slug.trim()) || slugify(title);
  if (await slugTaken(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await supabase
    .from('trainings')
    .insert({
      title,
      slug,
      subtitle: input.subtitle?.trim() || null,
      sort_order: input.sort_order ?? 0,
    })
    .select(TRAINING_COLUMNS)
    .single();
  if (error) throw error;
  return data as Training;
}

export interface UpdateTrainingInput {
  title?: string;
  subtitle?: string | null;
  slug?: string;
  sort_order?: number;
  active?: boolean;
}

export async function updateTraining(id: string, input: UpdateTrainingInput): Promise<Training> {
  const { data: existing, error: exErr } = await supabase
    .from('trainings')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (exErr) throw exErr;
  if (!existing) throw notFound('Eğitim bulunamadı.');

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) {
    if (!input.title.trim()) throw badRequest('Başlık boş olamaz.');
    patch.title = input.title.trim();
  }
  if (input.subtitle !== undefined) patch.subtitle = input.subtitle?.trim() || null;
  if (input.slug !== undefined) {
    const slug = input.slug.trim();
    if (!slug) throw badRequest('Slug boş olamaz.');
    if (await slugTaken(slug, id)) throw conflict('Bu slug zaten kullanılıyor.');
    patch.slug = slug;
  }
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.active !== undefined) patch.active = input.active;

  const { data, error } = await supabase
    .from('trainings')
    .update(patch)
    .eq('id', id)
    .select(TRAINING_COLUMNS)
    .single();
  if (error) throw error;
  return data as Training;
}

export async function deleteTraining(id: string): Promise<void> {
  // Önce storage objelerini topla
  const { data: pages } = await supabase
    .from('training_pages')
    .select('storage_path')
    .eq('training_id', id);
  const { error } = await supabase.from('trainings').delete().eq('id', id);
  if (error) throw error;
  const paths = (pages ?? []).map((p: any) => p.storage_path).filter(Boolean);
  await deleteStorageObjects(paths);
}

async function ensureTrainingExists(id: string): Promise<void> {
  const { data, error } = await supabase.from('trainings').select('id').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Eğitim bulunamadı.');
}

async function maxPageNumber(trainingId: string): Promise<number> {
  const { data, error } = await supabase
    .from('training_pages')
    .select('page_number')
    .eq('training_id', trainingId)
    .order('page_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.page_number ?? 0;
}

// PNG buffer'larını sırayla yükler, mevcut sayfaların sonuna ekler.
export async function addPages(trainingId: string, buffers: Buffer[]): Promise<TrainingPage[]> {
  await ensureTrainingExists(trainingId);
  if (!buffers.length) throw badRequest('En az bir PNG dosyası gerekli.');

  let pageNumber = await maxPageNumber(trainingId);
  const created: TrainingPage[] = [];

  for (const buffer of buffers) {
    pageNumber += 1;
    const { storagePath, imageUrl } = await uploadTrainingPage(trainingId, buffer);
    const { data, error } = await supabase
      .from('training_pages')
      .insert({
        training_id: trainingId,
        page_number: pageNumber,
        storage_path: storagePath,
        image_url: imageUrl,
      })
      .select('id, page_number, image_url')
      .single();
    if (error) {
      // DB yazımı patlarsa az önce yüklenen objeyi geri al (storage/DB tutarlılığı)
      await deleteStorageObjects([storagePath]);
      throw error;
    }
    created.push(data as TrainingPage);
  }
  return created;
}

// Sayfa id sırasına göre page_number'ları yeniden ata.
// unique(training_id, page_number) çakışmasını önlemek için iki fazlı (önce negatif).
export async function reorderPages(trainingId: string, orderedIds: string[]): Promise<TrainingPage[]> {
  await ensureTrainingExists(trainingId);
  const { data: pages, error } = await supabase
    .from('training_pages')
    .select('id')
    .eq('training_id', trainingId);
  if (error) throw error;
  const existingIds = new Set((pages ?? []).map((p: any) => p.id));
  if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
    throw badRequest('Sıralama listesi mevcut sayfalarla birebir eşleşmeli.');
  }

  // Faz 1: geçici negatif numaralar (çakışma engelle)
  for (let i = 0; i < orderedIds.length; i++) {
    const { error: e } = await supabase
      .from('training_pages')
      .update({ page_number: -(i + 1) })
      .eq('id', orderedIds[i]);
    if (e) throw e;
  }
  // Faz 2: nihai 1..N
  for (let i = 0; i < orderedIds.length; i++) {
    const { error: e } = await supabase
      .from('training_pages')
      .update({ page_number: i + 1 })
      .eq('id', orderedIds[i]);
    if (e) throw e;
  }

  const { data: result, error: rErr } = await supabase
    .from('training_pages')
    .select('id, page_number, image_url')
    .eq('training_id', trainingId)
    .order('page_number', { ascending: true });
  if (rErr) throw rErr;
  return (result ?? []) as TrainingPage[];
}

// Bir sayfayı sil ve kalanları 1..N olacak şekilde yeniden numaralandır.
export async function deletePage(trainingId: string, pageId: string): Promise<TrainingPage[]> {
  await ensureTrainingExists(trainingId);
  const { data: page, error } = await supabase
    .from('training_pages')
    .select('id, storage_path')
    .eq('training_id', trainingId)
    .eq('id', pageId)
    .maybeSingle();
  if (error) throw error;
  if (!page) throw notFound('Sayfa bulunamadı.');

  const { error: delErr } = await supabase.from('training_pages').delete().eq('id', pageId);
  if (delErr) throw delErr;
  await deleteStorageObjects([(page as any).storage_path].filter(Boolean));

  // Kalanları yeniden numaralandır
  const { data: remaining, error: rErr } = await supabase
    .from('training_pages')
    .select('id')
    .eq('training_id', trainingId)
    .order('page_number', { ascending: true });
  if (rErr) throw rErr;
  const ids = (remaining ?? []).map((p: any) => p.id);
  if (ids.length) return reorderPages(trainingId, ids);
  return [];
}
