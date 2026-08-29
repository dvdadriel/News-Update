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

export function extractSource(block, rawTitle, link) {
  const srcTag = extractTag(block, "source");
  if (srcTag) return decodeEntities(srcTag);
  const parts = decodeEntities(rawTitle).split(" - ");
  if (parts.length > 1 && parts[parts.length - 1].length < 30) {
    return parts[parts.length - 1].trim();
  }
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "";
  }
}

export function extractImage(block) {
  // 1. enclosure tag with image URL or type
  const enc = block.match(/<enclosure[^>]+url=["'](https?:\/\/[^"']+)["']/i);
  if (enc) {
    if (/\.(jpg|jpeg|png|webp|gif|avif)/i.test(enc[1]) || /type=["']image\//i.test(enc[0])) {
      return enc[1].replace(/&amp;/g, "&");
    }
  }

  // 2. media:content or media:thumbnail
  const media = block.match(/<media:(?:content|thumbnail)[^>]+url=["'](https?:\/\/[^"']+)["']/i);
  if (media) return media[1].replace(/&amp;/g, "&");

  // 3. img src inside description or content:encoded
  const desc = extractTag(block, "description") || extractTag(block, "content:encoded");
  const img = desc.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (img) return img[1].replace(/&amp;/g, "&");

  return null;
}

export function extractSnippet(block) {
  const desc = extractTag(block, "description") || extractTag(block, "content:encoded");
  if (!desc) return "";
  let clean = decodeEntities(desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  if (!clean || clean.startsWith("http") || clean.includes("href=") || clean.length < 15) return "";
  return clean.length > 160 ? clean.slice(0, 157) + "…" : clean;
}

// Regex RSS parser with metadata & image extraction
export function parseRss(xml, limit) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of blocks) {
    if (items.length >= limit) break;
    const rawTitle = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!rawTitle || !link) continue;
    const cleanLink = decodeEntities(link).trim();
    items.push({
      title: cleanTitle(rawTitle),
      link: cleanLink,
      image: extractImage(block),
      snippet: extractSnippet(block),
      source: extractSource(block, rawTitle, cleanLink),
      pubDate: extractTag(block, "pubDate") || null,
    });
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

// --- Session cookie (dashboard publik, aksi kirim butuh login) ---

export function readCookie(header, name) {
  for (const part of (header || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

// Cookie berisi SHA-256 password, bukan passwordnya — biar tidak tersimpan
// plaintext di browser. ponytail: tanpa expiry/HMAC; cukup utk satu admin.
export async function tokenFor(password) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Membersihkan output AI agar to-the-point, tanpa CoT reasoning, tanpa tanda kutip,
// dan kalimat selesai utuh tanpa terpotong di tengah jalan.
export function cleanSummary(raw) {
  if (!raw) return null;
  let s = raw.trim();

  // 1. Bersihkan tag <think>...</think> jika ada
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Bersihkan pola reasoning / meta-commentary bahasa Inggris
  // Misal: "We need to produce... Let's craft: \"Praperadilan...\""
  const craftMatch = s.match(/(?:let'?s craft|here is (?:the|a) summary|rangkuman(?:nya)?:|summary:)\s*[:\s]*["'“]?([\s\S]+)/i);
  if (craftMatch) {
    s = craftMatch[1].trim();
  }

  // 3. Jika masih diawali dengan pengantar bahasa Inggris
  if (/^(?:we need to|i will|to summarize|based on the titles|in this task|the following)/i.test(s)) {
    const quoteMatch = s.match(/["“]([^"”]{20,})["”]/);
    if (quoteMatch) {
      s = quoteMatch[1].trim();
    } else {
      const parts = s.split(/(?:\n\n|:\s+)/);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i].trim();
        if (p.length > 20 && !/^(?:we need|let's|note:|the summary)/i.test(p)) {
          s = p;
          break;
        }
      }
    }
  }

  // 4. Hapus tanda kutip luar, backtick, titik dua, dash, dan pengantar umum
  s = s.replace(/^[:\s\-"'“”`]+|[:\s\-"'“”`]+$/g, "").trim();
  s = s.replace(/^(?:berikut (?:adalah )?rangkuman(?:nya)?|rangkuman berita|ringkasan berita|ringkasan)\s*[:\s]*/i, "").trim();
  s = s.replace(/^[:\s\-"'“”`]+|[:\s\-"'“”`]+$/g, "").trim();

  // 5. Pastikan kalimat tidak terpotong di tengah kata/kalimat (pangkas ke titik terakhir)
  if (!/[.!?]$/.test(s)) {
    const lastPunct = Math.max(s.lastIndexOf("."), s.lastIndexOf("!"), s.lastIndexOf("?"));
    if (lastPunct > 25) {
      s = s.slice(0, lastPunct + 1).trim();
    }
  }

  return s.length > 15 ? s : null;
}

