# Temaş Foodsoft Eğitim Programı

Eğitim sunumlarını (PNG sayfaları) görüntüleyen, rol bazlı erişimli modern web uygulaması.
Eski tek-dosya HTML uygulaması; **React + Node.js + TypeScript + Tailwind + Supabase** monorepo'suna dönüştürülmüştür.

## Mimari

```
temas-foodsoft-egitim/
├── backend/          Node.js + TypeScript + Fastify API (Supabase'in önünde güvenli katman)
│   ├── migrations/   Supabase SQL (sıralı çalıştır: 000 → 004)
│   ├── scripts/      seed-trainings.ts (mevcut 3 eğitimi DB+Storage'a taşır)
│   └── src/          config, lib, middleware, modules (auth/users/trainings)
├── frontend/         Vite + React + TypeScript + Tailwind (tek uygulama, role göre modül)
├── assets/           Logolar (frontend/public/assets'e kopyalanmıştır)
├── trainings/        Orijinal eğitim PNG'leri (seed kaynağı)
└── legacy/           Eski index.html / admin.html (arşiv)
```

### Neden bu mimari?
- **Service role anahtarı yalnızca sunucuda** (`.env`). Tarayıcıya asla gitmez — eski sistemdeki "anahtarı localStorage'a yaz" açığı kapandı.
- **JWT oturum**: giriş bir kez yapılır; access token (15 dk) + httpOnly refresh cookie (7 gün). Eski sistemdeki "her admin isteğinde şifreyi tekrar gönder" açığı kapandı.
- **RLS kilidi**: anon/authenticated rollerinin DB'ye doğrudan erişimi yok; her şey backend üzerinden.
- **Eğitimler veritabanında**: admin panelinden PNG yükleyerek yeni sunum oluşturulabilir.

## Roller
- **Kullanıcı**: yalnızca eğitimleri görür ve görüntüler (swipe / tam ekran / klavye).
- **Admin**: ek olarak **Kullanıcı Yönetimi** ve **Eğitim Yönetimi** (PNG yükleme, sıralama, silme).

---

## Kurulum

### 1) Bağımlılıklar
```bash
npm install          # kökten — backend ve frontend birlikte kurulur
```

### 2) Supabase
1. [supabase.com](https://supabase.com) üzerinde proje oluştur (veya mevcut projeni kullan).
2. **SQL Editor**'da `backend/migrations/` dosyalarını **sırayla** çalıştır:
   - `000_app_users.sql` — kullanıcı tablosu + ilk admin (`admin` / `1234`). *(app_users zaten varsa atla.)*
   - `001_trainings_schema.sql` — eğitim tabloları
   - `002_auth_rpcs.sql` — giriş & şifre RPC'leri
   - `003_rls_lockdown.sql` — güvenlik (RLS)
   - `004_storage.sql` — `training-pages` bucket'ı
3. **Project Settings → API**'den `Project URL` ve `service_role` anahtarını al.

### 3) Backend .env
```bash
cd backend
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```
`.env` içine `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ve güçlü JWT/cookie sırlarını gir.
Sır üretmek için:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4) Mevcut eğitimleri taşı (opsiyonel ama önerilir)
```bash
npm run seed         # kökten — 3 eğitimi + PNG'leri Storage+DB'ye yükler (idempotent)
```

### 5) Geliştirme
```bash
npm run dev          # backend (:4000) + frontend (:5173) birlikte
```
Tarayıcı: **http://localhost:5173** · İlk giriş: `admin` / `1234` (sonra değiştir).

---

## Komutlar (kökten)
| Komut | Açıklama |
|---|---|
| `npm run dev` | Backend + frontend birlikte (geliştirme) |
| `npm run build` | İkisini de derle |
| `npm run seed` | Mevcut eğitimleri Supabase'e taşı |
| `npm start` | Derlenmiş backend'i çalıştır |

## API (özet)
| Yöntem | Yol | Erişim |
|---|---|---|
| POST | `/api/auth/login` | herkes |
| POST | `/api/auth/refresh` · `/logout` | cookie |
| GET | `/api/auth/me` | oturum |
| GET/POST/PATCH/DELETE | `/api/users…` | admin |
| GET | `/api/trainings`, `/api/trainings/:id` | oturum |
| POST/PATCH/DELETE | `/api/trainings…`, `…/pages…` | admin |

## Güvenlik notları
- `.env` **asla** commit edilmez (`.gitignore`'da).
- Üretimde HTTPS kullan; cookie `Secure` otomatik açılır (`NODE_ENV=production`).
- Login `15 dakikada 10 deneme` ile sınırlandırılmıştır (brute-force koruması).
- PNG yüklemede MIME + magic-byte + boyut (≤10MB) doğrulaması yapılır.

## Üretim dağıtımı (kısa)
- Backend: `npm run build:backend` → `npm start` (env değişkenleriyle). `NODE_ENV=production`, `FRONTEND_ORIGIN`'i gerçek alan adına ayarla.
- Frontend: `npm run build:frontend` → `frontend/dist` statik olarak servis edilir; `/api`'yi backend'e yönlendir (reverse proxy) veya `VITE` proxy yerine tam URL kullan.
