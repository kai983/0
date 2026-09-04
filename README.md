# 카이봇

업무 자동화(데이터 조회 / 알림 / 정기 보고)를 위한 텔레그램 봇.

## 설정

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # TELEGRAM_BOT_TOKEN 등 채워넣기
```

## 실행

```bash
python -m kaibot.bot
```

## 명령어

- `/start`, `/help` - 안내
- `/report` - 즉시 보고 받기
- `/subscribe` - 매일 `REPORT_TIME`(.env)에 정기 보고 받기
- `/unsubscribe` - 정기 보고 해지
- `/status` - 봇 상태 확인

## 구조

```
kaibot/
  bot.py              # 엔트리포인트, 핸들러 등록
  config.py           # 환경변수 로딩
  subscriptions.py     # 정기 보고 구독자 저장 (JSON)
  handlers/            # 텔레그램 명령어 핸들러
  services/report.py   # 실제 보고 데이터 생성 로직 (TODO: 실데이터 연동)
```

## 다음 단계

`kaibot/services/report.py`의 `build_report()`에 실제 업무 데이터 소스
(DB, 사내 API, 스프레드시트 등)를 연결하면 됩니다.
