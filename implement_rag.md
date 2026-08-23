# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG RAG THẦN SỐ HỌC (BẢN DEMO CHROMADB)

> **Phạm vi chính thức:** Dự án chỉ triển khai một RAG Q&A duy nhất: người dùng đặt câu hỏi → hệ thống truy xuất tri thức → rerank/context → AI trả lời. Daily Decision, rewarded ads/unlock và các RAG chuyên biệt khác là ngoài scope; các file liên quan chỉ được giữ lại như tài liệu lịch sử.

Tài liệu này hướng dẫn chi tiết kiến trúc, mã nguồn và các bước triển khai hệ thống **Retrieval-Augmented Generation (RAG)** cho dự án **Numerology Web App** ở giai đoạn **Demo**:
- 🗄 **Vector Database (Demo):** Sử dụng **ChromaDB** chạy cục bộ (Persistent Local Storage), không phụ thuộc cloud, tốc độ tìm kiếm < 5ms.
- 🧬 **Embedding & Reranker:** **Jina AI Embeddings v3 (1024 dims)** + **Jina Reranker v2 (Multilingual)**.
- ⚡ **Multi-Provider LLM Fallback Cascade:** Ưu tiên **Google Gemini (Primary)** ➔ **NVIDIA NIM (Fallback 1)** ➔ **Grok / xAI (Fallback 2)** ➔ **OpenRouter Free Tier (Fallback 3)**.
- 🎨 **Tích hợp Visual Art:** Liên kết 205 bức tranh nghệ thuật AI từ `public/images/numerology/` vào giao diện.

---

## 1. SƠ ĐỒ KIẾN TRÚC TOÀN DIỆN (SYSTEM ARCHITECTURE)

```
                              ┌─────────────────────────────┐
                              │      Người Dùng Đặt Câu Hỏi │
                              │ "Đường đời 11 hợp nghề gì?" │
                              └──────────────┬──────────────┘
                                             │
                                             ▼
                 ┌─────────────────────────────────────────────────────────────┐
                 │ 1. Metadata Router & Query Processor                        │
                 │    - Trích xuất: category='life_path', number_value='11'    │
                 │    - Embed truy vấn qua Jina Embeddings v3 (1024 dims)      │
                 └───────────────────────────┬─────────────────────────────────┘
                                             │
                                             ▼
                 ┌─────────────────────────────────────────────────────────────┐
                 │ 2. ChromaDB Local Vector Search                             │
                 │    - Lọc Metadata Filter: where={"number_value": "11"}      │
                 │    - Vector Cosine Similarity Search: Top 10 Chunks         │
                 └───────────────────────────┬─────────────────────────────────┘
                                             │
                                             ▼
                 ┌─────────────────────────────────────────────────────────────┐
                 │ 3. Jina Reranker v2 (Multilingual Precision Filter)         │
                 │    - So khớp chéo (Cross-attention) Query & 10 Chunks       │
                 │    - Chọn lọc Top 3 Chunks tri thức đắt giá & chuẩn nhất    │
                 └───────────────────────────┬─────────────────────────────────┘
                                             │ (Bối cảnh tri thức chuẩn 100%)
                                             ▼
                 ┌─────────────────────────────────────────────────────────────┐
                 │ 4. Multi-Provider Fallback Cascade Engine                   │
                 │                                                             │
                 │    [Primary: Google Gemini] ──► (Lỗi 429/Hết Quota?)       │
                 │         │ (Thành công)                 │ (Chuyển tiếp)      │
                 │         │                              ▼                    │
                 │         │                   [Fallback 1: NVIDIA NIM]        │
                 │         │                              │ (Lỗi 429/Hết Quota)│
                 │         │                              ▼                    │
                 │         │                   [Fallback 2: Grok / xAI]        │
                 │         │                              │ (Lỗi/Hết Quota)    │
                 │         │                              ▼                    │
                 │         │                   [Fallback 3: OpenRouter Free]   │
                 │         ▼                              ▼                    │
                 │    [Stream SSE Response] ◄─────────────┘                    │
                 └───────────────────────────┬─────────────────────────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │ Giao diện Chatbot AI & Card │
                              └─────────────────────────────┘
```

---

## 2. CẤU TRÚC DỮ LIỆU CHROMADB (LOCAL STORAGE)

- **Vị trí lưu trữ Persistent:** `data/chroma_db/`
- **Collection Name:** `numerology_knowledge`
- **Metadata Schema:**
  ```json
  {
    "id": "numerology-lifepath-11",
    "category": "life_path_number",
    "indicator_key": "walksOfLife",
    "number_value": "11",
    "title": "Ngọn Hải Đăng Tâm Linh Của Con Số Đường Đời 11",
    "keywords": "đường đời 11, life path 11, số chủ đạo 11, master 11"
  }
  ```

---

## 3. SCRIPT NẠP KHO TRI THỨC VÀO CHROMADB

File script: [`scripts/ingest_to_chromadb.py`](file:///c:/Users/Admin/.gemini/antigravity/scratch/NumerologyWebApp/scripts/ingest_to_chromadb.py)

```python
# -*- coding: utf-8 -*-
"""
Script đọc kho file Markdown trong knowledge/, tách metadata & chunking,
gọi Jina Embeddings v3 và nạp trực tiếp vào ChromaDB local.
"""
import os
import glob
import re
import json
import chromadb
from chromadb.config import Settings
import requests

ROOT_DIR = os.path.abspath(os.path.join(os.getcwd()))
KNOWLEDGE_DIR = os.path.join(ROOT_DIR, "knowledge")
CHROMA_DATA_DIR = os.path.join(ROOT_DIR, "data", "chroma_db")
os.makedirs(CHROMA_DATA_DIR, exist_ok=True)

JINA_API_KEY = os.getenv("JINA_API_KEY", "")

def get_jina_embeddings(texts):
    if not JINA_API_KEY:
        # Fallback if no Jina key is present: use ChromaDB default internal embedding
        return None
    url = "https://api.jina.ai/v1/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JINA_API_KEY}"
    }
    payload = {
        "model": "jina-embeddings-v3",
        "task": "retrieval.passage",
        "dimensions": 1024,
        "input": texts
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return [item["embedding"] for item in data["data"]]

def ingest_knowledge():
    client = chromadb.PersistentClient(path=CHROMA_DATA_DIR)
    
    # Tạo hoặc lấy collection
    collection = client.get_or_create_collection(
        name="numerology_knowledge",
        metadata={"hnsw:space": "cosine"}
    )

    md_files = [f for f in glob.glob(os.path.join(KNOWLEDGE_DIR, "*.md")) if not f.endswith("_all.md")]
    print(f"Bắt đầu nạp {len(md_files)} tài liệu Markdown vào ChromaDB...")

    documents = []
    metadatas = []
    ids = []

    for filepath in md_files:
        with open(filepath, "r", encoding="utf-8") as f:
            raw = f.read()

        fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.DOTALL)
        if not fm_match:
            continue

        fm_raw, body = fm_match.group(1), fm_match.group(2)
        meta = {}
        for line in fm_raw.splitlines():
            kv = re.match(r"^([a-zA-Z0-9_]+):\s*(.*)$", line.strip())
            if kv:
                k, v = kv.group(1), kv.group(2).strip().strip('"').strip("'")
                meta[k] = v

        doc_id = meta.get("id", os.path.basename(filepath).replace(".md", ""))
        
        # Chia nhỏ document theo các H2 sections để tạo semantic chunks
        sections = re.split(r"\n(?=##\s+)", body)
        for i, sec in enumerate(sections):
            sec_text = sec.strip()
            if len(sec_text) < 50:
                continue
            chunk_id = f"{doc_id}_chunk_{i}"
            chunk_meta = {
                "doc_id": doc_id,
                "category": meta.get("category", "unknown"),
                "indicator_key": meta.get("indicator_key", "unknown"),
                "number_value": str(meta.get("number_value", "")),
                "title": meta.get("title", ""),
                "keywords": str(meta.get("keywords", "")),
                "chunk_index": i
            }
            documents.append(sec_text)
            metadatas.append(chunk_meta)
            ids.append(chunk_id)

    print(f"Tổng số chunks tạo ra: {len(documents)}")
    
    # Nạp theo batch 50 items
    batch_size = 50
    for b in range(0, len(documents), batch_size):
        b_docs = documents[b:b+batch_size]
        b_metas = metadatas[b:b+batch_size]
        b_ids = ids[b:b+batch_size]

        embeddings = get_jina_embeddings(b_docs)
        if embeddings:
            collection.upsert(ids=b_ids, documents=b_docs, metadatas=b_metas, embeddings=embeddings)
        else:
            collection.upsert(ids=b_ids, documents=b_docs, metadatas=b_metas)

        print(f"  ✓ Đã nạp batch [{b+1} - {min(b+batch_size, len(documents))}]")

    print(f"\n🎉 HOÀN TẤT! ChromaDB hiện chứa: {collection.count()} chunks vector.")

if __name__ == "__main__":
    ingest_knowledge()
```

---

## 4. BỘ ĐIỀU PHỐI MULTI-PROVIDER LLM FALLBACK CASCADE

File module: [`app/api/chat/lib/provider-cascade.ts`](file:///c:/Users/Admin/.gemini/antigravity/scratch/NumerologyWebApp/app/api/chat/lib/provider-cascade.ts)

### Danh sách Provider & biến môi trường model:
1. **Primary: Google Gemini**
   - Base URL: `https://generativelanguage.googleapis.com/v1beta/openai`
   - Model: biến `GEMINI_CHAT_MODELS` (nhiều model phân tách bằng dấu phẩy)
   - Key: `GEMINI_API_KEY`, `GEMINI_API_KEYS` hoặc các biến Google tương ứng
2. **Fallback 1: NVIDIA NIM (Build.nvidia.com)**
   - Base URL: `https://integrate.api.nvidia.com/v1`
   - Model: `NVIDIA_CHAT_MODELS` hoặc `NVIDIA_CHAT_MODEL`
   - Key: `NVIDIA_API_KEY`
3. **Fallback 2: Grok / xAI (api.x.ai)**
   - Base URL: `https://api.x.ai/v1`
   - Model: `XAI_CHAT_MODELS` hoặc `XAI_CHAT_MODEL`
   - Key: `XAI_API_KEY`
4. **Fallback 3: OpenRouter Free Tier (openrouter.ai)**
   - Base URL: `https://openrouter.ai/api/v1`
   - Model: `OPENROUTER_FREE_MODELS` hoặc `OPENROUTER_FREE_MODEL` (ưu tiên), có thể dùng `OPENROUTER_CHAT_MODELS`
   - Key: `OPENROUTER_API_KEY`

Ví dụ thay model OpenRouter Free mà không sửa code:

```env
OPENROUTER_FREE_MODELS=deepseek/deepseek-r1:free,meta-llama/llama-3.3-70b-instruct:free
```

### Thuật toán Failover thông minh:
```typescript
for (const provider of PROVIDER_TIERS) {
  for (const apiKey of provider.keys) {
    try {
      const stream = await callLLMStream(provider, apiKey, messages);
      return stream; // Kết nối thành công!
    } catch (err: any) {
      if (err.status === 429 || err.status === 402 || err.code === 'ECONNRESET') {
        console.warn(`[Fallback] ${provider.name} gặp lỗi (${err.status}), tự động chuyển sang Provider tiếp theo...`);
        continue; // Thử key tiếp theo hoặc nhảy sang Provider kế tiếp
      }
    }
  }
}
```

---

## 5. TÍCH HỢP GIAO DIỆN VỚI 205 BỨC TRANH NGHỆ THUẬT AI

### Helper Ánh Xạ Tranh (tùy chọn, không phải pipeline RAG)
```typescript
export function getNumerologyArtUrl(indicatorKey: string, value: string | number): string {
  const v = String(value).replace('/', '_');
  const mapping: Record<string, string> = {
    walksOfLife: `/images/numerology/lifepath/lifepath_${v}.png`,
    mission: `/images/numerology/mission/mission_${v}.png`,
    soul: `/images/numerology/soul/soul_${v}.png`,
    personality: `/images/numerology/personality/personality_${v}.png`,
    dateOfBirth: `/images/numerology/birthday/birthday_${v}.png`,
    mature: `/images/numerology/maturity/maturity_${v}.png`,
    balance: `/images/numerology/balance/balance_${v}.png`,
    rationalThinking: `/images/numerology/rational/rational_${v}.png`,
    subconscious: `/images/numerology/subconscious/subconscious_${v}.png`,
    passion: `/images/numerology/passion/passion_${v}.png`,
    attitude: `/images/numerology/attitude/attitude_${v}.png`,
    karmicDebts: `/images/numerology/karmic/karmic_${v}.png`,
    missingNumbers: `/images/numerology/missing/missing_${v}.png`,
    yearIndividual: `/images/numerology/year/year_${v}.png`,
    monthIndividual: `/images/numerology/month/month_${v}.png`,
    dayIndividual: `/images/numerology/day/day_${v}.png`,
  };
  return mapping[indicatorKey] || `/images/numerology/lifepath/lifepath_1.png`;
}
```

---

## 6. LỘ TRÌNH THỰC THI (IMPLEMENTATION CHECKLIST)

- [x] **Bước 1:** Chuẩn hóa kho file Markdown numerology trong `knowledge/`.
- [x] **Bước 2:** Sinh hoàn tất 205 bức ảnh AI chất lượng cao tại `public/images/numerology/`.
- [ ] **Bước 3:** Chạy `python scripts/ingest_to_chromadb.py` để tạo và nạp database ChromaDB cục bộ.
- [x] **Bước 4:** Xây dựng module `provider-cascade.ts` hỗ trợ xoay vòng NVIDIA NIM, Grok, OpenRouter, Gemini.
- [x] **Bước 5:** Cập nhật `retrieval-service.ts` để kết nối ChromaDB + Jina Reranker v2.
- [ ] **Bước 6:** Gắn tranh AI vào `DisplayCard.tsx` và tạo `IndicatorDetailModal.tsx`.
- [ ] **Bước 7:** Khởi chạy `pnpm dev` và kiểm thử toàn diện!
