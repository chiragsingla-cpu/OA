import io

import pytest
from pypdf import PdfWriter

from app import llm
from app.ingest import UnreadableDocument, UnsupportedFileType, chunk_text, extract_text


def test_extract_text_from_markdown():
    assert extract_text("policy.md", "# Leave\n\n24 days".encode()) == "# Leave\n\n24 days"


def test_extract_text_rejects_unknown_types():
    with pytest.raises(UnsupportedFileType):
        extract_text("image.png", b"\x89PNG")


@pytest.mark.parametrize("filename", ["broken.pdf", "broken.docx"])
def test_damaged_files_raise_a_readable_error(filename):
    with pytest.raises(UnreadableDocument, match="damaged"):
        extract_text(filename, b"this is not really a " + filename.encode())


def _encrypted_pdf(user_password: str) -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.encrypt(user_password=user_password, owner_password="owner-secret")
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def test_password_protected_pdf_asks_for_the_password_to_be_removed():
    with pytest.raises(UnreadableDocument, match="password-protected"):
        extract_text("locked.pdf", _encrypted_pdf(user_password="open-me"))


def test_pdf_locked_only_against_editing_is_still_read():
    assert extract_text("edit-locked.pdf", _encrypted_pdf(user_password="")) == ""


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
