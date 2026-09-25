"""AI service HTTP API. Only Laravel calls it, authenticated with the X-Internal-Key header."""

import logging
import os
import secrets
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app import vectorstore
from app.config import settings
from app.graph import run_chat
from app.ingest import EmptyDocument, UnreadableDocument, UnsupportedFileType, extract_text, ingest_document
from app.llm import LLMUnavailable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MIN_INTERNAL_KEY_LENGTH = 16


def check_internal_key(key: str) -> None:
    """An empty or placeholder key would let anyone call the service with any role, so refuse to start."""
    if len(key) < MIN_INTERNAL_KEY_LENGTH or key.startswith("change-me"):
        raise RuntimeError(
            f"AI_INTERNAL_KEY must be a random string of at least {MIN_INTERNAL_KEY_LENGTH} characters."
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    check_internal_key(settings.ai_internal_key)
    try:
        vectorstore.ensure_indexes()
    except Exception:  # Mongo may still be starting; ingest calls ensure_indexes again
        logger.exception("Could not ensure MongoDB indexes at startup")
    yield


app = FastAPI(title="Onboarding Assistant AI Service", lifespan=lifespan)


def require_internal_key(x_internal_key: str = Header(default="")) -> None:
    if not secrets.compare_digest(x_internal_key, settings.ai_internal_key):
        raise HTTPException(status_code=401, detail="Invalid internal key.")


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    role: str = Field(min_length=1, max_length=50)
    history: list[HistoryMessage] = []


class Source(BaseModel):
    document_id: str
    title: str


class ChatResponse(BaseModel):
    answer: str
    category: str
    sources: list[Source]


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "anthropic_key_configured": bool(os.environ.get("ANTHROPIC_API_KEY"))}


@app.post("/ingest", dependencies=[Depends(require_internal_key)])
def ingest(
    document_id: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    allowed_roles: str = Form(..., description="Comma-separated roles"),
    text: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
) -> dict:
    roles = [role.strip() for role in allowed_roles.split(",") if role.strip()]
    if not roles:
        raise HTTPException(status_code=422, detail="At least one allowed role is required.")

    try:
        if file is not None:
            content = extract_text(file.filename or "", file.file.read())
        elif text:
            content = text.strip()
        else:
            raise HTTPException(status_code=422, detail="Provide either a file or text.")

        chunk_count = ingest_document(document_id, title, category, roles, content)
    except UnsupportedFileType as error:
        raise HTTPException(status_code=415, detail=str(error)) from error
    except (EmptyDocument, UnreadableDocument) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return {"document_id": document_id, "chunks": chunk_count, "text": content}


@app.delete("/documents/{document_id}", dependencies=[Depends(require_internal_key)])
def delete_document(document_id: str) -> dict:
    return {"document_id": document_id, "deleted_chunks": vectorstore.delete_document_chunks(document_id)}


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(require_internal_key)])
def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = run_chat(
            question=request.question,
            role=request.role,
            history=[message.model_dump() for message in request.history],
        )
    except LLMUnavailable as error:
        logger.warning("LLM unavailable: %s", error)
        raise HTTPException(status_code=503, detail=str(error)) from error

    return ChatResponse(answer=result["answer"], category=result["category"], sources=result.get("sources", []))
