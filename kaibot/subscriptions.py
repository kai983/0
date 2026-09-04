import json
from pathlib import Path

from kaibot.config import SUBSCRIPTIONS_FILE

_path = Path(SUBSCRIPTIONS_FILE)


def load() -> set[int]:
    if not _path.exists():
        return set()
    return set(json.loads(_path.read_text()))


def save(chat_ids: set[int]) -> None:
    _path.write_text(json.dumps(sorted(chat_ids)))


def add(chat_id: int) -> bool:
    chat_ids = load()
    if chat_id in chat_ids:
        return False
    chat_ids.add(chat_id)
    save(chat_ids)
    return True


def remove(chat_id: int) -> bool:
    chat_ids = load()
    if chat_id not in chat_ids:
        return False
    chat_ids.discard(chat_id)
    save(chat_ids)
    return True
