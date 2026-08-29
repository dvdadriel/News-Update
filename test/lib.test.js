import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeEntities,
  escapeHtml,
  cleanTitle,
  extractTag,
  parseRss,
  dedup,
  readCookie,
  tokenFor,
  cleanSummary,
} from "../src/lib.js";

test("decodeEntities: named + numeric", () => {
  assert.equal(decodeEntities("A &amp; B &#39;x&#39; &#x27;y&#x27; &lt;z&gt;"), "A & B 'x' 'y' <z>");
});

test("escapeHtml: escapes for Telegram HTML", () => {
  assert.equal(escapeHtml('a & b <c> "d"'), 'a &amp; b &lt;c&gt; "d"');
});

test("cleanTitle: strips Google News source suffix", () => {
  assert.equal(cleanTitle("Judul Berita - Kompas.com"), "Judul Berita");
  assert.equal(cleanTitle("Judul tanpa sumber"), "Judul tanpa sumber");
});

test("extractTag: handles CDATA and plain", () => {
  assert.equal(extractTag("<title><![CDATA[Halo]]></title>", "title"), "Halo");
  assert.equal(extractTag("<title>Dunia</title>", "title"), "Dunia");
});

test("parseRss: extracts items up to limit, decodes entities", () => {
  const xml = `<rss><channel>
    <item><title>Berita &amp; Satu - Detik</title><link>https://a.test/1</link></item>
    <item><title><![CDATA[Berita Dua]]></title><link>https://a.test/2</link></item>
    <item><title>Berita Tiga</title><link>https://a.test/3</link></item>
  </channel></rss>`;
  const items = parseRss(xml, 2);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "Berita & Satu");
  assert.equal(items[0].link, "https://a.test/1");
  assert.equal(items[0].source, "Detik");
  assert.equal(items[1].title, "Berita Dua");
  assert.equal(items[1].link, "https://a.test/2");
});

test("parseRss: extracts image from enclosure or media tags", () => {
  const xml = `<rss><channel>
    <item>
      <title>Berita Gambar 1</title>
      <link>https://a.test/1</link>
      <enclosure url="https://img.test/photo.jpg" type="image/jpeg" />
      <description><![CDATA[Ini cuplikan berita pertama yang menarik.]]></description>
    </item>
    <item>
      <title>Berita Gambar 2</title>
      <link>https://a.test/2</link>
      <description><![CDATA[<img src="https://img.test/inline.webp" /> Cuplikan berita kedua.]]></description>
    </item>
  </channel></rss>`;
  const items = parseRss(xml, 2);
  assert.equal(items[0].image, "https://img.test/photo.jpg");
  assert.equal(items[0].snippet, "Ini cuplikan berita pertama yang menarik.");
  assert.equal(items[1].image, "https://img.test/inline.webp");
  assert.equal(items[1].snippet, "Cuplikan berita kedua.");
});

test("dedup: drops seen keys and in-run duplicates", () => {
  const seen = new Set(["berita lama"]);
  const items = [
    { title: "Berita Lama", link: "x" },
    { title: "Berita Baru", link: "y" },
    { title: "Berita Baru", link: "z" },
  ];
  const out = dedup(items, seen);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "Berita Baru");
  assert.ok(seen.has("berita baru"));
});

test("readCookie ambil nilai yang benar", () => {
  assert.equal(readCookie("a=1; s=abc; b=2", "s"), "abc");
  assert.equal(readCookie("as=zzz", "s"), null);
  assert.equal(readCookie(null, "s"), null);
});

test("tokenFor deterministik & bukan password plaintext", async () => {
  const t = await tokenFor("rahasia");
  assert.equal(t, await tokenFor("rahasia"));
  assert.notEqual(t, await tokenFor("rahasia2"));
  assert.ok(!t.includes("rahasia"));
});

test("cleanSummary: strips English reasoning, quotes, and prevents cut-off sentences", () => {
  const noisy = `We need to produce a single paragraph in Bahasa Indonesia, 2-3 sentences. Let's craft: "Praperadilan terkait Febrie menyoroti amicus curiae, sementara Bareskrim mencatat 32 kasus agraria. Kementerian PU membuka akses jalan terdampak gempa."`;
  assert.equal(
    cleanSummary(noisy),
    "Praperadilan terkait Febrie menyoroti amicus curiae, sementara Bareskrim mencatat 32 kasus agraria. Kementerian PU membuka akses jalan terdampak gempa."
  );

  const cutoff = `Bundaran HI dan Kota Bawah Tanah menjadi sorotan, sementara Kementerian PU membuka jalan. Pengusaha melaporkan kon`;
  assert.equal(
    cleanSummary(cutoff),
    "Bundaran HI dan Kota Bawah Tanah menjadi sorotan, sementara Kementerian PU membuka jalan."
  );

  const think = `<think>Analyzing news headlines</think>Rangkuman: Harga emas stabil sementara IHSG ditutup menguat sore ini.`;
  assert.equal(cleanSummary(think), "Harga emas stabil sementara IHSG ditutup menguat sore ini.");
});

