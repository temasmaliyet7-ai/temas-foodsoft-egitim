import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL geçerli bir URL olmalı'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY zorunlu'),
  SUPABASE_STORAGE_BUCKET: z.string().default('training-pages'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET en az 16 karakter olmalı'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET en az 16 karakter olmalı'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET en az 16 karakter olmalı'),

  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // Boot'ta hızlı başarısız ol — eksik/yanlış ayarla devam etme.
  console.error('\n❌ Ortam değişkenleri hatalı. backend/.env dosyasını kontrol et:\n' + issues + '\n');
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
