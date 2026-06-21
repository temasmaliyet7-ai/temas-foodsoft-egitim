import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  listUsers,
  createUser,
  updateUser,
  setUserActive,
  deleteUser,
} from './users.service.js';

const roleSchema = z.enum(['admin', 'user']);

const listQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: roleSchema.optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

const createSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(4),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  username: z.string().trim().min(1).optional(),
  password: z.string().min(4).optional().or(z.literal('')),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
});

const idParam = z.object({ id: z.string().uuid('Geçersiz kullanıcı kimliği') });

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  // Tüm kullanıcı yönetimi sadece admin
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireRole('admin'));

  app.get('/', async (req) => {
    const filter = listQuerySchema.parse(req.query);
    const users = await listUsers(filter);
    return { users };
  });

  app.post('/', async (req, reply) => {
    const body = createSchema.parse(req.body);
    const user = await createUser(body);
    return reply.status(201).send({ user });
  });

  app.patch('/:id', async (req) => {
    const { id } = idParam.parse(req.params);
    const body = updateSchema.parse(req.body);
    const user = await updateUser(id, { ...body, password: body.password || undefined });
    return { user };
  });

  app.patch('/:id/active', async (req) => {
    const { id } = idParam.parse(req.params);
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const user = await setUserActive(id, active);
    return { user };
  });

  app.delete('/:id', async (req, reply) => {
    const { id } = idParam.parse(req.params);
    await deleteUser(id);
    return reply.status(204).send();
  });
}
