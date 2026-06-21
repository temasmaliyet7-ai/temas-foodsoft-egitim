import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { assertPng } from '../../lib/storage.js';
import { badRequest } from '../../lib/errors.js';
import {
  listTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  addPages,
  reorderPages,
  deletePage,
} from './trainings.service.js';

const idParam = z.object({ id: z.string().uuid('Geçersiz eğitim kimliği') });
const pageParams = z.object({
  id: z.string().uuid(),
  pageId: z.string().uuid(),
});

const createSchema = z.object({
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  sort_order: z.number().int().optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  subtitle: z.string().trim().nullable().optional(),
  slug: z.string().trim().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
});

const reorderSchema = z.object({ order: z.array(z.string().uuid()).min(1) });

export async function trainingsRoutes(app: FastifyInstance): Promise<void> {
  // Eğitimleri görmek için en azından giriş yapılmış olmalı
  app.addHook('preHandler', requireAuth);

  // Liste: admin hepsini, kullanıcı yalnızca aktifleri görür
  app.get('/', async (req) => {
    const isAdmin = req.user!.role === 'admin';
    const trainings = await listTrainings(!isAdmin);
    return { trainings };
  });

  app.get('/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const training = await getTraining(id);
    return { training };
  });

  // --- Aşağısı yalnızca admin ---
  const adminOnly = { preHandler: requireRole('admin') };

  app.post('/', adminOnly, async (req, reply) => {
    const body = createSchema.parse(req.body);
    const training = await createTraining(body);
    return reply.status(201).send({ training });
  });

  app.patch('/:id', adminOnly, async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const training = await updateTraining(id, body);
    return { training };
  });

  app.delete('/:id', adminOnly, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    await deleteTraining(id);
    return reply.status(204).send();
  });

  // Çoklu PNG yükleme (multipart, field adı: pages)
  app.post('/:id/pages', adminOnly, async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const buffers: Buffer[] = [];
    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        assertPng(buffer); // MIME + magic byte + boyut kontrolü
        buffers.push(buffer);
      }
    }
    if (!buffers.length) throw badRequest('En az bir PNG dosyası yükleyin.');
    const pages = await addPages(id, buffers);
    return reply.status(201).send({ pages });
  });

  app.patch('/:id/pages/reorder', adminOnly, async (req) => {
    const { id } = idParam.parse(req.params);
    const { order } = reorderSchema.parse(req.body);
    const pages = await reorderPages(id, order);
    return { pages };
  });

  app.delete('/:id/pages/:pageId', adminOnly, async (req) => {
    const { id, pageId } = pageParams.parse(req.params);
    const pages = await deletePage(id, pageId);
    return { pages };
  });
}
