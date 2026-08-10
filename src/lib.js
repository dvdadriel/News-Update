const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in NAMED ? NAMED[n.toLowerCase()] : m));
}

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ponytail: split on " - " matches Google News "Title - Source"; lossy if a real
// title contains " - ". Upgrade path: parse <source> tag instead.
export function cleanTitle(raw) {
  return decodeEntities(raw).split(" - ")[0].trim();
}

export function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  const v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1].trim() : v;
}

// ponytail: regex RSS parse, no XML lib. Ceiling: non-standard feeds. Fine for
// RSS 2.0 (Detik/CNN/Antara/Google News all serve this).
export function parseRss(xml, limit) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of blocks) {
    if (items.length >= limit) break;
    const rawTitle = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!rawTitle || !link) continue;
    items.push({ title: cleanTitle(rawTitle), link: decodeEntities(link).trim() });
  }
  return items;
}

export function dedup(items, seen) {
  const out = [];
  for (const it of items) {
    const key = it.title.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

// FNV-1a 32-bit → short hex key for KV (judul bisa panjang, key KV dibatasi).
export function hashTitle(title) {
  let h = 0x811c9dc5;
  const s = title.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
