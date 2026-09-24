"""Document chunks + vector search in MongoDB (Atlas Local / Atlas)."""

import logging
from functools import lru_cache

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.operations import SearchIndexModel

from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION = "doc_chunks"
VECTOR_INDEX = "doc_chunks_vector_index"


@lru_cache(maxsize=1)
def _client() -> MongoClient:
    return MongoClient(settings.mongodb_uri)


def chunks_collection() -> Collection:
    return _client()[settings.mongodb_db][COLLECTION]


def ensure_indexes() -> None:
    """Create the regular and vector indexes if they are missing (safe to call repeatedly)."""
    collection = chunks_collection()
    collection.create_index("document_id")  # also creates the collection if needed

    existing = {index["name"] for index in collection.list_search_indexes()}
    if VECTOR_INDEX in existing:
        return

    logger.info("Creating vector search index %s", VECTOR_INDEX)
    collection.create_search_index(
        SearchIndexModel(
            name=VECTOR_INDEX,
            type="vectorSearch",
            definition={
                "fields": [
                    {
                        "type": "vector",
                        "path": "embedding",
                        "numDimensions": settings.embedding_dims,
                        "similarity": "cosine",
                    },
                    {"type": "filter", "path": "allowed_roles"},
                    {"type": "filter", "path": "category"},
                    {"type": "filter", "path": "document_id"},
                ]
            },
        )
    )


def replace_document_chunks(document_id: str, chunks: list[dict]) -> None:
    collection = chunks_collection()
    collection.delete_many({"document_id": document_id})
    if chunks:
        collection.insert_many(chunks)


def delete_document_chunks(document_id: str) -> int:
    return chunks_collection().delete_many({"document_id": document_id}).deleted_count


def search(query_vector: list[float], role: str, limit: int) -> list[dict]:
    """Nearest chunks the given role is allowed to see. The role filter is how access control is enforced."""
    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": limit * 20,
                "limit": limit,
                "filter": {"allowed_roles": {"$in": [role]}},
            }
        },
        {
            "$project": {
                "_id": 0,
                "document_id": 1,
                "title": 1,
                "category": 1,
                "text": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]
    return list(chunks_collection().aggregate(pipeline))
