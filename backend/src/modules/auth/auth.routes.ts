import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env, isProd } from '../../config/env.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { unauthorized } from '../../lib/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { authenticate, getActiveUserById, type AuthUser } from './auth.service.js';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_PATH = '/api/auth';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Kullanıcı adı gerekli'),
  password: z.string().min(1, 'Şifre gerekli'),
});

function setRefreshCookie(reply: import('fastify').FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: REFRESH_PATH,
    signed: true,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

function issueTokens(reply: import('fastify').FastifyReply, user: AuthUser) {
  const accessToken = signAccessToken({ sub: user.id, username: user.username, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  setRefreshCookie(reply, refreshToken);
  return { accessToken, user };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Brute force'a karşı login'e sıkı rate limit
  app.post(
    '/login',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (req, reply) => {
      const { username, password } = loginSchema.parse(req.body);
      const user = await authenticate(username, password);
      return issueTokens(reply, user);
    },
  );

  // Refresh cookie ile yeni access token (+ rotation)
  app.post('/refresh', async (req, reply) => {
    const raw = req.cookies[REFRESH_COOKIE];
    if (!raw) throw unauthorized('Oturum bulunamadı.');
    const unsigned = req.unsignCookie(raw);
    if (!unsigned.valid || !unsigned.value) throw unauthorized('Oturum geçersiz.');

    let sub: string;
    try {
      sub = verifyRefreshToken(unsigned.value).sub;
    } catch {
      reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
      throw unauthorized('Oturum süresi doldu.');
    }
    const user = await getActiveUserById(sub);
    return issueTokens(reply, user);
  });

  app.post('/logout', async (_req, reply) => {
    reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
    return reply.status(204).send();
  });

  app.get('/me', { preHandler: requireAuth }, async (req) => {
    const u = req.user!;
    return { id: u.sub, username: u.username, role: u.role };
  });
}
