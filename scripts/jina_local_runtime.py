# -*- coding: utf-8 -*-
"""Local Jina model runtime shared by ingestion and the local HTTP service."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import torch
from sentence_transformers import CrossEncoder, SentenceTransformer


ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_CACHE_DIR = Path(
    os.getenv("JINA_LOCAL_CACHE_DIR", ROOT_DIR / "data" / "jina_models")
)
EMBEDDING_MODEL_NAME = os.getenv(
    "JINA_EMBEDDING_MODEL", "jinaai/jina-embeddings-v3"
)
RERANKER_MODEL_NAME = os.getenv(
    "JINA_RERANKER_MODEL", "jinaai/jina-reranker-v2-base-multilingual"
)
DEVICE = os.getenv("JINA_LOCAL_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

_embedding_model: SentenceTransformer | None = None
_reranker_model: CrossEncoder | None = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        print(
            f"[Jina local] Loading {EMBEDDING_MODEL_NAME} on {DEVICE}...",
            flush=True,
        )
        _embedding_model = SentenceTransformer(
            EMBEDDING_MODEL_NAME,
            trust_remote_code=True,
            device=DEVICE,
            cache_folder=str(MODEL_CACHE_DIR),
        )
    return _embedding_model


def get_reranker_model() -> CrossEncoder:
    global _reranker_model
    if _reranker_model is None:
        MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        print(
            f"[Jina local] Loading {RERANKER_MODEL_NAME} on {DEVICE}...",
            flush=True,
        )
        _reranker_model = CrossEncoder(
            RERANKER_MODEL_NAME,
            trust_remote_code=True,
            device=DEVICE,
            max_length=1024,
        )
    return _reranker_model


def embed_texts(texts: list[str], task: str) -> list[list[float]]:
    model = get_embedding_model()
    # Recent SentenceTransformers versions validate model-specific kwargs and
    # reject ``max_length`` in encode(). Configure the model once instead.
    max_length = int(os.getenv("JINA_EMBED_MAX_LENGTH", "512"))
    if hasattr(model, "max_seq_length"):
        model.max_seq_length = max_length
    encoded = model.encode(
        texts,
        task=task,
        prompt_name=task,
        batch_size=int(os.getenv("JINA_EMBED_BATCH_SIZE", "8")),
        normalize_embeddings=True,
        convert_to_numpy=True,
        truncate_dim=1024,
        show_progress_bar=False,
    )
    return encoded.tolist()


def rerank_texts(query: str, documents: list[str]) -> list[float]:
    model = get_reranker_model()
    scores: Any = model.predict(
        [(query, document) for document in documents],
        batch_size=int(os.getenv("JINA_RERANK_BATCH_SIZE", "8")),
        show_progress_bar=False,
    )
    return [float(score) for score in scores]
