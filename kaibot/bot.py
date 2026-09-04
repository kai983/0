import logging

from telegram.ext import Application, CommandHandler

from kaibot.config import TELEGRAM_BOT_TOKEN
from kaibot.handlers import basic, report

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)


def build_application() -> Application:
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", basic.start))
    application.add_handler(CommandHandler("help", basic.help_command))
    application.add_handler(CommandHandler("status", basic.status))
    application.add_handler(CommandHandler("report", report.report))
    application.add_handler(CommandHandler("subscribe", report.subscribe))
    application.add_handler(CommandHandler("unsubscribe", report.unsubscribe))

    report.schedule_daily_report(application.job_queue)

    return application


def main() -> None:
    application = build_application()
    application.run_polling()


if __name__ == "__main__":
    main()
