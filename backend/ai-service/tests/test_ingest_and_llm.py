import pytest

from app import llm
from app.ingest import UnsupportedFileType, chunk_text, extract_text


def test_extract_text_from_markdown():
    assert extract_text("policy.md", "# Leave\n\n24 days".encode()) == "# Leave\n\n24 days"


def test_extract_text_rejects_unknown_types():
    with pytest.raises(UnsupportedFileType):
        extract_text("image.png", b"\x89PNG")


def test_chunk_text_splits_long_documents_and_drops_blanks():
    text = "\n\n".join(f"Paragraph {i}. " + "word " * 60 for i in range(20))

    chunks = chunk_text(text)

    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)
    assert all(len(chunk) <= 800 for chunk in chunks)


def test_history_messages_start_with_user_alternate_and_end_on_assistant():
    history = [
        {"role": "assistant", "content": "orphan greeting"},
        {"role": "user", "content": "Q1"},
        {"role": "user", "content": "Q1 again"},
        {"role": "assistant", "content": "A1"},
        {"role": "user", "content": "unanswered"},
    ]

    assert llm._history_messages(history) == [
        {"role": "user", "content": "Q1\n\nQ1 again"},
        {"role": "assistant", "content": "A1"},
    ]
