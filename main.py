import requests
import feedparser
import os
from datetime import datetime

# Mengambil kredensial dari Environment Variables (GitHub Secrets)
BOT_TOKEN = os.getenv('BOT_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')

def send_telegram_broadcast(text):
    """Mengirim pesan ke Telegram via API"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True # Mencegah Telegram memunculkan preview link yang terlalu panjang
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Terjadi kesalahan koneksi: {e}")
        return None

def fetch_rss_news(feed_url, limit=3):
    """Mengambil judul dan link dari RSS Feed"""
    feed = feedparser.parse(feed_url)
    news_items = []
    
    # Mengambil berita sesuai batas limit
    for entry in feed.entries[:limit]:
        # Membersihkan judul jika ada nama media di belakangnya (opsional)
        title = entry.title.split(' - ')[0] 
        link = entry.link
        # Format Markdown: [Teks](URL)
        news_items.append(f"• [{title}]({link})")
        
    return "\n".join(news_items)

def generate_dynamic_summary():
    """Menyusun template berita dari data RSS Google News"""
    
    # URL RSS Google News berbahasa Indonesia
    url_internasional = "https://news.google.com/rss/headlines/section/topic/WORLD?hl=id&gl=ID&ceid=ID:id"
    url_ekonomi = "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=id&gl=ID&ceid=ID:id"
    # Query pencarian spesifik untuk berita lokal
    url_lokal = "https://news.google.com/rss/search?q=Jakarta&hl=id&gl=ID&ceid=ID:id"

    print("Sedang mengambil data berita terbaru...")
    berita_internasional = fetch_rss_news(url_internasional, limit=3)
    berita_ekonomi = fetch_rss_news(url_ekonomi, limit=3)
    berita_lokal = fetch_rss_news(url_lokal, limit=3)

    today = datetime.now().strftime("%d %B %Y")
    
    template = f"""
*Rangkuman Berita Harian - {today}*

*🌍 Berita Internasional*
{berita_internasional}

*📈 Perekonomian & Pasar Modal*
{berita_ekonomi}

*🏙️ Berita Lokal (Jakarta & Sekitarnya)*
{berita_lokal}
"""
    return template.strip()

if __name__ == '__main__':
    # Pastikan token tidak kosong
    if not BOT_TOKEN or not CHAT_ID:
        print("❌ Error: BOT_TOKEN atau CHAT_ID tidak ditemukan.")
        exit(1)

    pesan_berita = generate_dynamic_summary()
    print("Mencoba mengirim broadcast ke Telegram...")
    hasil = send_telegram_broadcast(pesan_berita)
    
    if hasil and hasil.get("ok"):
        print("✅ Berhasil! Berita dinamis hari ini sudah dikirim.")
    else:
        print("❌ Gagal mengirim pesan.")