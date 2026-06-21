import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { ZodError } from 'zod';

import { env, isProd } from './config/env.js';
import { AppError } from './lib/errors.js';
import { MAX_FILE_BYTES } from './lib/storage.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { trainingsRoutes } from './modules/trainings/trainings.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isProd
      ? true
      : { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } },
    bodyLimit: 1 * 1024 * 1024, // 1 MB (JSON gövdeleri için; dosyalar multipart ile)
    trustProxy: isProd,
  });

  await app.register(helmet, {
    // Görseller cross-origin (Supabase Storage) yüklenebilsin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
  });

  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: '1 minute',
  });

  await app.register(multipart, {
    limits: {
      fileSize: MAX_FILE_BYTES,
      files: 50,
    },
  });

  // Sağlık kontrolü
  app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  // Merkezi hata yöneticisi — 500 iç detaylarını sızdırmaz.
  // NOT: route'lardan ÖNCE kaydedilmeli; aksi halde child context'ler
  // varsayılan handler'ı kopyalar ve bu çalışmaz.
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message, details: error.details });
    }
    // instanceof, modül kopyalarında bozulabilir → name + issues ile de yakala.
    const zodIssues =
      error instanceof ZodError
        ? error.issues
        : (error as { name?: string; issues?: ZodError['issues'] }).name === 'ZodError'
          ? (error as { issues: ZodError['issues'] }).issues
          : null;
    if (zodIssues) {
      return reply.status(400).send({
        error: 'Geçersiz istek.',
        details: zodIssues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    // Fastify'in kendi hataları (rate limit, multipart limit, vb.)
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode && err.statusCode < 500) {
      return reply.status(err.statusCode).send({ error: err.message ?? 'İstek reddedildi.' });
    }
    req.log.error(error);
    return reply.status(500).send({ error: 'Sunucu hatası. Lütfen tekrar deneyin.' });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ error: 'Kaynak bulunamadı.' });
  });

  // Modüller (hata yöneticisi kaydedildikten SONRA)
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(usersRoutes, { prefix: '/api/users' });
  await app.register(trainingsRoutes, { prefix: '/api/trainings' });

  return app;
}
