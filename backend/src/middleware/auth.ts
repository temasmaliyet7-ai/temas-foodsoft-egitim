import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyAccessToken, type AppRole } from '../lib/jwt.js';
import { unauthorized, forbidden } from '../lib/errors.js';

// Bearer access token doğrular ve req.user'a yazar.
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw unauthorized('Oturum gerekli.');
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw unauthorized('Oturum süresi doldu veya geçersiz.');
  }
}

// Belirli bir rol şart koşar. requireAuth'tan SONRA çalışmalı.
export function requireRole(role: AppRole) {
  return async function (req: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!req.user) throw unauthorized('Oturum gerekli.');
    if (req.user.role !== role) throw forbidden();
  };
}
