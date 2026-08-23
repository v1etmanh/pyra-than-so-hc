# -*- coding: utf-8 -*-
"""Local HTTP service for Jina Embeddings v3 and Jina Reranker v2."""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from typing import Any

from jina_local_runtime import embed_texts, get_embedding_model, rerank_texts


HOST = os.getenv("JINA_LOCAL_HOST", "127.0.0.1")
PORT = int(os.getenv("JINA_LOCAL_PORT", "5117"))
MODEL_LOCK = Lock()


class Handler(BaseHTTPRequestHandler):
    server_version = "NumerologyJinaLocal/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[Jina local] {format % args}", file=sys.stderr, flush=True)

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self) -> None:
        if self.path == "/health":
            self.send_json(
                200,
                {
                    "status": "ok",
                    "embedding_model": os.getenv(
                        "JINA_EMBEDDING_MODEL", "jinaai/jina-embeddings-v3"
                    ),
                    "reranker_model": os.getenv(
                        "JINA_RERANKER_MODEL",
                        "jinaai/jina-reranker-v2-base-multilingual",
                    ),
                    "embedding_dimensions": 1024,
                    "device": os.getenv("JINA_LOCAL_DEVICE", "auto"),
                },
            )
            return
        self.send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        try:
            payload = self.read_json()
            with MODEL_LOCK:
                if self.path == "/embed":
                    texts = [str(text) for text in payload.get("texts", [])]
                    task = str(payload.get("task", "retrieval.query"))
                    if not texts:
                        self.send_json(400, {"error": "texts is required"})
                        return
                    self.send_json(200, {"embeddings": embed_texts(texts, task)})
                    return

                if self.path == "/rerank":
                    query = str(payload.get("query", ""))
                    documents = [str(text) for text in payload.get("documents", [])]
                    if not query or not documents:
                        self.send_json(400, {"error": "query and documents are required"})
                        return
                    scores = rerank_texts(query, documents)
                    self.send_json(
                        200,
                        {
                            "results": [
                                {"index": index, "relevance_score": score}
                                for index, score in enumerate(scores)
                            ]
                        },
                    )
                    return

            self.send_json(404, {"error": "Not found"})
        except Exception as error:
            print(f"[Jina local] request failed: {error}", file=sys.stderr, flush=True)
            self.send_json(500, {"error": str(error)})


if __name__ == "__main__":
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    # Load the embedding model before advertising health, so readiness means
    # the first real retrieval request will not hit a cold model load.
    with MODEL_LOCK:
        get_embedding_model()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[Jina local] Listening on http://{HOST}:{PORT}", flush=True)
    server.serve_forever()
