# News-Update

Bot rangkuman berita harian ke Telegram, jalan di **Cloudflare Workers** (cron 3x/hari: 06:00 / 12:00 / 18:00 WIB). Sumber campuran RSS media Indonesia (CNN Indonesia, Detik, Antara) + Google News, diringkas per kategori oleh **NVIDIA NIM**. Dedup lintas-hari via Workers KV.

## Setup

```bash
npm install
npx wrangler login
npx wrangler kv namespace create SEEN      # tempel id yang muncul ke wrangler.toml
npx wrangler secret put BOT_TOKEN
npx wrangler secret put CHAT_ID
npx wrangler secret put NVIDIA_API_KEY     # dari build.nvidia.com
npx wrangler secret put DASH_PASSWORD      # password dashboard web
npx wrangler deploy
```

## Dashboard

Buka URL worker (`https://news-update.<subdomain>.workers.dev/`) di browser →
login Basic Auth (username bebas, password = `DASH_PASSWORD`). Menampilkan
berita terakhir yang dikirim, riwayat 7 hari, status/jadwal, dan tombol
**Kirim sekarang**. Route `/` dan `/run` wajib auth; cron berjalan otomatis
tanpa auth.

## Konfigurasi

- **Jadwal:** `crons` di `wrangler.toml`.
- **Kategori & sumber:** `src/feeds.js`.
- **Model AI / jumlah item:** `[vars]` di `wrangler.toml` (`NIM_MODEL`, `PER_FEED`, `PER_CATEGORY`).

## Uji lokal

```bash
cp .dev.vars.example .dev.vars   # isi token asli
npx wrangler dev
curl http://localhost:8787/run   # kirim rangkuman sekarang
```

## Test

```bash
npm test
```

## Arsitektur

- `src/index.js` — handler `scheduled()`: fetch feed → dedup → ringkas AI → kirim Telegram.
- `src/feeds.js` — mapping 6 kategori → daftar URL feed.
- `src/lib.js` — fungsi murni (parse RSS, dedup, escape), diuji di `test/lib.test.js`.
