import os

from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

ADMIN_CHAT_IDS = {
    int(chat_id)
    for chat_id in os.environ.get("ADMIN_CHAT_IDS", "").split(",")
    if chat_id.strip()
}

REPORT_TIME = os.environ.get("REPORT_TIME", "09:00")
TIMEZONE = os.environ.get("TIMEZONE", "Asia/Seoul")

SUBSCRIPTIONS_FILE = os.environ.get("SUBSCRIPTIONS_FILE", "subscriptions.json")
