from datetime import datetime


def build_report() -> str:
    """일간/수시 보고 내용을 만든다.

    TODO: 실제 업무 데이터 소스(DB, 사내 API, 스프레드시트 등)를 연결해서
    아래 목업 대신 진짜 조회 결과를 채워 넣는다.
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    return (
        f"📊 업무 보고 ({now})\n\n"
        "아직 실제 데이터 소스가 연결되지 않았습니다.\n"
        "kaibot/services/report.py의 build_report()에 조회 로직을 채워주세요."
    )
