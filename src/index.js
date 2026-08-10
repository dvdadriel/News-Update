import { CATEGORIES } from "./feeds.js";
import { parseRss, dedup, escapeHtml, hashTitle } from "./lib.js";

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
  const body = {
    model: env.NIM_MODEL || "meta/llama-3.3-70b-instruct",
    messages: [
      {
        role: "system",
        content:
          "Kamu editor berita Indonesia. Rangkum daftar judul berita menjadi SATU paragraf ringkas Bahasa Indonesia (2-3 kalimat), netral, tanpa markdown, tanpa menambah fakta di luar judul.",
      },
      { role: "user", content: `Kategori: ${heading}\nJudul:\n${titles}` },
    ],
    max_tokens: 220,
    temperature: 0.3,
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
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
    return j.choices?.[0]?.message?.content?.trim() || null;
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

  const today = new Date(Date.now() + WIB_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
    .split("-")
    .reverse()
    .join("-");
  const blocks = [`<b>Rangkuman Berita — ${today}</b>`];
  for (const { cat, items } of active) {
    const summary = await summarize(env, cat.heading, items);
    blocks.push(renderCategory(cat.heading, summary, items));
  }

  await sendTelegram(env, blocks);

  // simpan hash judul baru ke KV
  ctx.waitUntil(
    Promise.all(
      active.flatMap(({ items }) =>
        items.map((it) =>
          env.SEEN.put(`t:${hashTitle(it.title)}`, "1", { expirationTtl: KV_TTL })
        )
      )
    )
  );
}

export default {
  async scheduled(event, env, ctx) {
    await run(env, ctx);
  },
  // trigger manual via GET saat wrangler dev / debugging
  async fetch(req, env, ctx) {
    if (new URL(req.url).pathname === "/run") {
      await run(env, ctx);
      return new Response("sent");
    }
    return new Response("News-Update worker. Cron menjadwalkan; GET /run untuk uji manual.");
  },
};
