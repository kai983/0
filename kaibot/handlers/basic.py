from telegram import Update
from telegram.ext import ContextTypes

HELP_TEXT = (
    "🤖 카이봇 명령어\n\n"
    "/report - 지금 바로 보고 받기\n"
    "/subscribe - 매일 정해진 시각에 보고 받기\n"
    "/unsubscribe - 정기 보고 해지\n"
    "/status - 봇 상태 확인\n"
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("안녕하세요, 카이봇입니다.\n\n" + HELP_TEXT)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(HELP_TEXT)


async def status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("✅ 카이봇 정상 작동 중입니다.")
