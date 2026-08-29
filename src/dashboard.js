import { escapeHtml } from "./lib.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function fmtWIB(iso) {
  if (!iso) return "—";
  const d = new Date(new Date(iso).getTime() + WIB_OFFSET_MS);
  const s = d.toISOString(); // YYYY-MM-DDTHH:MM
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 16)} WIB`;
}

function fmtShortWIB(iso) {
  if (!iso) return "—";
  const s = new Date(new Date(iso).getTime() + WIB_OFFSET_MS).toISOString();
  return `${s.slice(8, 10)}/${s.slice(5, 7)} · ${s.slice(11, 16)}`;
}

function scheduleHours(label) {
  const hours = [...(label || "").matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => Number(m[1]));
  return hours.length ? hours : [6, 12, 18];
}

const CAT_THEMES = {
  "🌍 Berita Internasional": {
    slug: "internasional",
    short: "Internasional",
    color: "#2563eb",
    bgGrad: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    icon: "🌍",
  },
  "🇮🇩 Nasional & Politik": {
    slug: "nasional",
    short: "Nasional",
    color: "#e11d48",
    bgGrad: "linear-gradient(135deg, #9f1239 0%, #f43f5e 100%)",
    icon: "🇮🇩",
  },
  "📈 Ekonomi & Pasar Modal": {
    slug: "ekonomi",
    short: "Ekonomi",
    color: "#059669",
    bgGrad: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
    icon: "📈",
  },
  "🏢 Bisnis & Industri": {
    slug: "bisnis",
    short: "Bisnis",
    color: "#d97706",
    bgGrad: "linear-gradient(135deg, #92400e 0%, #f59e0b 100%)",
    icon: "🏢",
  },
  "💻 Teknologi": {
    slug: "teknologi",
    short: "Teknologi",
    color: "#7c3aed",
    bgGrad: "linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)",
    icon: "💻",
  },
  "🏙️ Jakarta & Sekitarnya": {
    slug: "jakarta",
    short: "Jakarta",
    color: "#0891b2",
    bgGrad: "linear-gradient(135deg, #155e75 0%, #06b6d4 100%)",
    icon: "🏙️",
  },
};

function getCatTheme(heading) {
  if (CAT_THEMES[heading]) return CAT_THEMES[heading];
  for (const [k, v] of Object.entries(CAT_THEMES)) {
    if (heading.toLowerCase().includes(v.short.toLowerCase())) return v;
  }
  return {
    slug: "umum",
    short: heading.replace(/[^\w\s]/gi, "").trim() || "Berita",
    color: "#4f46e5",
    bgGrad: "linear-gradient(135deg, #3730a3 0%, #6366f1 100%)",
    icon: "📰",
  };
}

function estimateReadTime(title, snippet) {
  const words = `${title} ${snippet || ""}`.split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 45));
  return `${mins} mnt baca`;
}

function renderNewsCard(it, theme, catHeading, isSpotlight = false) {
  const titleEsc = escapeHtml(it.title);
  const linkEsc = escapeHtml(it.link);
  const sourceEsc = escapeHtml(it.source || theme.short);
  const snippetEsc = it.snippet ? escapeHtml(it.snippet) : "";
  const readTime = estimateReadTime(it.title, it.snippet);
  const hasImage = Boolean(it.image);
  const imgEsc = it.image ? escapeHtml(it.image) : "";

  const imageHtml = hasImage
    ? `<div class="card-media has-img">
        <img src="${imgEsc}" alt="${titleEsc}" loading="lazy" onerror="this.closest('.card-media').classList.remove('has-img'); this.closest('.card-media').classList.add('no-img'); this.remove();">
        <span class="media-badge" style="background:${theme.color}">${theme.icon} ${escapeHtml(theme.short)}</span>
      </div>`
    : `<div class="card-media no-img" style="background:${theme.bgGrad}">
        <div class="pattern-mesh"></div>
        <div class="media-fallback-art">
          <svg class="news-art-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
          </svg>
        </div>
        <span class="media-badge" style="background:rgba(0,0,0,0.5); backdrop-filter:blur(6px);">${theme.icon} ${escapeHtml(theme.short)}</span>
      </div>`;

  if (isSpotlight) {
    return `
    <article class="spotlight-card" data-cat="${theme.slug}" data-url="${linkEsc}">
      <div class="spotlight-media-wrap">
        ${imageHtml}
        <div class="spotlight-ribbon">🔥 SOROTAN UTAMA</div>
      </div>
      <div class="spotlight-body">
        <div class="card-meta-top">
          <span class="pill-source">${sourceEsc}</span>
          <span class="pill-dot">·</span>
          <span class="pill-time">⏱️ ${readTime}</span>
        </div>
        <h2 class="spotlight-title">
          <a href="${linkEsc}" target="_blank" rel="noopener" class="news-link">${titleEsc}</a>
        </h2>
        ${snippetEsc ? `<p class="spotlight-snippet">${snippetEsc}</p>` : ""}
        <div class="card-footer">
          <a href="${linkEsc}" target="_blank" rel="noopener" class="read-btn">
            Baca Berita Lengkap
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <div class="card-actions">
            <button class="act-btn bookmark-btn" title="Simpan artikel" data-url="${linkEsc}" data-title="${titleEsc}" data-source="${sourceEsc}" data-cat="${escapeHtml(catHeading)}" data-img="${imgEsc}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="act-btn share-btn" title="Bagikan link" data-url="${linkEsc}" data-title="${titleEsc}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
        </div>
      </div>
    </article>`;
  }

  return `
  <article class="news-card" data-cat="${theme.slug}" data-url="${linkEsc}">
    <div class="card-thumb-wrap">
      ${imageHtml}
    </div>
    <div class="card-body">
      <div class="card-meta-top">
        <span class="pill-source">${sourceEsc}</span>
        <span class="pill-dot">·</span>
        <span class="pill-time">⏱️ ${readTime}</span>
      </div>
      <h3 class="card-title">
        <a href="${linkEsc}" target="_blank" rel="noopener" class="news-link">${titleEsc}</a>
      </h3>
      ${snippetEsc ? `<p class="card-snippet">${snippetEsc}</p>` : ""}
      <div class="card-footer">
        <a href="${linkEsc}" target="_blank" rel="noopener" class="card-link-more">
          Buka
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
        </a>
        <div class="card-actions">
          <button class="act-btn bookmark-btn" title="Simpan artikel" data-url="${linkEsc}" data-title="${titleEsc}" data-source="${sourceEsc}" data-cat="${escapeHtml(catHeading)}" data-img="${imgEsc}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button class="act-btn share-btn" title="Bagikan link" data-url="${linkEsc}" data-title="${titleEsc}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>
      </div>
    </div>
  </article>`;
}

function renderDigest(dg) {
  if (!dg) {
    return `<div class="empty-state">
      <div class="empty-icon">📡</div>
      <h2>Belum ada transmisi tersimpan</h2>
      <p>Riwayat digest akan terisi otomatis setiap kali cron berita berjalan. Silakan login di atas dan klik <b>"Kirim sekarang"</b> untuk menjalankan agregasi pertama kali.</p>
    </div>`;
  }

  // Cari spotlight item (item pertama yang memiliki gambar, atau fallback ke item pertama kategori pertama)
  let spotlightItem = null;
  let spotlightCat = null;

  for (const c of dg.categories) {
    const itemWithImg = c.items.find((it) => Boolean(it.image));
    if (itemWithImg) {
      spotlightItem = itemWithImg;
      spotlightCat = c;
      break;
    }
  }

  if (!spotlightItem && dg.categories[0]?.items[0]) {
    spotlightItem = dg.categories[0].items[0];
    spotlightCat = dg.categories[0];
  }

  const spotlightTheme = spotlightCat ? getCatTheme(spotlightCat.heading) : null;
  const spotlightHtml = spotlightItem && spotlightTheme
    ? renderNewsCard(spotlightItem, spotlightTheme, spotlightCat.heading, true)
    : "";

  const sections = dg.categories
    .map((c) => {
      const theme = getCatTheme(c.heading);
      const cardsHtml = c.items
        .map((it) => renderNewsCard(it, theme, c.heading, false))
        .join("");

      const summaryHtml = c.summary
        ? `<div class="ai-summary-box">
            <div class="ai-summary-header">
              <div class="ai-summary-tag">
                <span class="ai-spark">✨</span>
                <span>Rangkuman Kilat AI</span>
              </div>
              <button class="tts-play-btn" data-text="${escapeHtml(c.summary)}" title="Dengarkan rangkuman kategori ini">
                <span class="tts-icon">🔊</span>
                <span class="tts-label">Dengarkan</span>
              </button>
            </div>
            <p class="ai-summary-text">${escapeHtml(c.summary)}</p>
          </div>`
        : "";

      return `
      <section class="cat-section" data-cat="${theme.slug}" id="sec-${theme.slug}">
        <div class="cat-section-header">
          <div class="cat-title-group">
            <span class="cat-icon-badge" style="background:${theme.bgGrad}">${theme.icon}</span>
            <h2 class="cat-heading">${escapeHtml(c.heading)}</h2>
          </div>
          <span class="cat-count-badge">${c.items.length} berita</span>
        </div>
        ${summaryHtml}
        <div class="news-grid">
          ${cardsHtml}
        </div>
      </section>`;
    })
    .join("");

  return `
    <div class="digest-container">
      <div class="digest-hero-banner">
        <div class="digest-meta-row">
          <div class="meta-item">
            <span class="meta-label">Total Berita</span>
            <span class="meta-val num">${dg.count}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Kategori</span>
            <span class="meta-val">${dg.categories.length} Topik</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Waktu Transmisi</span>
            <span class="meta-val">${fmtWIB(dg.ts)}</span>
          </div>
        </div>
      </div>

      ${spotlightHtml ? `<div class="spotlight-wrapper">${spotlightHtml}</div>` : ""}

      <div class="categories-wrapper">
        ${sections}
      </div>

      <div id="saved-section" class="cat-section" style="display:none;">
        <div class="cat-section-header">
          <div class="cat-title-group">
            <span class="cat-icon-badge" style="background:linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)">⭐</span>
            <h2 class="cat-heading">Artikel Tersimpan (Bookmarks)</h2>
          </div>
          <span class="cat-count-badge" id="saved-count-badge">0 berita</span>
        </div>
        <div class="news-grid" id="saved-news-grid">
          <!-- Diisi via JavaScript -->
        </div>
      </div>
    </div>`;
}

export function renderDashboard(digests, opts = {}) {
  const selected = opts.selected ? digests.find((d) => d.ts === opts.selected) : digests[0];
  const latest = digests[0];
  const cronLabel = opts.crons || "06:00, 12:00, 18:00 WIB";
  const hours = scheduleHours(cronLabel).sort((a, b) => a - b);

  const peak = Math.max(1, ...digests.map((d) => d.count));
  const history = digests
    .map((d) => {
      const on = d.ts === (selected?.ts || "");
      const w = Math.round((d.count / peak) * 100);
      return `<li${on ? ' class="on"' : ""}>
        <a href="/?d=${encodeURIComponent(d.ts)}">
          <div class="hist-info">
            <span class="when">${fmtShortWIB(d.ts)}</span>
            <span class="num">${d.count} berita</span>
          </div>
          <span class="bar"><i style="width:${w}%"></i></span>
        </a></li>`;
    })
    .join("");

  const banner = opts.sent
    ? `<div class="banner ok">
        <span class="banner-icon">✓</span>
        <span>Rangkuman berita berhasil dikirimkan ke channel Telegram!</span>
       </div>`
    : opts.err
      ? `<div class="banner err">
          <span class="banner-icon">⚠️</span>
          <span>Password salah atau sesi login telah berakhir. Silakan login kembali.</span>
         </div>`
      : "";

  const actions = opts.authed
    ? `<div class="admin-bar">
         <form method="POST" action="/run" onsubmit="this.querySelector('button').disabled=true;this.querySelector('button').innerHTML='<span class=\\'spin\\'>⟳</span> Mengirim…';">
           <button class="send-btn" type="submit">
             <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
             Kirim sekarang
           </button>
         </form>
         <a class="ghost-btn" href="/logout" title="Logout admin">Keluar</a>
       </div>`
    : `<form method="POST" action="/login" class="login-form">
         <input type="password" name="password" placeholder="Password admin…" aria-label="Password admin" autocomplete="current-password" required>
         <button type="submit" class="login-btn">Login</button>
       </form>`;

  const ticks = hours
    .map(
      (h) =>
        `<span class="tick" style="left:${((h / 24) * 100).toFixed(3)}%"><b></b><em>${String(h).padStart(2, "0")}:00</em></span>`
    )
    .join("");

  return `<!doctype html>
<html lang="id" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>News·Update — Editorial News Dashboard</title>
<meta name="description" content="Dashboard agregasi berita Indonesia pintar dengan visual modern, rangkuman AI, audio pembaca berita, dan transmisi otomatis ke Telegram.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,600;12..96,75..100,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: light dark;
    --paper: #f4f6fb;
    --card: #ffffff;
    --card-hover: #ffffff;
    --ink: #0f172a;
    --ink-sub: #334155;
    --mut: #64748b;
    --line: #e2e8f0;
    --line-subtle: #edf2f7;
    --acc: #e11d48;
    --acc-soft: rgba(225, 29, 72, 0.08);
    --ok: #059669;
    --ok-soft: rgba(5, 150, 105, 0.1);
    --rail: #cbd5e1;
    --rail-active: #e11d48;
    --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
    --head: "Bricolage Grotesque", "Plus Jakarta Sans", sans-serif;
    --body: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
    --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
    --shadow-md: 0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
    --shadow-lg: 0 16px 36px -6px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06);
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-full: 999px;
  }

  [data-theme="dark"] {
    --paper: #090d16;
    --card: #121826;
    --card-hover: #172033;
    --ink: #f8fafc;
    --ink-sub: #cbd5e1;
    --mut: #94a3b8;
    --line: #1e293b;
    --line-subtle: #162032;
    --acc: #f43f5e;
    --acc-soft: rgba(244, 63, 94, 0.14);
    --ok: #10b981;
    --ok-soft: rgba(16, 185, 129, 0.14);
    --rail: #26334a;
    --rail-active: #f43f5e;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 8px 24px -4px rgba(0, 0, 0, 0.45);
    --shadow-lg: 0 16px 36px -6px rgba(0, 0, 0, 0.6);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--paper);
    color: var(--ink);
    font: 400 15px/1.65 var(--body);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    transition: background 0.25s ease, color 0.25s ease;
  }

  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; }
  .num { font-family: var(--mono); font-variant-numeric: tabular-nums; }

  /* Reading Progress Bar */
  #reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #e11d48, #f59e0b, #10b981, #3b82f6);
    z-index: 1000;
    width: 0%;
    transition: width 0.1s linear;
  }

  /* Top Navigation */
  header.top {
    position: sticky;
    top: 0;
    z-index: 900;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 28px;
    background: var(--card);
    border-bottom: 1px solid var(--line);
    box-shadow: var(--shadow-sm);
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .brand {
    font-family: var(--head);
    font-weight: 800;
    font-size: 22px;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .brand .dot { color: var(--acc); }
  .brand .badge {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--acc-soft);
    color: var(--acc);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    margin-left: 6px;
  }

  .live-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mut);
    background: var(--paper);
    padding: 5px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line);
  }
  .live-status i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ok);
    box-shadow: 0 0 8px var(--ok);
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.85); } }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .theme-toggle-btn {
    background: var(--paper);
    border: 1px solid var(--line);
    color: var(--ink);
    padding: 8px 12px;
    border-radius: var(--radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .theme-toggle-btn:hover { background: var(--card-hover); border-color: var(--mut); }

  .admin-bar {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .send-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 13px;
    background: var(--acc);
    color: #fff;
    border: none;
    padding: 9px 18px;
    border-radius: var(--radius-full);
    cursor: pointer;
    box-shadow: 0 4px 12px var(--acc-soft);
    transition: transform 0.15s ease, opacity 0.2s ease;
  }
  .send-btn:hover { transform: translateY(-1px); opacity: 0.95; }
  .send-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .ghost-btn {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--mut);
    padding: 6px 12px;
    border-radius: var(--radius-full);
    transition: color 0.15s ease;
  }
  .ghost-btn:hover { color: var(--acc); }

  .login-form {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .login-form input {
    font-family: inherit;
    font-size: 13px;
    width: 170px;
    padding: 8px 14px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s;
  }
  .login-form input:focus { border-color: var(--acc); }
  .login-btn {
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--paper);
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .login-btn:hover { opacity: 0.9; }

  /* 24-Hour Transmission Rail */
  .strip {
    background: var(--card);
    border-bottom: 1px solid var(--line);
    padding: 16px 28px 24px;
  }
  .strip .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }
  .strip h2 {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mut);
  }
  .strip .next-timer {
    font-family: var(--head);
    font-weight: 600;
    font-size: 14px;
  }
  .strip .next-timer b {
    font-family: var(--mono);
    font-weight: 700;
    color: var(--acc);
    background: var(--acc-soft);
    padding: 3px 8px;
    border-radius: 6px;
    margin-left: 4px;
  }
  .rail {
    position: relative;
    height: 3px;
    background: var(--rail);
    border-radius: var(--radius-full);
    margin: 10px 0;
  }
  .tick {
    position: absolute;
    top: -4px;
    transform: translateX(-50%);
    text-align: center;
  }
  .tick b {
    display: block;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--card);
    border: 2px solid var(--rail);
    transition: all 0.3s;
  }
  .tick.done b {
    background: var(--acc);
    border-color: var(--acc);
    box-shadow: 0 0 6px var(--acc);
  }
  .tick em {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--mono);
    font-style: normal;
    font-size: 11px;
    font-weight: 500;
    color: var(--mut);
  }
  .now-needle {
    position: absolute;
    top: -9px;
    width: 3px;
    height: 21px;
    background: var(--acc);
    transform: translateX(-50%);
    border-radius: var(--radius-full);
    box-shadow: 0 0 10px var(--acc);
  }
  .now-needle::after {
    content: attr(data-t);
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--acc);
    background: var(--paper);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid var(--line);
    white-space: nowrap;
  }

  /* Banner Alerts */
  .banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 28px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid var(--line);
  }
  .banner.ok { color: var(--ok); background: var(--ok-soft); }
  .banner.err { color: var(--acc); background: var(--acc-soft); }
  .banner-icon { font-size: 16px; font-weight: 700; }

  /* Control / Filter Bar */
  .control-bar-wrapper {
    background: var(--card);
    border-bottom: 1px solid var(--line);
    padding: 12px 28px;
    position: sticky;
    top: 61px;
    z-index: 800;
    box-shadow: var(--shadow-sm);
  }
  .control-bar {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .filter-pills {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }
  .filter-pills::-webkit-scrollbar { display: none; }

  .filter-btn {
    background: var(--paper);
    color: var(--ink-sub);
    border: 1px solid var(--line);
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  }
  .filter-btn:hover {
    background: var(--line-subtle);
    color: var(--ink);
  }
  .filter-btn.active {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }

  .view-and-search {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-box svg {
    position: absolute;
    left: 12px;
    color: var(--mut);
    pointer-events: none;
  }
  .search-box input {
    font-family: inherit;
    font-size: 13px;
    padding: 7px 14px 7px 34px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    width: 210px;
    outline: none;
    transition: width 0.2s ease, border-color 0.2s ease;
  }
  .search-box input:focus {
    width: 260px;
    border-color: var(--acc);
  }

  .view-toggle-group {
    display: flex;
    align-items: center;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--radius-full);
    padding: 3px;
    gap: 2px;
  }
  .view-toggle-btn {
    background: transparent;
    border: none;
    color: var(--mut);
    padding: 5px 9px;
    border-radius: var(--radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .view-toggle-btn.active {
    background: var(--card);
    color: var(--ink);
    box-shadow: var(--shadow-sm);
  }

  /* Main Layout */
  .layout-wrap {
    display: flex;
    gap: 32px;
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 24px 80px;
    align-items: flex-start;
  }

  /* Sidebar History */
  aside.history-sidebar {
    flex: 0 0 260px;
    position: sticky;
    top: 140px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }
  aside.history-sidebar h2 {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mut);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  aside.history-sidebar ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  aside.history-sidebar li a {
    display: block;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    background: var(--paper);
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }
  aside.history-sidebar li a:hover {
    background: var(--card-hover);
    border-color: var(--line);
    transform: translateX(2px);
  }
  aside.history-sidebar li.on a {
    background: var(--acc-soft);
    border-color: var(--acc);
  }
  .hist-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .hist-info .when { font-family: var(--mono); font-size: 12px; color: var(--ink-sub); }
  .hist-info .num { font-size: 11px; color: var(--mut); font-weight: 500; }
  aside.history-sidebar .bar {
    height: 4px;
    background: var(--line);
    border-radius: var(--radius-full);
    overflow: hidden;
    display: block;
  }
  aside.history-sidebar .bar i {
    display: block;
    height: 100%;
    background: var(--mut);
    border-radius: var(--radius-full);
  }
  aside.history-sidebar li.on .bar i { background: var(--acc); }

  /* Content Main */
  main.content-area {
    flex: 1;
    min-width: 0;
  }

  .digest-hero-banner {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
  }
  .digest-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-around;
    gap: 20px;
  }
  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .meta-item .meta-label {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mut);
    margin-bottom: 4px;
  }
  .meta-item .meta-val {
    font-family: var(--head);
    font-weight: 700;
    font-size: 17px;
    color: var(--ink);
  }

  /* Spotlight Hero Card */
  .spotlight-wrapper { margin-bottom: 32px; }
  .spotlight-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .spotlight-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  .spotlight-media-wrap {
    position: relative;
    min-height: 280px;
    background: #000;
    overflow: hidden;
  }
  .spotlight-media-wrap .card-media {
    width: 100%;
    height: 100%;
  }
  .spotlight-ribbon {
    position: absolute;
    top: 16px;
    left: 16px;
    background: var(--acc);
    color: #fff;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10;
  }
  .spotlight-body {
    padding: 28px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .spotlight-title {
    font-family: var(--head);
    font-size: 22px;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: -0.02em;
    margin: 12px 0 14px;
  }
  .spotlight-title a:hover { color: var(--acc); }
  .spotlight-snippet {
    font-size: 14px;
    color: var(--mut);
    line-height: 1.6;
    margin-bottom: 20px;
  }
  .read-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--ink);
    color: var(--paper);
    font-size: 13px;
    font-weight: 700;
    padding: 10px 20px;
    border-radius: var(--radius-full);
    transition: opacity 0.2s, transform 0.15s;
  }
  .read-btn:hover { opacity: 0.9; transform: translateX(2px); }

  /* Category Section */
  .cat-section {
    margin-bottom: 40px;
    scroll-margin-top: 140px;
  }
  .cat-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--line);
  }
  .cat-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cat-icon-badge {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: var(--shadow-sm);
  }
  .cat-heading {
    font-family: var(--head);
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .cat-count-badge {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--mut);
    background: var(--paper);
    padding: 4px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--line);
  }

  /* AI Executive Summary Box */
  .ai-summary-box {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
    border: 1px solid var(--line);
    border-left: 4px solid #6366f1;
    border-radius: var(--radius-md);
    padding: 16px 20px;
    margin-bottom: 20px;
  }
  .ai-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .ai-summary-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6366f1;
  }
  .tts-play-btn {
    background: var(--card);
    border: 1px solid var(--line);
    color: var(--ink);
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: var(--radius-full);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  .tts-play-btn:hover {
    background: #6366f1;
    color: #fff;
    border-color: #6366f1;
  }
  .tts-play-btn.playing {
    background: var(--acc);
    color: #fff;
    border-color: var(--acc);
  }
  .ai-summary-text {
    font-size: 14px;
    line-height: 1.65;
    color: var(--ink-sub);
  }

  /* News Grid & Cards */
  .news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  /* Compact View Mode */
  .layout-compact .news-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .layout-compact .news-card {
    display: grid;
    grid-template-columns: 120px 1fr;
    align-items: stretch;
  }
  .layout-compact .card-thumb-wrap {
    height: 100%;
    min-height: 90px;
  }
  .layout-compact .card-body {
    padding: 12px 16px;
  }
  .layout-compact .card-title {
    font-size: 15px;
    margin-bottom: 6px;
  }
  .layout-compact .card-snippet { display: none; }

  .news-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .news-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--mut);
  }
  .news-card.is-read {
    opacity: 0.72;
  }
  .news-card.is-read .card-title a {
    color: var(--mut);
  }

  .card-thumb-wrap {
    position: relative;
    width: 100%;
    height: 170px;
    overflow: hidden;
    background: var(--paper);
  }
  .card-media {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .news-card:hover .card-media img {
    transform: scale(1.06);
  }

  .card-media.no-img {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pattern-mesh {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px);
    background-size: 14px 14px;
    opacity: 0.65;
  }
  .media-fallback-art {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(8px);
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 2;
  }
  .news-art-icon {
    opacity: 0.92;
  }
  .media-badge {
    position: absolute;
    bottom: 10px;
    left: 10px;
    color: #fff;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  .card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .card-meta-top {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--mut);
    margin-bottom: 8px;
  }
  .pill-source {
    font-weight: 600;
    color: var(--ink-sub);
    text-transform: capitalize;
  }
  .pill-dot { opacity: 0.6; }
  .pill-time { opacity: 0.9; }

  .card-title {
    font-family: var(--head);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: -0.01em;
    margin-bottom: 10px;
    flex: 1;
  }
  .card-title a {
    color: var(--ink);
    transition: color 0.15s ease;
  }
  .card-title a:hover { color: var(--acc); }

  .card-snippet {
    font-size: 13px;
    color: var(--mut);
    line-height: 1.55;
    margin-bottom: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid var(--line);
    margin-top: auto;
  }
  .card-link-more {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.15s ease;
  }
  .card-link-more:hover { color: var(--acc); }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .act-btn {
    background: transparent;
    border: none;
    color: var(--mut);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .act-btn:hover {
    background: var(--paper);
    color: var(--ink);
  }
  .act-btn.bookmarked {
    color: #f59e0b;
  }
  .act-btn.bookmarked svg {
    fill: #f59e0b;
  }

  /* Empty State */
  .empty-state {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 60px 32px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-state h2 {
    font-family: var(--head);
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 8px;
  }
  .empty-state p {
    color: var(--mut);
    max-width: 480px;
    margin: 0 auto;
  }

  /* Toast Notification */
  #toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--ink);
    color: var(--paper);
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-size: 13px;
    font-weight: 600;
    z-index: 2000;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }
  #toast.show {
    opacity: 1;
    transform: translateY(0);
  }

  /* Spin animation */
  .spin { display: inline-block; animation: spin 1s infinite linear; }
  @keyframes spin { 100% { transform: rotate(360deg); } }

  /* Responsive Design */
  @media (max-width: 980px) {
    .layout-wrap { flex-direction: column; padding: 20px 16px 60px; }
    aside.history-sidebar { position: static; width: 100%; }
    .spotlight-card { grid-template-columns: 1fr; }
    .spotlight-media-wrap { min-height: 220px; }
    header.top, .strip, .control-bar-wrapper { padding-left: 16px; padding-right: 16px; }
    .search-box input { width: 150px; }
    .search-box input:focus { width: 180px; }
  }
  @media (max-width: 600px) {
    .nav-right .live-status { display: none; }
    .digest-meta-row { justify-content: space-between; }
    .news-grid { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
</style>
</head>
<body>

<div id="reading-progress"></div>

<header class="top">
  <div class="nav-left">
    <a href="/" class="brand">News<span class="dot">·</span>Update <span class="badge">Live</span></a>
    <span class="live-status"><i></i>Bot aktif</span>
  </div>
  <div class="nav-right">
    <button id="theme-toggle" class="theme-toggle-btn" title="Ganti Tema Gelap/Terang">
      <span class="theme-icon">🌙</span>
      <span class="theme-text">Mode Gelap</span>
    </button>
    ${actions}
  </div>
</header>

<section class="strip">
  <div class="head">
    <h2>Jadwal Transmisi Telegram</h2>
    <p class="next-timer" id="next-timer">Transmisi berikutnya <b id="countdown-val">—:—:—</b></p>
    <h2>Terakhir: ${latest ? escapeHtml(fmtWIB(latest.ts)) : "—"}</h2>
  </div>
  <div class="rail">${ticks}<div class="now-needle" id="now-needle" data-t="" style="left:0"></div></div>
</section>

${banner}

<div class="control-bar-wrapper">
  <div class="control-bar">
    <div class="filter-pills" id="filter-pills">
      <button class="filter-btn active" data-filter="all">Semua Kategori</button>
      <button class="filter-btn" data-filter="internasional">🌍 Internasional</button>
      <button class="filter-btn" data-filter="nasional">🇮🇩 Nasional</button>
      <button class="filter-btn" data-filter="ekonomi">📈 Ekonomi</button>
      <button class="filter-btn" data-filter="bisnis">🏢 Bisnis</button>
      <button class="filter-btn" data-filter="teknologi">💻 Teknologi</button>
      <button class="filter-btn" data-filter="jakarta">🏙️ Jakarta</button>
      <button class="filter-btn" data-filter="saved">⭐ Tersimpan (<span id="saved-badge">0</span>)</button>
    </div>
    <div class="view-and-search">
      <div class="search-box">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="search-input" placeholder="Cari topik berita… (tekan /)" aria-label="Cari berita">
      </div>
      <div class="view-toggle-group">
        <button class="view-toggle-btn active" id="view-grid-btn" title="Tampilan Kotak Grid">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>
        <button class="view-toggle-btn" id="view-compact-btn" title="Tampilan Daftar Ringkas">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
</div>

<div class="layout-wrap" id="main-layout-wrap">
  <aside class="history-sidebar">
    <h2>Riwayat 7 Hari <span class="num">${digests.length}</span></h2>
    <ul>${history || '<li><a><div class="hist-info"><span class="when">Belum ada data</span></div></a></li>'}</ul>
  </aside>
  <main class="content-area" id="content-area">
    ${renderDigest(selected)}
  </main>
</div>

<div id="toast">Notifikasi</div>

<script>
(function() {
  // 1. Theme Management (Dark / Light)
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = themeToggle.querySelector('.theme-icon');
  var themeText = themeToggle.querySelector('.theme-text');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('news_theme', theme);
    if (theme === 'dark') {
      themeIcon.textContent = '☀️';
      themeText.textContent = 'Mode Terang';
    } else {
      themeIcon.textContent = '🌙';
      themeText.textContent = 'Mode Gelap';
    }
  }

  var savedTheme = localStorage.getItem('news_theme');
  if (!savedTheme) {
    savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', function() {
    var cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // 2. View Mode (Grid vs Compact)
  var layoutWrap = document.getElementById('main-layout-wrap');
  var gridBtn = document.getElementById('view-grid-btn');
  var compactBtn = document.getElementById('view-compact-btn');

  function applyViewMode(mode) {
    if (mode === 'compact') {
      layoutWrap.classList.add('layout-compact');
      compactBtn.classList.add('active');
      gridBtn.classList.remove('active');
    } else {
      layoutWrap.classList.remove('layout-compact');
      gridBtn.classList.add('active');
      compactBtn.classList.remove('active');
    }
    localStorage.setItem('news_view_mode', mode);
  }

  var savedView = localStorage.getItem('news_view_mode') || 'grid';
  applyViewMode(savedView);

  gridBtn.addEventListener('click', function() { applyViewMode('grid'); });
  compactBtn.addEventListener('click', function() { applyViewMode('compact'); });

  // 3. Reading Progress Indicator
  var prog = document.getElementById('reading-progress');
  window.addEventListener('scroll', function() {
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0) {
      prog.style.width = ((window.scrollY / total) * 100) + '%';
    }
  }, { passive: true });

  // 4. Toast Notification
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, 2800);
  }

  // 5. Bookmarks Management
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem('news_bookmarks') || '[]'); }
    catch(e) { return []; }
  }
  function saveBookmarks(list) {
    localStorage.setItem('news_bookmarks', JSON.stringify(list));
    updateBookmarkBadges();
  }
  function updateBookmarkBadges() {
    var list = getBookmarks();
    var badge = document.getElementById('saved-badge');
    if (badge) badge.textContent = list.length;
    var savedCount = document.getElementById('saved-count-badge');
    if (savedCount) savedCount.textContent = list.length + ' berita';

    document.querySelectorAll('.bookmark-btn').forEach(function(btn) {
      var url = btn.dataset.url;
      var exists = list.some(function(item) { return item.url === url; });
      btn.classList.toggle('bookmarked', exists);
    });
  }

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.bookmark-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    var item = {
      url: btn.dataset.url,
      title: btn.dataset.title,
      source: btn.dataset.source,
      cat: btn.dataset.cat,
      img: btn.dataset.img || ''
    };

    var list = getBookmarks();
    var idx = list.findIndex(function(x) { return x.url === item.url; });
    if (idx >= 0) {
      list.splice(idx, 1);
      showToast('🗑️ Berita dihapus dari tersimpan');
    } else {
      list.push(item);
      showToast('⭐ Berita berhasil disimpan!');
    }
    saveBookmarks(list);
    renderSavedList();
  });

  function renderSavedList() {
    var grid = document.getElementById('saved-news-grid');
    if (!grid) return;
    var list = getBookmarks();
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; padding: 40px 20px;"><p>Belum ada berita yang disimpan. Klik ikon bookmark pada berita untuk menyimpannya di sini.</p></div>';
      return;
    }
    grid.innerHTML = list.map(function(it) {
      var imgHtml = it.img
        ? '<div class="card-media has-img"><img src="' + it.img + '" loading="lazy"><span class="media-badge" style="background:#f59e0b">⭐ ' + (it.cat || 'Tersimpan') + '</span></div>'
        : '<div class="card-media no-img" style="background:linear-gradient(135deg,#d97706,#f59e0b)"><div class="pattern-mesh"></div><div class="media-fallback-art"><svg class="news-art-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div><span class="media-badge" style="background:rgba(0,0,0,0.5)">⭐ ' + (it.cat || 'Tersimpan') + '</span></div>';
      return '<article class="news-card">' +
        '<div class="card-thumb-wrap">' + imgHtml + '</div>' +
        '<div class="card-body">' +
          '<div class="card-meta-top"><span class="pill-source">' + (it.source || 'Media') + '</span></div>' +
          '<h3 class="card-title"><a href="' + it.url + '" target="_blank" rel="noopener">' + it.title + '</a></h3>' +
          '<div class="card-footer">' +
            '<a href="' + it.url + '" target="_blank" rel="noopener" class="card-link-more">Buka →</a>' +
            '<button class="act-btn bookmark-btn bookmarked" data-url="' + it.url + '" title="Hapus bookmark"><svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  // 6. Share Link Handler
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.share-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var url = btn.dataset.url;
    var title = btn.dataset.title;
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function() {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        showToast('🔗 Link berhasil disalin ke clipboard!');
      });
    } else {
      showToast('Link: ' + url);
    }
  });

  // 7. Read Status Tracker
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.news-link, .read-btn, .card-link-more');
    if (!link) return;
    var card = link.closest('.news-card, .spotlight-card');
    if (card) card.classList.add('is-read');
  });

  // 8. Audio Speech Synthesis (TTS) for AI Summary
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.tts-play-btn');
    if (!btn) return;
    var text = btn.dataset.text;
    if (!('speechSynthesis' in window)) {
      showToast('Browser Anda belum mendukung text-to-speech audio.');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.querySelectorAll('.tts-play-btn').forEach(function(b) {
        b.classList.remove('playing');
        b.querySelector('.tts-icon').textContent = '🔊';
        b.querySelector('.tts-label').textContent = 'Dengarkan';
      });
      if (btn.classList.contains('active-speaking')) {
        btn.classList.remove('active-speaking');
        return;
      }
    }

    var ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'id-ID';
    ut.rate = 1.05;
    ut.pitch = 1.0;

    btn.classList.add('playing', 'active-speaking');
    btn.querySelector('.tts-icon').textContent = '⏹️';
    btn.querySelector('.tts-label').textContent = 'Berhenti';

    ut.onend = function() {
      btn.classList.remove('playing', 'active-speaking');
      btn.querySelector('.tts-icon').textContent = '🔊';
      btn.querySelector('.tts-label').textContent = 'Dengarkan';
    };
    ut.onerror = function() {
      btn.classList.remove('playing', 'active-speaking');
      btn.querySelector('.tts-icon').textContent = '🔊';
      btn.querySelector('.tts-label').textContent = 'Dengarkan';
    };

    window.speechSynthesis.speak(ut);
  });

  // 9. Category Filtering & Search
  var searchInput = document.getElementById('search-input');
  var filterButtons = document.querySelectorAll('.filter-btn');
  var activeFilter = 'all';

  function applyFilters() {
    var query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    var sections = document.querySelectorAll('.categories-wrapper .cat-section');
    var spotlight = document.querySelector('.spotlight-wrapper');
    var savedSec = document.getElementById('saved-section');

    if (activeFilter === 'saved') {
      sections.forEach(function(s) { s.style.display = 'none'; });
      if (spotlight) spotlight.style.display = 'none';
      if (savedSec) savedSec.style.display = 'block';
      renderSavedList();
      return;
    }

    if (savedSec) savedSec.style.display = 'none';

    sections.forEach(function(sec) {
      var catSlug = sec.dataset.cat;
      var matchCat = (activeFilter === 'all' || activeFilter === catSlug);
      var cards = sec.querySelectorAll('.news-card');
      var visibleInSec = 0;

      cards.forEach(function(c) {
        var cardText = c.textContent.toLowerCase();
        var matchQuery = !query || cardText.indexOf(query) >= 0;
        if (matchCat && matchQuery) {
          c.style.display = '';
          visibleInSec++;
        } else {
          c.style.display = 'none';
        }
      });

      sec.style.display = (matchCat && visibleInSec > 0) ? '' : 'none';
    });

    if (spotlight) {
      var spotCat = spotlight.querySelector('.spotlight-card')?.dataset.cat;
      var spotText = spotlight.textContent.toLowerCase();
      var matchSpotCat = (activeFilter === 'all' || activeFilter === spotCat);
      var matchSpotQuery = !query || spotText.indexOf(query) >= 0;
      spotlight.style.display = (matchSpotCat && matchSpotQuery) ? '' : 'none';
    }
  }

  filterButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterButtons.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
    window.addEventListener('keydown', function(e) {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // 10. Real-time Transmission Needle and Countdown
  var HOURS = ${JSON.stringify(hours)};
  var needle = document.getElementById('now-needle');
  var countdown = document.getElementById('countdown-val');

  function tickTime() {
    var w = new Date(Date.now() + 7 * 3600e3);
    var h = w.getUTCHours(), m = w.getUTCMinutes(), s = w.getUTCSeconds();
    var mins = h * 60 + m;
    if (needle) {
      needle.style.left = ((mins + s / 60) / 1440 * 100) + '%';
      needle.dataset.t = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    var slots = document.querySelectorAll('.tick');
    for (var i = 0; i < HOURS.length; i++) {
      if (slots[i]) slots[i].classList.toggle('done', HOURS[i] * 60 <= mins);
    }
    var upcoming = HOURS.find(function(x) { return x * 60 > mins; });
    var left = (upcoming === undefined ? (24 + HOURS[0]) * 60 : upcoming * 60) - mins - 1;
    if (countdown) {
      countdown.textContent =
        String(Math.floor(left / 60)).padStart(2, '0') + ':' +
        String(left % 60).padStart(2, '0') + ':' +
        String(59 - s).padStart(2, '0');
    }
  }
  tickTime();
  setInterval(tickTime, 1000);

  // Initial State Setup
  updateBookmarkBadges();
})();
</script>
</body>
</html>`;
}
