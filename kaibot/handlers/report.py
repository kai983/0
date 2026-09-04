import datetime as dt

from telegram import Update
from telegram.ext import ContextTypes

from kaibot import subscriptions
from kaibot.config import REPORT_TIME, TIMEZONE
from kaibot.services.report import build_report

try:
    from zoneinfo import ZoneInfo

    _TZ = ZoneInfo(TIMEZONE)
except Exception:
    _TZ = None

DAILY_REPORT_JOB = "daily_report"


async def report(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(build_report())


async def subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    if subscriptions.add(chat_id):
        await update.message.reply_text(
            f"✅ 매일 {REPORT_TIME}에 보고를 보내드릴게요."
        )
    else:
        await update.message.reply_text("이미 정기 보고를 구독 중입니다.")


async def unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat_id = update.effective_chat.id
    if subscriptions.remove(chat_id):
        await update.message.reply_text("정기 보고를 해지했습니다.")
    else:
        await update.message.reply_text("구독 중인 정기 보고가 없습니다.")


async def send_daily_report(context: ContextTypes.DEFAULT_TYPE) -> None:
    text = build_report()
    for chat_id in subscriptions.load():
        await context.bot.send_message(chat_id=chat_id, text=text)


def schedule_daily_report(job_queue) -> None:
    hour, minute = (int(part) for part in REPORT_TIME.split(":"))
    run_time = dt.time(hour=hour, minute=minute, tzinfo=_TZ)
    job_queue.run_daily(send_daily_report, time=run_time, name=DAILY_REPORT_JOB)
