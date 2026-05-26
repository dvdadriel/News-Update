import html
import os
from datetime import datetime, timezone, timedelta

import feedparser
import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN") or os.getenv("TELEGRAM_TOKEN")
CHAT_ID = os.getenv("CHAT_ID") or os.getenv("TELEGRAM_CHAT_ID")

WIB = timezone(timedelta(hours=7))


def send_telegram_broadcast(text):
    """Mengirim pesan ke Telegram via API."""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Terjadi kesalahan koneksi: {e}")
        if e.response is not None:
            print(f"Response body: {e.response.text}")
        return None


def fetch_rss_news(feed_url, limit=3, seen_titles=None):
    """Mengambil judul dan link dari RSS feed, dengan dedup lintas section."""
    if seen_titles is None:
        seen_titles = set()

    try:
        feed = feedparser.parse(feed_url)
    except Exception as e:
        print(f"Gagal parse feed {feed_url}: {e}")
        return "_(tidak ada data)_"

    items = []
    for entry in feed.entries:
        if len(items) >= limit:
            break
        title = getattr(entry, "title", "").split(" - ")[0].strip()
        link = getattr(entry, "link", "").strip()
        if not title or not link:
            continue
        key = title.lower()
        if key in seen_titles:
            continue
        seen_titles.add(key)
        safe_title = html.escape(title)
        safe_link = html.escape(link, quote=True)
        items.append(f'• <a href="{safe_link}">{safe_title}</a>')

    return "\n".join(items) if items else "<i>(tidak ada berita)</i>"


def generate_dynamic_summary():
    """Menyusun template berita dari data RSS Google News."""
    sources = {
        "🌍 Berita Internasional": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=id&gl=ID&ceid=ID:id",
        "📈 Perekonomian & Pasar Modal": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=id&gl=ID&ceid=ID:id",
        "🏙️ Berita Lokal (Jakarta & Sekitarnya)": "https://news.google.com/rss/search?q=Jakarta&hl=id&gl=ID&ceid=ID:id",
    }

    print("Sedang mengambil data berita terbaru...")
    seen = set()
    sections = []
    for heading, url in sources.items():
        body = fetch_rss_news(url, limit=3, seen_titles=seen)
        sections.append(f"<b>{heading}</b>\n{body}")

    today = datetime.now(WIB).strftime("%d %B %Y")
    header = f"<b>Rangkuman Berita Harian - {today}</b>"
    return header + "\n\n" + "\n\n".join(sections)


if __name__ == "__main__":
    if not BOT_TOKEN or not CHAT_ID:
        print("❌ Error: BOT_TOKEN atau CHAT_ID tidak ditemukan.")
        raise SystemExit(1)

    pesan_berita = generate_dynamic_summary()
    print("Mencoba mengirim broadcast ke Telegram...")
    hasil = send_telegram_broadcast(pesan_berita)

    if hasil and hasil.get("ok"):
        print("✅ Berhasil! Berita dinamis hari ini sudah dikirim.")
    else:
        print("❌ Gagal mengirim pesan.")
        raise SystemExit(1)
