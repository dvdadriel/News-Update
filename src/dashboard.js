import { escapeHtml } from "./lib.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function fmtWIB(iso) {
  const d = new Date(new Date(iso).getTime() + WIB_OFFSET_MS);
  const s = d.toISOString(); // YYYY-MM-DDTHH:MM
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)} WIB`;
}

function renderDigest(dg) {
  if (!dg) return `<p class="empty">Belum ada berita tersimpan. Klik "Kirim sekarang".</p>`;
  const cats = dg.categories
    .map((c) => {
      const links = c.items
        .map(
          (it) =>
            `<li><a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(
              it.title
            )}</a></li>`
        )
        .join("");
      const summary = c.summary ? `<p class="sum">${escapeHtml(c.summary)}</p>` : "";
      return `<section class="cat"><h3>${escapeHtml(c.heading)}</h3>${summary}<ul>${links}</ul></section>`;
    })
    .join("");
  return `<p class="meta">Dikirim ${fmtWIB(dg.ts)} · ${dg.count} berita</p>${cats}`;
}

export function renderDashboard(digests, opts = {}) {
  const selected = opts.selected
    ? digests.find((d) => d.ts === opts.selected)
    : digests[0];
  const latest = digests[0];

  const history = digests
    .map((d) => {
      const active = d.ts === (selected?.ts || "");
      return `<li${active ? ' class="on"' : ""}><a href="/?d=${encodeURIComponent(d.ts)}">${fmtWIB(
        d.ts
      )} <span>${d.count}</span></a></li>`;
    })
    .join("");

  const sentBanner = opts.sent ? `<div class="banner">✅ Broadcast terkirim.</div>` : "";
  const lastRun = latest ? fmtWIB(latest.ts) : "—";

  return `<!doctype html>
<html lang="id"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>News-Update Dashboard</title>
<style>
  :root { color-scheme: light dark; --bg:#0f1115; --card:#181b22; --fg:#e6e8eb; --mut:#9aa4b2; --acc:#4f9dff; --line:#262b34; }
  @media (prefers-color-scheme: light) { :root { --bg:#f5f6f8; --card:#fff; --fg:#1a1d22; --mut:#5c6470; --acc:#1a73e8; --line:#e3e6ea; } }
  * { box-sizing: border-box; }
  body { margin:0; font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--fg); }
  header { padding:16px 20px; border-bottom:1px solid var(--line); display:flex; flex-wrap:wrap; gap:12px 20px; align-items:center; }
  header h1 { font-size:17px; margin:0; margin-right:auto; }
  header .stat { color:var(--mut); font-size:13px; }
  header .stat b { color:var(--fg); }
  form { margin:0; }
  button { background:var(--acc); color:#fff; border:0; padding:8px 14px; border-radius:8px; font:inherit; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; cursor:progress; }
  .banner { background:#1e7f4d22; color:#2ec27e; padding:10px 20px; font-size:14px; border-bottom:1px solid var(--line); }
  .wrap { display:flex; gap:20px; padding:20px; max-width:1100px; margin:0 auto; align-items:flex-start; }
  aside { flex:0 0 220px; }
  aside h2 { font-size:12px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); margin:0 0 8px; }
  aside ul { list-style:none; margin:0; padding:0; }
  aside li a { display:flex; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:8px; color:var(--fg); text-decoration:none; font-size:13px; }
  aside li a span { color:var(--mut); }
  aside li a:hover { background:var(--card); }
  aside li.on a { background:var(--card); font-weight:600; }
  main { flex:1; min-width:0; }
  .meta { color:var(--mut); font-size:13px; margin:0 0 16px; }
  .cat { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; margin-bottom:14px; }
  .cat h3 { margin:0 0 6px; font-size:15px; }
  .cat .sum { margin:0 0 10px; color:var(--mut); font-style:italic; }
  .cat ul { margin:0; padding-left:18px; }
  .cat li { margin:4px 0; }
  .cat a { color:var(--acc); text-decoration:none; }
  .cat a:hover { text-decoration:underline; }
  .empty { color:var(--mut); }
  @media (max-width:720px) { .wrap { flex-direction:column; } aside { flex:none; width:100%; } }
</style></head>
<body>
<header>
  <h1>📰 News-Update</h1>
  <span class="stat">Run terakhir: <b>${lastRun}</b></span>
  <span class="stat">Jadwal: <b>${escapeHtml(opts.crons || "")}</b></span>
  <form method="POST" action="/run" onsubmit="this.querySelector('button').disabled=true;this.querySelector('button').textContent='Mengirim… (±40s)';">
    <button type="submit">Kirim sekarang</button>
  </form>
</header>
${sentBanner}
<div class="wrap">
  <aside>
    <h2>Riwayat</h2>
    <ul>${history || '<li class="empty">—</li>'}</ul>
  </aside>
  <main>${renderDigest(selected)}</main>
</div>
</body></html>`;
}
