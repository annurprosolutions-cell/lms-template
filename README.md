# LMS Template — Demo (Placeholder Branding)

Template LMS boleh-langgan (subscription) + beli-per-kursus, dibina dengan React +
Supabase + Bayarcash + Netlify. Kategori/kursus/video semuanya configurable dari
Admin Panel — tak payah sentuh code lepas setup awal siap.

## Apa yang dah siap

- Katalog kursus ikut kategori (kategori boleh tambah/edit sendiri dari Admin Panel)
- Halaman kursus dengan video (YouTube untuk free preview, Bunny Stream untuk paid)
- Login/Register (Supabase Auth)
- Dashboard pelajar — papar kursus dibeli & status langganan
- Admin Panel: urus kategori, kursus, video, notis laman web, & pengguna
- Checkout Bayarcash (per-kursus & subscription annual/lifetime) + webhook auto-grant akses

## Apa yang PERLU kau buat sebelum live

1. Setup akaun (Langkah 1-4 di bawah)
2. Test transaksi SANDBOX Bayarcash dulu sebelum production — checksum algorithm
   dalam code ni disalin terus dari source code PHP SDK rasmi Bayarcash, tapi
   response shape checkout URL & status code kejayaan (`status === '3'`) belum
   di-confirm dengan transaksi sebenar. Buat 1 transaksi sandbox, semak log
   Netlify Function, betulkan kalau field name lain dari jangkaan.
3. Tukar branding (logo, nama, warna) — semua placeholder buat masa ni
4. Isi kandungan sebenar (kategori, kursus, video) dari Admin Panel

---

## Langkah 1 — GitHub

1. Pergi ke https://github.com/signup, daftar guna annurprosolutions@gmail.com
   (skip kalau dah ada akaun)
2. Create new repository (butang hijau "New") — nama contoh `lms-template`
3. Upload semua fail dalam folder ni ke repo tu (drag & drop di GitHub web,
   atau guna `git push` kalau kau selesa command line)

## Langkah 2 — Supabase (database + auth + storage)

1. Pergi ke https://supabase.com, sign up guna annurprosolutions@gmail.com
2. Create new project — set nama & password database (simpan password ni)
3. Bila project siap provision, pergi **SQL Editor** → **New query**
4. Copy semua isi kandungan `supabase/schema.sql` (dalam folder ni), paste,
   klik **Run**. Ini akan buat semua table + security rules + data contoh.
5. Pergi **Project Settings → API** — salin:
   - `Project URL` → jadi `VITE_SUPABASE_URL` dan `SUPABASE_URL`
   - `anon public` key → jadi `VITE_SUPABASE_ANON_KEY`
   - `service_role` key (klik "Reveal") → jadi `SUPABASE_SERVICE_ROLE_KEY`
     (RAHSIA — jangan letak dalam frontend code, hanya dalam Netlify env vars)

### Jadikan diri kau admin

1. Daftar akaun biasa dulu di website kau (Register)
2. Dalam Supabase Dashboard → **Authentication → Users**, cari email kau,
   salin User UID
3. Balik ke **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where id = 'PASTE-UID-DI-SINI';
   ```
4. Log out & log in semula — menu "Admin Panel" akan muncul di navbar

## Langkah 3 — Bayarcash

Kau dah ada akaun BayarCash/BCL — pastikan:

1. Log in ke https://console.bayar.cash (production) atau
   https://console.bayarcash-sandbox.com (sandbox, untuk testing dulu)
2. Cari **Portal Key**, **API Token**, dan **API Secret Key** (biasanya di
   Settings / Developer / API bahagian console)
3. Masukkan nilai-nilai ni ke dalam Netlify environment variables (Langkah 4)
4. **Mula dengan `BAYARCASH_ENV=sandbox` dan test 1 transaksi penuh** sebelum
   tukar ke `production`

## Langkah 4 — Netlify (hosting + payment functions)

1. Pergi ke https://netlify.com, sign up guna annurprosolutions@gmail.com
2. **Add new site → Import from Git** → sambung ke GitHub repo yang kau buat
   di Langkah 1
3. Build settings (biasanya auto-detect dari `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Sebelum deploy, pergi **Site settings → Environment variables**, tambah
   SEMUA variable yang ada dalam `.env.example` (dengan nilai sebenar, bukan
   placeholder):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `BAYARCASH_API_TOKEN`, `BAYARCASH_API_SECRET_KEY`, `BAYARCASH_PORTAL_KEY`, `BAYARCASH_ENV`
   - `SITE_URL` → isi dengan URL Netlify kau, cth `https://your-site.netlify.app`
     (kemaskini balik lepas kau tahu URL sebenar, sebab Netlify generate nama
     random dulu — boleh tukar subdomain di Site settings → Domain management)
5. Klik **Deploy site**

Website kau akan live di `https://nama-random.netlify.app` — boleh test terus.
Domain custom (`.com`/`.my`) boleh disambung kemudian di Domain management bila
kau dah decide nama domain.

## Test secara local (optional, kalau nak run kat laptop dulu)

```bash
npm install
cp .env.example .env
# isi .env dengan nilai Supabase kau
npm run dev
```

Buka http://localhost:5173. (Fungsi Bayarcash checkout tak akan jalan local
melainkan guna `netlify dev` — untuk testing payment, lebih senang deploy ke
Netlify dulu dalam mode sandbox.)

## Struktur folder ringkas

```
src/
  pages/            → semua halaman awam & pelajar
  pages/admin/       → Admin Panel (kategori, kursus, video, notis, pengguna)
  components/         → Navbar, Footer, VideoPlayer, route guards
  context/AuthContext.jsx → status login + role semasa
  supabaseClient.js   → sambungan ke Supabase
netlify/functions/    → checkout & webhook Bayarcash (server-side, secret keys disini)
supabase/schema.sql    → seluruh struktur database — run sekali di Supabase SQL Editor
```

## Nota keputusan yang dah confirm

- Model harga: **subscription** (Annual RM99 / Lifetime RM399 — default, boleh
  ubah dari Admin Panel → tabung `subscription_plans`) + kursus individu boleh
  ada harga sendiri juga (hybrid, ikut apa kau set per-kursus)
- Payment gateway: **Bayarcash/BCL**
- Kategori: **fully configurable**, tiada hardcode
- Branding: **placeholder**, tukar bila logo/warna sedia
- Domain: guna `*.netlify.app` buat masa ni
