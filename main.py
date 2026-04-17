import requests
import feedparser
import os
from datetime import datetime

# Mengambil kredensial dari Environment Variables (GitHub Secrets)
BOT_TOKEN = os.getenv('BOT_TOKEN')
CHAT_ID = os.getenv('CHAT_ID')

# ... (sisa fungsi send_telegram_broadcast, fetch_rss_news, dan generate_dynamic_summary tetap sama persis seperti sebelumnya) ...

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