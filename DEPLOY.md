# Yayına Alma (Deploy) — Vercel + Render

Mimari:
```
Tarayıcı ──→ Vercel (Frontend, statik)
                │  /api/*  →  (vercel.json rewrite)
                ▼
            Render.com (Backend, Node API)  ──→  Supabase (DB + Storage)
```
`/api` istekleri Vercel tarafından Render'a yönlendirilir → tarayıcı her şeyi tek adreste görür, cookie/CORS sorunsuz.

---

## 0) Yeni GitHub repo'suna taşı (geçmişi koru)
1. GitHub'da **yeni boş** repo aç (README/.gitignore EKLEME).
2. Terminalde (bu repoda):
   ```bash
   git add -A
   git commit -m "Deploy hazırlığı: Vercel + Render config"
   git remote set-url origin https://github.com/KULLANICI/YENI-REPO.git
   git push -u origin main
   ```

---

## 1) Backend → Render.com
1. [render.com](https://render.com) → giriş → **New → Blueprint**.
2. Yeni repo'yu seç. Render kökteki **`render.yaml`**'i okur → `temas-foodsoft-backend` servisini kurar.
3. **Environment** sekmesinde `sync: false` olan değişkenleri gir:
   - `SUPABASE_URL` = `https://hswiipxezvfjmwfgaugh.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_...` (Supabase → Settings → API Keys → service_role)
   - `FRONTEND_ORIGIN` = *(Vercel adresini 3. adımda alınca gir, örn. `https://temas-foodsoft.vercel.app`)*
   - (JWT/COOKIE sırları otomatik üretilir — dokunma)
4. Deploy bitince Render sana bir adres verir: **`https://temas-foodsoft-backend.onrender.com`** — bunu kopyala.
5. Test: tarayıcıda `https://...onrender.com/api/health` → `{"status":"ok"}` görmelisin.

> Not: Render ücretsiz katmanda servis uzun süre kullanılmazsa uyur; ilk istek ~50 sn sürebilir (cold start). Eğitim uygulaması için sorun değil.

---

## 2) Frontend → Vercel
1. **`frontend/vercel.json`** içindeki adresi Render adresinle değiştir:
   ```json
   "destination": "https://temas-foodsoft-backend.onrender.com/api/$1"
   ```
   commit + push et.
2. [vercel.com](https://vercel.com) → **Add New → Project** → yeni repo'yu seç.
3. Ayarlar:
   - **Root Directory**: `frontend`  ← ÖNEMLİ (monorepo)
   - **Framework Preset**: `Vite` (otomatik algılanır)
   - Build/Output otomatik (`npm run build` / `dist`)
4. **Deploy**. Vercel sana adres verir: `https://....vercel.app`.

---

## 3) Bağla ve bitir
1. Render → Environment → `FRONTEND_ORIGIN` = Vercel adresin (örn. `https://temas-foodsoft.vercel.app`) → kaydet (otomatik yeniden deploy olur).
2. Vercel adresini aç → giriş `admin` / `1234` → **ilk iş şifreyi değiştir**.

## Güncelleme akışı
Bundan sonra repoya her `git push` → Vercel + Render **otomatik** yeniden deploy eder.

## Sorun giderme
- **Giriş olmuyor / 500**: Render env'lerini kontrol et (özellikle `SUPABASE_SERVICE_ROLE_KEY`).
- **/api 404**: `frontend/vercel.json`'daki Render adresi yanlış ya da Vercel Root Directory `frontend` değil.
- **CORS hatası**: Render'da `FRONTEND_ORIGIN` tam Vercel adresiyle eşleşmeli (sonunda `/` olmadan).
- **Migration**: Supabase tabloları zaten kurulu (lokalde yaptık). Yeni Supabase projesi kullanırsan `backend/migrations/000→004`'ü çalıştır.
