# -*- coding: utf-8 -*-
"""
Direct Migration Script: ChromaDB -> Supabase pgvector.
Transfers all 540 vector chunks, metadata, and pre-computed 1024d embeddings
from local ChromaDB (data/chroma_db) to Supabase table `numerology_chunks`.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import chromadb
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent
CHROMA_DATA_DIR = Path(os.getenv("CHROMA_DATA_DIR", ROOT_DIR / "data" / "chroma_db"))
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "numerology_knowledge")
BATCH_SIZE = 50


def load_env() -> dict[str, str]:
    """Parse .env and .env.local files manually."""
    env_vars = {}
    for env_file in [ROOT_DIR / ".env", ROOT_DIR / ".env.local"]:
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars


def main() -> None:
    print("=" * 60)
    print("🚀 Bắt đầu di trú dữ liệu từ ChromaDB sang Supabase pgvector")
    print("=" * 60)

    env_vars = load_env()
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", env_vars.get("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", env_vars.get("SUPABASE_SERVICE_ROLE_KEY", ""))

    if not supabase_url or not service_key:
        print("❌ LỖI: Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env")
        sys.exit(1)

    print(f"📡 Supabase URL: {supabase_url}")

    # 1. Đọc dữ liệu từ ChromaDB
    if not CHROMA_DATA_DIR.exists():
        print(f"❌ LỖI: Thư mục ChromaDB không tồn tại: {CHROMA_DATA_DIR}")
        sys.exit(1)

    print(f"📂 Đang tải dữ liệu từ ChromaDB collection '{COLLECTION_NAME}'...")
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DATA_DIR))
    collection = chroma_client.get_collection(name=COLLECTION_NAME)

    total_chunks = collection.count()
    print(f"📊 Tìm thấy tổng cộng: {total_chunks} chunks trong ChromaDB.")

    if total_chunks == 0:
        print("⚠️ ChromaDB rỗng. Không có dữ liệu để di trú.")
        sys.exit(0)

    all_data = collection.get(include=["metadatas", "documents", "embeddings"])
    ids = all_data["ids"]
    docs = all_data["documents"]
    metas = all_data["metadatas"]
    embeddings = all_data["embeddings"]

    # 2. Chuẩn bị records cho Supabase
    records: list[dict[str, Any]] = []
    for i in range(len(ids)):
        chunk_id = ids[i]
        doc_text = docs[i]
        meta = metas[i] or {}
        raw_emb = embeddings[i] if embeddings is not None else None
        embedding = raw_emb.tolist() if hasattr(raw_emb, "tolist") else raw_emb

        record = {
            "id": str(chunk_id),
            "doc_id": str(meta.get("doc_id", chunk_id)),
            "source_file": str(meta.get("source_file", "")),
            "category": str(meta.get("category", "daily_decision")),
            "indicator_key": str(meta.get("indicator_key", "dailyDecision")),
            "indicator_name": str(meta.get("indicator_name", "")),
            "number_value": str(meta.get("number_value", "")),
            "question_id": str(meta.get("question_id", "")),
            "decision_category": str(meta.get("decision_category", "")),
            "personal_day": str(meta.get("personal_day", "")),
            "safety_level": str(meta.get("safety_level", "low")),
            "requires_disclaimer": bool(meta.get("requires_disclaimer", False)),
            "content_version": str(meta.get("content_version", "")),
            "title": str(meta.get("title", "")),
            "content": str(doc_text),
            "keywords": str(meta.get("keywords", "")),
            "chunk_index": int(meta.get("chunk_index", 0)),
            "metadata": meta,
            "embedding": embedding,
        }
        records.append(record)

    # 3. Đẩy lên Supabase theo Batch
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    endpoint = f"{supabase_url}/rest/v1/numerology_chunks"

    print(f"\n📤 Bắt đầu nạp {len(records)} records lên bảng 'numerology_chunks' (Batch size = {BATCH_SIZE})...")

    success_count = 0
    start_time = time.time()

    for start_idx in range(0, len(records), BATCH_SIZE):
        end_idx = min(start_idx + BATCH_SIZE, len(records))
        batch = records[start_idx:end_idx]

        response = requests.post(
            endpoint,
            headers=headers,
            json=batch,
            timeout=60,
        )

        if not response.ok:
            print(f"❌ Lỗi ở batch [{start_idx + 1} - {end_idx}]: HTTP {response.status_code}")
            print(f"   Chi tiết: {response.text}")
            sys.exit(1)

        success_count += len(batch)
        print(f"  ✓ Đã nạp thành công [{start_idx + 1} - {end_idx}] / {len(records)} chunks")

    elapsed = time.time() - start_time
    print(f"\n🎉 HOÀN TẤT DI TRÚ: {success_count}/{len(records)} chunks đã được lưu trên Supabase ({elapsed:.2f}s)!")

    # 4. Kiểm tra đối soát trực tiếp trên Supabase
    count_resp = requests.get(
        f"{supabase_url}/rest/v1/numerology_chunks?select=id",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Range-Unit": "items",
            "Prefer": "count=exact",
        },
        timeout=15,
    )
    content_range = count_resp.headers.get("content-range", "")
    print(f"🔍 Đối soát số lượng trong bảng 'numerology_chunks': {content_range}")


if __name__ == "__main__":
    main()
