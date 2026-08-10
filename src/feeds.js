const GN = "https://news.google.com/rss";
const gnTopic = (t) => `${GN}/headlines/section/topic/${t}?hl=id&gl=ID&ceid=ID:id`;
const gnSearch = (q) => `${GN}/search?q=${encodeURIComponent(q)}&hl=id&gl=ID&ceid=ID:id`;

// Setiap kategori: heading + daftar feed (RSS media Indonesia dulu, lalu Google News).
export const CATEGORIES = [
  {
    heading: "🌍 Berita Internasional",
    feeds: ["https://www.cnnindonesia.com/internasional/rss", gnTopic("WORLD")],
  },
  {
    heading: "🇮🇩 Nasional & Politik",
    feeds: [
      "https://www.cnnindonesia.com/nasional/rss",
      "https://www.antaranews.com/rss/terkini.xml",
      gnTopic("NATION"),
    ],
  },
  {
    heading: "📈 Ekonomi & Pasar Modal",
    feeds: [
      "https://finance.detik.com/rss",
      "https://www.cnnindonesia.com/ekonomi/rss",
      gnTopic("BUSINESS"),
    ],
  },
  {
    heading: "🏢 Bisnis & Industri",
    feeds: ["https://finance.detik.com/rss", gnSearch("industri OR properti OR manufaktur Indonesia")],
  },
  {
    heading: "💻 Teknologi",
    feeds: [
      "https://inet.detik.com/rss",
      "https://www.cnnindonesia.com/teknologi/rss",
      gnTopic("TECHNOLOGY"),
    ],
  },
  {
    heading: "🏙️ Jakarta & Sekitarnya",
    feeds: [gnSearch("Jakarta")],
  },
];
