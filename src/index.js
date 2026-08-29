import { CATEGORIES } from "./feeds.js";
import { parseRss, dedup, escapeHtml, hashTitle, readCookie, tokenFor, cleanSummary } from "./lib.js";
import { renderDashboard } from "./dashboard.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const KV_TTL = 3 * 24 * 60 * 60; // 3 hari

async function fetchFeed(url, perFeed) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (NewsUpdate)" },
      signal: ctrl.signal,
    });
    if (!r.ok) return [];
    return parseRss(await r.text(), perFeed);
  } catch (e) {
    console.warn(`feed gagal ${url}: ${e}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCategory(cat, seen, perFeed, perCategory) {
  const results = await Promise.allSettled(cat.feeds.map((u) => fetchFeed(u, perFeed)));
  const all = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return dedup(all, seen).slice(0, perCategory);
}

async function summarize(env, heading, items) {
  const titles = items.map((it) => `- ${it.title}`).join("\n");
  const systemPrompt = `Kamu editor berita profesional Indonesia.
Tugas: Buat SATU paragraf rangkuman berita (2-3 kalimat lengkap) dalam Bahasa Indonesia berdasarkan daftar judul yang diberikan.

ATURAN KETAT:
1. LANGSUNG tulis teks rangkuman tanpa basa-basi, tanpa pengantar, tanpa pemikiran/reasoning, dan tanpa tanda kutip.
2. DILARANG KERAS menulis dalam bahasa Inggris atau membuat kalimat seperti "We need to...", "Let's craft...", "Here is...", "Rangkuman:".
3. Rangkai informasi dari judul-judul tersebut menjadi satu kesatuan paragraf yang mengalir secara alami dan to the point.
4. Netral, faktual, tanpa markdown, dan pastikan kalimat terakhir selesai dengan tanda titik (.).`;

  const userPrompt = `Kategori Berita: ${heading}\nDaftar Judul:\n${titles}\n\nInstruksi: Tulis langsung paragraf rangkuman bahasa Indonesia:`;

  const body = {
    model: env.NIM_MODEL || "meta/llama-3.3-70b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 500,
    temperature: 0.2,
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000); // 70B bisa cold-start lambat
  try {
    const r = await fetch(NIM_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.NVIDIA_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok) {
      console.warn(`NIM ${r.status}: ${await r.text()}`);
      return null;
    }
    const j = await r.json();
    const rawContent = j.choices?.[0]?.message?.content?.trim() || null;
    return cleanSummary(rawContent);
  } catch (e) {
    console.warn(`NIM gagal: ${e}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function renderCategory(heading, summary, items) {
  const links = items
    .map((it) => `• <a href="${escapeHtml(it.link)}">${escapeHtml(it.title)}</a>`)
    .join("\n");
  const intro = summary ? `<i>${escapeHtml(summary)}</i>\n\n` : "";
  return `<b>${heading}</b>\n${intro}${links}`;
}

// Telegram batas 4096 char; gabung blok kategori, pecah bila perlu.
async function sendTelegram(env, blocks) {
  const chunks = [];
  let cur = "";
  for (const b of blocks) {
    if (cur && cur.length + b.length + 2 > 3800) {
      chunks.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n\n${b}` : b;
  }
  if (cur) chunks.push(cur);

  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
  for (const text of chunks) {
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
        ok = r.ok;
        if (!ok) console.error(`Telegram ${r.status}: ${await r.text()}`);
      } catch (e) {
        console.error(`Telegram gagal: ${e}`);
      }
    }
  }
}

async function run(env, ctx) {
  const perFeed = Number(env.PER_FEED || 5);
  const perCategory = Number(env.PER_CATEGORY || 4);
  const seen = new Set();

  // muat hash judul yang sudah dikirim (window 3 hari) dari KV
  const seenHashes = new Set();
  const list = await env.SEEN.list({ prefix: "t:" });
  for (const k of list.keys) seenHashes.add(k.name.slice(2));

  const cats = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const items = (await fetchCategory(cat, seen, perFeed, perCategory)).filter(
        (it) => !seenHashes.has(hashTitle(it.title))
      );
      return { cat, items };
    })
  );

  const active = cats.filter(({ items }) => items.length > 0);
  if (active.length === 0) {
    console.log("Tidak ada berita baru.");
    return;
  }

  const summaries = await Promise.all(
    active.map(({ cat, items }) => summarize(env, cat.heading, items))
  );

  // digest terstruktur — dipakai Telegram + dashboard
  const ts = new Date().toISOString();
  const digest = {
    ts,
    count: active.reduce((n, { items }) => n + items.length, 0),
    categories: active.map(({ cat, items }, i) => ({
      heading: cat.heading,
      summary: summaries[i],
      items,
    })),
  };

  const today = new Date(Date.now() + WIB_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("-");
  const blocks = [`<b>Rangkuman Berita — ${today}</b>`];
  for (const c of digest.categories) blocks.push(renderCategory(c.heading, c.summary, c.items));

  await sendTelegram(env, blocks);

  // simpan ke KV: hash judul (dedup) + digest (dashboard, TTL 7 hari)
  ctx.waitUntil(
    Promise.all([
      env.SEEN.put(`d:${ts}`, JSON.stringify(digest), { expirationTtl: 7 * 24 * 60 * 60 }),
      ...digest.categories.flatMap(({ items }) =>
        items.map((it) => env.SEEN.put(`t:${hashTitle(it.title)}`, "1", { expirationTtl: KV_TTL }))
      ),
    ])
  );
  return digest;
}

async function loadDigests(env, limit) {
  const list = await env.SEEN.list({ prefix: "d:" });
  const keys = list.keys
    .map((k) => k.name)
    .sort()
    .reverse()
    .slice(0, limit);
  const vals = await Promise.all(keys.map((k) => env.SEEN.get(k)));
  return vals.filter(Boolean).map((v) => JSON.parse(v));
}

// Dashboard boleh dilihat siapa saja; hanya /run (kirim Telegram) butuh login.
// ponytail: perbandingan string biasa; risiko timing attack diabaikan utk tool pribadi.
async function authed(req, env) {
  if (!env.DASH_PASSWORD) return false;
  const tok = readCookie(req.headers.get("cookie"), "s");
  return !!tok && tok === (await tokenFor(env.DASH_PASSWORD));
}

const redirect = (to, cookie) =>
  new Response(null, {
    status: 302,
    headers: cookie ? { location: to, "set-cookie": cookie } : { location: to },
  });

export default {
  async scheduled(event, env, ctx) {
    await run(env, ctx);
  },
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const home = `${url.origin}/`;

    if (url.pathname === "/login" && req.method === "POST") {
      const pw = (await req.formData()).get("password") || "";
      if (!env.DASH_PASSWORD || pw !== env.DASH_PASSWORD) return redirect(`${home}?err=1`);
      const tok = await tokenFor(env.DASH_PASSWORD);
      return redirect(home, `s=${tok}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`);
    }

    if (url.pathname === "/logout") {
      return redirect(home, "s=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
    }

    const isAuthed = await authed(req, env);

    if (url.pathname === "/run") {
      if (!isAuthed) return redirect(`${home}?err=1`);
      await run(env, ctx);
      return redirect(`${home}?sent=1`);
    }

    const digests = await loadDigests(env, 7);
    const html = renderDashboard(digests, {
      selected: url.searchParams.get("d"),
      sent: url.searchParams.has("sent"),
      err: url.searchParams.has("err"),
      authed: isAuthed,
      crons: env.CRONS_LABEL || "06:00, 12:00, 18:00 WIB",
    });
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  },
};
