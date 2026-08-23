# 🌌 An Nhiên Numerology - Nền Tảng Thần Số Học & Trợ Lý Chữa Lành AI
> *Khám phá bản đồ số học và đặt câu hỏi để nhận câu trả lời dựa trên kho tri thức cùng AI.*

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI-2.10-teal?style=for-the-badge&logo=chakraui)](https://chakra-ui.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Python RAG](https://img.shields.io/badge/RAG_Engine-ChromaDB_%2B_Jina-orange?style=for-the-badge&logo=python)](https://python.org/)
[![AI Image Engine](https://img.shields.io/badge/AI_Image-FLUX_8K_%2B_Subnp_Magic-pink?style=for-the-badge&logo=openai)](https://image.pollinations.ai)

---

## 🌟 GIỚI THIỆU DỰ ÁN

**An Nhiên Numerology** là nền tảng ứng dụng Thần số học (Nhân số học Pythagoras & Chaldean) hiện đại, được xây dựng với triết lý **"Quiet Luxury & Healing"** (Sang trọng thầm lặng và Chữa lành). Người dùng nhập thông tin bản thân hoặc đặt câu hỏi; hệ thống truy xuất tri thức numerology liên quan rồi dùng AI để tạo câu trả lời có ngữ cảnh.

### Phạm vi sản phẩm hiện tại

Dự án chỉ có **một pipeline RAG duy nhất**: `user question → retrieval → reranking/context → AI answer`. Daily Decision, rewarded ads/unlock và các pipeline RAG riêng khác không thuộc phạm vi sản phẩm hiện tại. Các tài liệu hoặc dữ liệu Daily Decision còn trong repository được giữ lại như tài liệu lịch sử/ngoài phạm vi, không phải chức năng cần triển khai.

---

## 🔮 HỆ THỐNG TÍNH NĂNG NỔI BẬT

```
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │                        AN NHIÊN NUMEROLOGY ECOSYSTEM                             │
   ├──────────────────────────────┬──────────────────────────────┬────────────────────┤
   │ 📊 1. TRA CỨU BẢN MỆNH       │ 🔍 2. RAG HỎI ĐÁP DUY NHẤT   │ 🎨 3. STUDIO HÌNH  │
   │ • Trọn bộ 24 Chỉ số Pitago   │ • Search kho tri thức         │   NỀN MAY MẮN AI   │
   │ • 4 Đỉnh cao Kim Tự Tháp     │ • Trả lời theo ngữ cảnh       │ • Dual-Engine FLUX │

   │ • Biểu đồ ngày sinh & Mũi tên│ • Context theo hồ sơ        │ • 9 Cung bản mệnh  │
   ├──────────────────────────────┼──────────────────────────────┼────────────────────┤
   │ 📝 4. BÀI KHẢO SÁT TÍNH CÁCH │ 📚 5. KHO TRI THỨC SỐ HỌC     │ 💬 6. TRỢ LÝ AI &  │
   │ • Trắc nghiệm chuyên sâu     │ • Tra cứu bách khoa 1-33     │   KHAI VẤN 1-1     │
   │ • Phân tích điểm mạnh / yếu  │ • Đối chiếu hòa hợp tình yêu │ • Chatbot Pyra AI  │
   │ • Lộ trình chuyển hóa tâm    │ • Tìm kiếm sim, tên hợp tuổi │ • Đặt lịch WhatsApp│
   └──────────────────────────────┴──────────────────────────────┴────────────────────┘
```

---

### 1️⃣ 🔐 Quản Lý Hồ Sơ & Lưu Trữ Đa Người Dùng (Multi-Profile Management)
* **Lưu đa hồ sơ tiện lợi**: Cho phép lưu trữ và chuyển đổi nhanh giữa nhiều hồ sơ (Bản thân, Người yêu, Vợ/Chồng, Con cái, Đối tác kinh doanh, Bạn bè) trực tiếp trên trình duyệt hoặc đồng bộ tài khoản.
* **Bảo mật & Tốc độ**: Dữ liệu hồ sơ được mã hóa và lưu trữ cục bộ (`localStorage` / IndexedDB), đảm bảo riêng tư tuyệt đối cho người dùng.

---

### 2️⃣ 🔮 Tra Cứu Thần Số Học Toàn Diện (Full 24 Indicators Matrix)
* **Trọn bộ 24 chỉ số năng lượng chuyên sâu**:
  * **5 Chỉ số cốt lõi (Core 5)**:
    1. *Số Đường Đời (Life Path)*: Bản đồ định hướng cuộc đời.
    2. *Số Sứ Mệnh (Mission / Destiny)*: Mục đích sống tối thượng.
    3. *Số Linh Hồn (Soul Urge)*: Khát khao nội tâm sâu kín.
    4. *Số Nhân Cách (Personality)*: Hình ảnh phản chiếu ra xã hội.
    5. *Số Ngày Sinh (Birthday Number)*: Tài năng bẩm sinh được vũ trụ trao tặng.
  * **6 Chỉ số bổ trợ & Hành vi**:
    6. *Số Trưởng Thành (Maturity)*: Năng lượng đỉnh cao nửa sau cuộc đời.
    7. *Số Cân Bằng (Balance)*: Cách phản ứng và giữ tâm tĩnh tại trước biến cố.
    8. *Số Tư Duy Lý Trí (Rational Thought)*: Phương thức tư duy logic và ra quyết định.
    9. *Sức Mạnh Tiềm Thức (Subconscious Power)*: Sức bật tinh thần khi đối mặt khủng hoảng.
    10. *Đam Mê Ẩn Giấu (Hidden Passion)*: Ngọn lửa say mê tiềm tàng trong tâm thức.
    11. *Thái Độ Tiếp Cận (Attitude)*: Phản xạ đầu tiên khi tiếp xúc với thế giới bên ngoài.
  * **2 Chỉ số Nghiệp quả (Karmic Matrix)**:
    12. *Con Số Nợ Nghiệp (Karmic Debts)*: Các món nợ bài học tiền kiếp (13/4, 14/5, 16/7, 19/1).
    13. *Bài Học Số Thiếu (Karmic Lessons / Missing Numbers)*: Những con số còn khuyết trong tên cần tôi luyện.
  * **3 Cầu Nối Năng Lượng (Energy Bridges)**:
    14. *Cầu Nối Đường Đời & Sứ Mệnh (Bridge Life Path - Mission)*.
    15. *Cầu Nối Linh Hồn & Nhân Cách (Bridge Soul - Personality)*.
    16. *Cầu Nối Trưởng Thành & Đam Mê (Bridge Maturity - Passion)*.
  * **5 Chỉ số Chu kỳ & Cột mốc Vận mệnh**:
    17. *Năm Cá Nhân (Personal Year)*.
    18. *Tháng Cá Nhân (Personal Month)*.
    19. *Ngày Cá Nhân (Personal Day)*.
    20. *4 Đỉnh Cao Cuộc Đời (4 Pinnacles / Way)*.
    21. *4 Thách Thức Cuộc Đời (4 Challenges)*.
  * **3 Hệ thống Ma trận & Biểu đồ hình học**:
    22. *8 Mũi Tên Cá Tính (Arrows of Individuality)* trên biểu đồ ngày sinh 3x3.
    23. *Biểu Đồ Tên & Tần Suất Ký Tự (Name Chart Matrix)*.
    24. *Biểu Đồ Ngày Sinh 3x3 (Birth Chart Matrix)*.


---

### 3️⃣ 📝 Bài Khảo Sát & Đánh Giá Tính Cách Chuyên Sâu (Personality Assessment)
* **Bộ câu hỏi trắc nghiệm tương tác cao**: Thiết kế theo phương pháp tâm lý học ứng dụng, giúp người dùng tự soi chiếu hành vi, cảm xúc và phản ứng thực tế.
* **Báo cáo đối chiếu số học**: Kết hợp kết quả trắc nghiệm với Số Chủ Đạo để chỉ ra:
  * Điểm mạnh vượt trội cần phát huy.
  * Vùng mù (Blind spots) và bẫy cảm xúc thường gặp.
  * Gợi ý bài tập rèn luyện nội tâm và định hướng nghề nghiệp tương thích.

---

### 4️⃣ 📊 Màn Hình Kết Quả & Luận Giải Đa Tầng (Deep Interpretations & Smart Caching)
* **Giao diện thẻ trực quan (`DisplayCard`, `RenderItem`)**: Phối màu sang trọng, bố cục phân cấp khoa học giúp dễ dàng đọc hiểu trên cả điện thoại và máy tính.
* **Bộ nhớ đệm thông minh (Meaning Cache)**: Tự động lưu trữ nội dung luận giải với thời gian sống (TTL) 7 ngày, giúp tải kết quả trong 0.1 giây mà không cần gọi lại API.
* **Luận giải chi tiết 4 khía cạnh**: Cung cấp góc nhìn thực tiễn về *Sự nghiệp - Tài chính - Tình duyên - Sức khỏe*.

---

### 5️⃣ 🔍 Tra Cứu Chỉ Số & Hỏi Đáp Bách Khoa Số Học (Numerology Search & Q&A)
* **Từ điển tra cứu nhanh**: Tìm kiếm ý nghĩa của bất kỳ con số đơn lẻ (1 đến 9) hoặc số Master (11, 22, 33).
* **Kiểm tra độ hòa hợp (Compatibility Check)**: Đối chiếu mức độ ăn ý giữa hai con số trong mối quan hệ tình cảm, hôn nhân hoặc hợp tác làm ăn.
* **Tra cứu số may mắn & sim phong thủy**: Gợi ý dãy số trợ mệnh phù hợp với năng lượng bản thân.

---

### 6️⃣ 🎨 Studio Tạo Hình Nền May Mắn & Đổi Vận AI (AI Lucky Wallpaper Studio)
*Tính năng độc bản giúp biến năng lượng số học thành nghệ thuật thị giác chất lượng cao.*
* **Công nghệ Dual Free AI Engine**:
  * 🪄 **Subnp Magic Engine**: Sinh ảnh thông minh qua API tạo ảnh nghệ thuật.
  * ⚡ **Pollinations FLUX Engine**: Dự phòng tải tức thì độ phân giải siêu nét 8K không cần API key.
* **Prompt Thần Số Học Tự Động**: AI tự động kết hợp Số Chủ Đạo + Ngày Cá Nhân + Tên + Ý định may mắn thành câu lệnh hình học thiêng liêng.
* **6 Phong Cách Nghệ Thuật Cao Cấp**:
  1. *Hình Học Thiêng & Vũ Trụ (Sacred Geometry & Cosmic Glow)*.
  2. *Vàng Ròng 3D & Pha Lê (3D Liquid Gold & Crystal Glass)*.
  3. *Tối Giản Tĩnh Tại (Zen Minimalist & Soft Light)*.
  4. *Thủy Mặc Hoa Sen (Zen Ink & Lotus Petals)*.
  5. *Đá Quý & Thạch Anh Chữa Lành (Healing Gemstones & Aura)*.
  6. *Hào Quang Mặt Trời (Solar Flare & Sacred Light)*.
* **6 Ý Định Năng Lượng**: *Tài Lộc*, *Tình Duyên*, *Sự Nghiệp*, *Bình An*, *Sáng Tạo*, *Hộ Mệnh*.
* **Đầy đủ định dạng thiết bị**: Màn hình dọc điện thoại (9:16) với khung mô phỏng Dynamic Island, Màn hình máy tính (16:9), và Ảnh đại diện Avatar (1:1).
* **Nút "Đổi Vận" (1-Click Reroll)**: Tạo ngay tác phẩm mới khi cần thay đổi luồng năng lượng trong ngày.

---

### 7️⃣ 🔍 RAG Hỏi Đáp Thần Số Học (Numerology RAG Q&A)
*Đây là pipeline RAG duy nhất của sản phẩm.*
* Người dùng đặt câu hỏi tự nhiên bằng tiếng Việt hoặc tiếng Anh.
* Hệ thống chuẩn hóa/trích xuất metadata, tìm kiếm trong ChromaDB, rerank các kết quả phù hợp và đưa context vào AI.
* AI trả lời dựa trên context truy xuất được, hồ sơ numerology của người dùng và disclaimer; khi không đủ dữ liệu, hệ thống phải nói rõ giới hạn thay vì tự đoán.
* Luồng chính được triển khai qua `/api/chat` và `/api/numerology/qa`.

---

### 8️⃣ 💬 Trợ Lý AI Chatbot (AI Assistant)
* **Trợ lý Pyra AI**: Chatbot đồng hành giải đáp mọi khúc mắc về biểu đồ thần số học theo thời gian thực.

---

## 🎨 HỆ THỐNG THIẾT KẾ (OPEN DESIGN & FEMALE-CENTRIC SPEC)

Giao diện ứng dụng chính hiện được định hình trong `styles/chani-globals.css`, `styles/chani-inner.css` và các component trong `components/sites/`.

| Thành Phần | Mã Màu / Quy Chuẩn | Ý Nghĩa Thẩm Mỹ |
|---|---|---|
| **Nền Đêm Huyền Bí** | `#08060B` (Midnight Obsidian) | Tạo chiều sâu vô tận của vũ trụ, loại bỏ cảm giác chói mắt |
| **Bề Mặt Thẻ Thạch Anh** | `#120D18` (Plum Surface) / `#181222` | Kính mờ pha lê `liquid-glass` với `backdrop-filter: blur(28px)` |
| **Ánh Vàng Hồng Nữ Tính** | `#FF6B8B` (Champagne Rose Gold) | Tôn vinh vẻ đẹp dịu dàng, sang trọng và thu hút tình duyên |
| **Ánh Sao Hoàng Kim** | `#FFD166` (Starlight Gold) | Điểm xuyết sự thịnh vượng, may mắn và trí tuệ |
| **Hiệu Ứng Hoạt Họa** | `petalsCanvas` (Cánh hoa anh đào & sen rơi) | Mang lại cảm giác an yên, thư thái và chữa lành tâm hồn |
| **Typography** | `Playfair Display` + `Plus Jakarta Sans` | Sự giao thoa hoàn hảo giữa nét cổ điển quý phái và tính dễ đọc hiện đại |

---

## 🏗️ CẤU TRÚC THƯ MỤC DỰ ÁN

```text
NumerologyWebApp/
├── app/                              # Next.js 14 App Router
│   ├── [locale]/                     # Định tuyến đa ngôn ngữ (vi, en)
│   │   ├── page.tsx                  # Trang chủ & Bảng tính số học chính
│   │   ├── lucky-wallpaper/          # Studio Tạo Hình Nền May Mắn AI
│   │   ├── chat/                     # Trợ Lý AI Chatbot (Pyra AI)
│   │   └── admin/                    # Quản trị hệ thống RAG & Vector DB
│   ├── api/                          # API Backend Routes
│   │   ├── lucky-wallpaper/generate/ # API sinh ảnh FLUX / Subnp Magic
│   │   ├── numerology/               # API tính toán, phân tích ma trận số
│   │   └── chat/                     # API RAG Chatbot & Embedding retrieval
│   └── providers.tsx                 # Chakra UI, Emotion & i18n Providers
├── components/                       # UI Components Modular
│   ├── Numerology/                   # Bộ thẻ chỉ số, biểu đồ ngày sinh & kim tự tháp
│   ├── LuckyWallpaper/               # Modal & Studio tạo hình nền may mắn
│   ├── Survey/                       # Modal bài khảo sát tính cách
│   ├── Chat/                         # Khung chat, bong bóng tin nhắn & guide
│   └── Layout.tsx                    # Header, Footer, Language Switcher
├── knowledge/                        # Kho tri thức numerology dùng cho RAG
│   ├── *.md                           # Nội dung diễn giải theo chỉ số/số
│   └── daily_decision_*.md             # Dữ liệu lịch sử ngoài scope hiện tại
├── lib/                              # Thư viện tính toán & dịch vụ AI
│   ├── numerology.ts                 # Bộ thuật toán Pythagoras & Chaldean
│   ├── lucky-wallpaper/              # Xây dựng prompt & dual-engine image service
│   └── profile-knowledge.ts          # Quản lý hồ sơ & bộ nhớ đệm
├── styles/                           # Global CSS và hệ thống giao diện Pyra/Chani
├── scripts/                          # Bộ công cụ Python xử lý RAG & ChromaDB
│   ├── ingest_to_chromadb.py         # Script nạp kho tri thức duy nhất vào ChromaDB
│   └── jina_local_server.py          # Runtime server embedding cục bộ
├── messages/                         # Từ điển i18n (vi.json, en.json)
├── package.json                      # Cấu hình gói và dependencies
└── README.md                         # Tài liệu hướng dẫn dự án
```

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 1. Yêu Cầu Hệ Thống
* **Node.js**: Phiên bản `>= 18.17.0` (Khuyến nghị Node 20 LTS).
* **Package Manager**: `pnpm` hoặc `npm` / `yarn`.
* **Python** *(Tùy chọn, dùng cho tính năng RAG Local)*: Python `>= 3.10`.

### 2. Cài Đặt Dependencies

```bash
# Cài đặt các gói Node.js
pnpm install
# hoặc: npm install
```

### 3. Cấu Hình Biến Môi Trường (`.env.local`)

Tạo file `.env.local` tại thư mục gốc với các biến cấu hình cần thiết:

```env
# Cổng chạy ứng dụng
PORT=3200

# Primary LLM: Google Gemini (được thử đầu tiên)
GEMINI_API_KEY=your_gemini_key
GEMINI_CHAT_MODELS=gemini-2.5-flash

# Fallback LLMs (tùy chọn; nhiều model cách nhau bằng dấu phẩy)
NVIDIA_API_KEY=your_nvidia_key
NVIDIA_CHAT_MODELS=meta/llama-3.3-70b-instruct,nvidia/llama-3.1-nemotron-70b-instruct
GROQ_API_KEY=your_groq_key
GROQ_CHAT_MODELS=openai/gpt-oss-20b,openai/gpt-oss-120b
XAI_API_KEY=your_xai_key
XAI_CHAT_MODELS=grok-2-latest,grok-beta
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_FREE_MODELS=meta-llama/llama-3.3-70b-instruct:free,google/gemini-2.0-flash-exp:free

# Jina AI (Dùng cho Vector Embedding RAG)
JINA_API_KEY=your_jina_api_key

# Subnp Magic (Tùy chọn cho sinh ảnh AI)
SUBNP_API_KEY=your_subnp_key
```

### 4. Khởi Chạy Môi Trường Development

```bash
# Khởi chạy server Next.js (mặc định cổng 3200)
pnpm dev

# Truy cập trình duyệt:
# http://localhost:3200/vi (Giao diện Tiếng Việt)
# http://localhost:3200/vi/lucky-wallpaper (Studio Hình Nền)
```

### 5. Cài Đặt & Nạp Dữ Liệu RAG (Tùy chọn)

```bash
# Cài đặt thư viện Python RAG
pip install -r scripts/requirements-rag.txt

# Nạp kho tri thức numerology duy nhất vào ChromaDB
pnpm rag:ingest

# Khởi chạy Jina Local Embedding Server (nếu không dùng Cloud API)
pnpm rag:jina
```

---

---

## 📜 TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)

> ⚠️ **Lưu ý quan trọng**: Thần số học (Nhân số học) là một bộ môn khoa học tâm lý và biểu tượng cổ đại mang tính chất tham khảo, chiêm nghiệm và giải trí tích cực. Các phân tích và dự báo từ ứng dụng nhằm mục đích gợi mở tư duy, khích lệ tinh thần và hỗ trợ tự khám phá tiềm năng bản thân. Người dùng nên kết hợp với tư duy phản biện, nỗ lực thực tế và các lời khuyên chuyên môn để đưa ra quyết định quan trọng trong cuộc đời.

---

<div align="center">
  <sub>Được xây dựng với tình yêu và tâm huyết chữa lành • An Nhiên Numerology © 2026</sub>
</div>
