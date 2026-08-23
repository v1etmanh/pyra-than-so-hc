# -*- coding: utf-8 -*-
"""Small JSON-over-stdin bridge used by the Next.js server to query ChromaDB."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

import chromadb
import re
from jina_local_runtime import embed_texts


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


ROOT_DIR = Path(__file__).resolve().parent.parent
CHROMA_DATA_DIR = Path(
    os.getenv("CHROMA_DATA_DIR", ROOT_DIR / "data" / "chroma_db")
)
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "numerology_knowledge")
JINA_MODE = os.getenv("JINA_MODE", "api").strip().lower()
LOCAL_EMBEDDING_DIMENSIONS = 1024


class LocalHashEmbeddingFunction:
    """Must match the offline fallback used by ingest_to_chromadb.py."""

    def name(self) -> str:
        return "local-hash-1024"

    def __call__(self, input: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in input:
            vector = [0.0] * LOCAL_EMBEDDING_DIMENSIONS
            tokens = re.findall(r"[\wÀ-ỹ]+", text.lower(), flags=re.UNICODE)
            for token in tokens:
                hashed = 2166136261
                for char in token:
                    hashed ^= ord(char)
                    hashed = (hashed * 16777619) & 0xFFFFFFFF
                vector[hashed % LOCAL_EMBEDDING_DIMENSIONS] += 1.0
            magnitude = sum(value * value for value in vector) ** 0.5 or 1.0
            vectors.append([value / magnitude for value in vector])
        return vectors

    def embed_query(self, input: list[str]) -> list[list[float]]:
        return self(input)


def main() -> None:
    payload: dict[str, Any] = json.load(sys.stdin)
    client = chromadb.PersistentClient(path=str(CHROMA_DATA_DIR))
    collection = client.get_collection(
        name=COLLECTION_NAME,
        embedding_function=LocalHashEmbeddingFunction() if JINA_MODE == "hash" else None,
    )

    kwargs: dict[str, Any] = {
        "n_results": int(payload.get("top_k", 10)),
        "include": ["documents", "metadatas", "distances"],
    }
    where = payload.get("where")
    if where:
        kwargs["where"] = where

    if payload.get("query_embedding"):
        kwargs["query_embeddings"] = [payload["query_embedding"]]
    elif JINA_MODE == "local":
        kwargs["query_embeddings"] = [
            embed_texts([str(payload.get("query", ""))], "retrieval.query")[0]
        ]
    else:
        kwargs["query_texts"] = [str(payload.get("query", ""))]

    result = collection.query(**kwargs)
    documents = (result.get("documents") or [[]])[0]
    metadatas = (result.get("metadatas") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    ids = (result.get("ids") or [[]])[0]

    matches = []
    for index, document in enumerate(documents):
        distance = distances[index] if index < len(distances) else None
        matches.append(
            {
                "id": ids[index] if index < len(ids) else "",
                "document": document or "",
                "metadata": metadatas[index] if index < len(metadatas) else {},
                "distance": distance,
                "score": 1 - distance if isinstance(distance, (int, float)) else None,
            }
        )

    print(json.dumps({"matches": matches}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        raise
