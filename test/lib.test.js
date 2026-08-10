import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeEntities,
  escapeHtml,
  cleanTitle,
  extractTag,
  parseRss,
  dedup,
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
  assert.deepEqual(items[0], { title: "Berita & Satu", link: "https://a.test/1" });
  assert.equal(items[1].title, "Berita Dua");
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
