"""Parse → chunk → embed → store."""

import io
from pathlib import Path

from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from app import vectorstore
from app.config import settings
from app.embeddings import embed_passages

TEXT_EXTENSIONS = {".txt", ".md", ".markdown"}


class UnsupportedFileType(ValueError):
    pass


class EmptyDocument(ValueError):
    pass


def extract_text(filename: str, data: bytes) -> str:
    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages).strip()

    if extension == ".docx":
        document = DocxDocument(io.BytesIO(data))
        parts = [paragraph.text for paragraph in document.paragraphs]
        for table in document.tables:
            for row in table.rows:
                parts.append(" | ".join(cell.text for cell in row.cells))
        return "\n".join(parts).strip()

    if extension in TEXT_EXTENSIONS:
        return data.decode("utf-8", errors="replace").strip()

    raise UnsupportedFileType(f"Unsupported file type '{extension}'. Use PDF, DOCX, TXT or MD.")


def chunk_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    return [chunk for chunk in splitter.split_text(text) if chunk.strip()]


def ingest_document(
    document_id: str,
    title: str,
    category: str,
    allowed_roles: list[str],
    text: str,
) -> int:
    chunks = chunk_text(text)
    if not chunks:
        raise EmptyDocument("The document has no extractable text.")

    # Prefixing the title gives each chunk context about where it came from.
    vectors = embed_passages([f"{title}\n\n{chunk}" for chunk in chunks])

    vectorstore.ensure_indexes()
    vectorstore.replace_document_chunks(
        document_id,
        [
            {
                "document_id": document_id,
                "chunk_index": index,
                "title": title,
                "category": category,
                "allowed_roles": allowed_roles,
                "text": chunk,
                "embedding": vector,
            }
            for index, (chunk, vector) in enumerate(zip(chunks, vectors))
        ],
    )
    return len(chunks)
