# -*- coding: utf-8 -*-
"""Ingest the Markdown numerology knowledge base into local ChromaDB.

Usage:
    python scripts/ingest_to_chromadb.py
    python scripts/ingest_to_chromadb.py --reset

By default, documents use the local Jina Embeddings v3 model (1024 dims).
Set JINA_MODE=api to use the Jina API, or JINA_MODE=hash for an offline smoke
test without downloading a model.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import chromadb
import requests
import yaml

ROOT_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))



KNOWLEDGE_DIR = Path(os.getenv("KNOWLEDGE_DIR", ROOT_DIR / "knowledge"))
CHROMA_DATA_DIR = Path(
    os.getenv("CHROMA_DATA_DIR", ROOT_DIR / "data" / "chroma_db")
)
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "numerology_knowledge")
JINA_MODE = os.getenv("JINA_MODE", "api").strip().lower()
JINA_API_KEY = os.getenv("JINA_API_KEY", "").strip()
JINA_BATCH_SIZE = int(os.getenv("JINA_INGEST_BATCH_SIZE", "50"))
LOCAL_EMBEDDING_DIMENSIONS = 1024


class LocalHashEmbeddingFunction:
    """Small offline fallback embedding for development and smoke tests."""

    def name(self) -> str:
        return "local-hash-1024"

    def __call__(self, input: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in input:
            vector = [0.0] * LOCAL_EMBEDDING_DIMENSIONS
            normalized = text.lower()
            tokens = re.findall(r"[\wÀ-ỹ]+", normalized, flags=re.UNICODE)
            for token in tokens:
                # Stable FNV-1a style hash; Python's hash() is process-randomized.
                hashed = 2166136261
                for char in token:
                    hashed ^= ord(char)
                    hashed = (hashed * 16777619) & 0xFFFFFFFF
                vector[hashed % LOCAL_EMBEDDING_DIMENSIONS] += 1.0
            magnitude = sum(value * value for value in vector) ** 0.5 or 1.0
            vectors.append([value / magnitude for value in vector])
        return vectors


def parse_markdown_file(filepath: Path) -> tuple[dict[str, Any], str] | None:
    raw = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.DOTALL)
    if not match:
        return None

    frontmatter = yaml.safe_load(match.group(1)) or {}
    body = match.group(2).strip()
    if not isinstance(frontmatter, dict) or not body:
        return None
    return frontmatter, body


def metadata_value(value: Any) -> str | int | float | bool:
    """Chroma metadata values must be scalar values."""
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    return str(value)


def build_chunks() -> tuple[list[str], list[dict[str, Any]], list[str]]:
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []
    ids: list[str] = []

    for filepath in sorted(KNOWLEDGE_DIR.glob("*.md")):
        if filepath.name.endswith("_all.md"):
            continue

        parsed = parse_markdown_file(filepath)
        if not parsed:
            print(f"[skip] Missing frontmatter: {filepath.name}")
            continue

        frontmatter, body = parsed
        doc_id = str(frontmatter.get("id", filepath.stem))
        title = str(frontmatter.get("title", filepath.stem))
        keywords = frontmatter.get("keywords", [])
        keyword_text = ", ".join(str(item) for item in keywords) if isinstance(keywords, list) else str(keywords)

        category = str(frontmatter.get("category", "unknown"))

        # For daily_decision, the document is already a compact, focused unit (~1KB).
        # Ingesting the full body ensures the question, recommendation, and practical
        # steps remain intact in a single retrieval chunk.
        if category == "daily_decision":
            sections = [body]
        else:
            # Each H2 is a focused semantic chunk for standard long-form guides.
            sections = re.split(r"\n(?=##\s+)", body)

        for chunk_index, section in enumerate(sections):
            section = section.strip()
            if len(section) < 50:
                continue

            chunk_id = f"{doc_id}_chunk_{chunk_index}"
            metadata = {
                "doc_id": doc_id,
                "source_file": filepath.name,
                "category": metadata_value(category),
                "indicator_key": metadata_value(frontmatter.get("indicator_key", "unknown")),
                "indicator_name": metadata_value(frontmatter.get("indicator_name", "")),
                "number_value": metadata_value(frontmatter.get("number_value", "")),
                # Daily Decision-specific fields. Keep them as scalar values so
                # ChromaDB can filter by intent, personal day, and safety level.
                "question_id": metadata_value(frontmatter.get("question_id", "")),
                "decision_category": metadata_value(frontmatter.get("decision_category", "")),
                "personal_day": metadata_value(frontmatter.get("personal_day", frontmatter.get("number_value", ""))),
                "safety_level": metadata_value(frontmatter.get("safety_level", "low")),
                "requires_disclaimer": metadata_value(frontmatter.get("requires_disclaimer", False)),
                "content_version": metadata_value(frontmatter.get("content_version", "")),
                "title": title,
                "keywords": keyword_text,
                "chunk_index": chunk_index,
            }
            documents.append(section)
            metadatas.append(metadata)
            ids.append(chunk_id)

    return documents, metadatas, ids


def jina_embeddings(texts: list[str]) -> list[list[float]]:
    response = requests.post(
        "https://api.jina.ai/v1/embeddings",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {JINA_API_KEY}",
        },
        json={
            "model": "jina-embeddings-v3",
            "task": "retrieval.passage",
            "dimensions": 1024,
            "late_chunking": False,
            "input": texts,
        },
        timeout=90,
    )
    response.raise_for_status()
    payload = response.json()
    return [item["embedding"] for item in payload["data"]]


def create_embeddings(texts: list[str]) -> list[list[float]]:
    if JINA_MODE == "local":
        from jina_local_runtime import embed_texts
        return embed_texts(texts, "retrieval.passage")
    if JINA_MODE == "api":
        if not JINA_API_KEY:
            raise SystemExit("JINA_MODE=api requires JINA_API_KEY")
        return jina_embeddings(texts)
    return LocalHashEmbeddingFunction()(texts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Remove the local ChromaDB directory before ingesting.",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Skip document IDs that already exist in the collection.",
    )
    args = parser.parse_args()

    if not KNOWLEDGE_DIR.exists():
        raise SystemExit(f"Knowledge directory not found: {KNOWLEDGE_DIR}")

    if args.reset and CHROMA_DATA_DIR.exists():
        shutil.rmtree(CHROMA_DATA_DIR)

    CHROMA_DATA_DIR.mkdir(parents=True, exist_ok=True)
    documents, metadatas, ids = build_chunks()
    if not documents:
        raise SystemExit("No valid Markdown chunks found.")

    client = chromadb.PersistentClient(path=str(CHROMA_DATA_DIR))
    embedding_mode = {
        "local": "jina-embeddings-v3-local",
        "api": "jina-embeddings-v3-api",
        "hash": "local-hash-1024",
    }.get(JINA_MODE)
    if not embedding_mode:
        raise SystemExit("JINA_MODE must be one of: local, api, hash")
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={
            "hnsw:space": "cosine",
            "embedding_provider": embedding_mode,
            "embedding_dimensions": 1024,
        },
        embedding_function=LocalHashEmbeddingFunction() if JINA_MODE == "hash" else None,
    )

    existing_mode = (collection.metadata or {}).get("embedding_provider")
    if existing_mode and existing_mode != embedding_mode:
        raise SystemExit(
            f"Embedding mode mismatch: collection uses {existing_mode}, "
            f"but current environment uses {embedding_mode}. Re-run with --reset."
        )

    if args.resume and collection.count() > 0:
        existing_ids = set(collection.get()["ids"])
        pending = [
            (document, metadata, doc_id)
            for document, metadata, doc_id in zip(documents, metadatas, ids)
            if doc_id not in existing_ids
        ]
        documents = [item[0] for item in pending]
        metadatas = [item[1] for item in pending]
        ids = [item[2] for item in pending]
        print(f"Resume mode: skipping {len(existing_ids)} existing chunks")

    print(f"Ingesting {len(documents)} chunks into {CHROMA_DATA_DIR}")
    print(f"Embedding mode: {embedding_mode}")

    for start in range(0, len(documents), JINA_BATCH_SIZE):
        end = min(start + JINA_BATCH_SIZE, len(documents))
        batch_documents = documents[start:end]
        batch_metadatas = metadatas[start:end]
        batch_ids = ids[start:end]

        embed_inputs = [
            f"Title: {metadata['title']}\nKeywords: {metadata['keywords']}\n\n{document}"
            for document, metadata in zip(batch_documents, batch_metadatas)
        ]
        collection.upsert(
            ids=batch_ids,
            documents=batch_documents,
            metadatas=batch_metadatas,
            embeddings=create_embeddings(embed_inputs),
        )

        print(f"  [ok] batch {start + 1}-{end}")

    print(f"Done. ChromaDB collection count: {collection.count()}")


if __name__ == "__main__":
    main()
