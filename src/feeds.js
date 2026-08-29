const GN = "https://news.google.com/rss";
const gnTopic = (t) => `${GN}/headlines/section/topic/${t}?hl=id&gl=ID&ceid=ID:id`;
const gnSearch = (q) => `${GN}/search?q=${encodeURIComponent(q)}&hl=id&gl=ID&ceid=ID:id`;

// Setiap kategori: heading + daftar feed RSS media Indonesia terpercaya
// yang selalu menyediakan gambar artikel asli beresolusi baik.
export const CATEGORIES = [
  {
    heading: "🌍 Berita Internasional",
    feeds: [
      "https://www.cnnindonesia.com/internasional/rss",
      "https://www.antaranews.com/rss/dunia.xml",
      "https://www.cnbcindonesia.com/news/rss",
    ],
  },
  {
    heading: "🇮🇩 Nasional & Politik",
    feeds: [
      "https://www.cnnindonesia.com/nasional/rss",
      "https://news.detik.com/rss",
      "https://www.antaranews.com/rss/politik.xml",
      "https://www.antaranews.com/rss/terkini.xml",
    ],
  },
  {
    heading: "📈 Ekonomi & Pasar Modal",
    feeds: [
      "https://finance.detik.com/rss",
      "https://www.cnnindonesia.com/ekonomi/rss",
      "https://www.cnbcindonesia.com/market/rss",
      "https://www.antaranews.com/rss/ekonomi-bisnis.xml",
    ],
  },
  {
    heading: "🏢 Bisnis & Industri",
    feeds: [
      "https://www.cnbcindonesia.com/news/rss",
      "https://finance.detik.com/rss",
      "https://www.antaranews.com/rss/ekonomi-bisnis.xml",
      "https://rss.tempo.co/bisnis",
    ],
  },
  {
    heading: "💻 Teknologi",
    feeds: [
      "https://inet.detik.com/rss",
      "https://www.cnnindonesia.com/teknologi/rss",
      "https://www.cnbcindonesia.com/tech/rss",
      "https://www.antaranews.com/rss/tekno.xml",
    ],
  },
  {
    heading: "🏙️ Jakarta & Sekitarnya",
    feeds: [
      "https://www.antaranews.com/rss/metro.xml",
      "https://news.detik.com/rss",
      "https://www.cnnindonesia.com/nasional/rss",
    ],
  },
];
