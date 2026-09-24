"""Local embeddings with fastembed (ONNX, no GPU or API key needed)."""

from functools import lru_cache

from fastembed import TextEmbedding

from app.config import settings


@lru_cache(maxsize=1)
def _model() -> TextEmbedding:
    # Downloads the model on first use (~130 MB), then loads it from the cache volume.
    return TextEmbedding(model_name=settings.embedding_model, cache_dir=settings.embedding_cache_dir)


def embed_passages(texts: list[str]) -> list[list[float]]:
    return [vector.tolist() for vector in _model().passage_embed(texts)]


def embed_query(text: str) -> list[float]:
    return next(iter(_model().query_embed(text))).tolist()
