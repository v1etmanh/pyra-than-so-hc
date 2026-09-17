/**
 * Script cào toàn bộ kho tàng ca dao tục ngữ từ https://cadao.me
 * và lưu trực tiếp vào database SQLite cho ứng dụng di động React Native.
 *
 * Chạy bằng: node --experimental-sqlite scripts/crawl-cadao.js
 *
 * Tính năng:
 * - Hỗ trợ cào từ trang 1 đến 827 (hoặc tùy chỉnh số trang).
 * - Tự động tạo bảng SQLite chuẩn hóa và index tìm kiếm.
 * - Cơ chế Resume / Checkpoint: Tạm dừng và tiếp tục bất cứ lúc nào mà không sợ mất dữ liệu.
 * - Retry tự động khi gặp lỗi mạng.
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

// Đường dẫn file database đầu ra trong mobile_app
const ASSETS_DIR = path.join(__dirname, '..', 'mobile_app', 'assets');
const DB_PATH = path.join(ASSETS_DIR, 'cadao.db');
const CHECKPOINT_PATH = path.join(__dirname, 'crawl-checkpoint.json');

// Đảm bảo thư mục assets tồn tại
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Khởi tạo SQLite Database
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS cadao (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    url TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_cadao_category ON cadao(category);
  CREATE INDEX IF NOT EXISTS idx_cadao_title ON cadao(title);
`);

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO cadao (id, title, content, category, url)
  VALUES (?, ?, ?, ?, ?)
`);

// Đọc checkpoint cũ nếu có
function getStartPage() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
      if (data.lastPage && data.lastPage >= 1 && data.lastPage < 827) {
        return data.lastPage + 1;
      }
    } catch {
      // ignore
    }
  }
  return 1;
}

function saveCheckpoint(page, totalSaved) {
  fs.writeFileSync(
    CHECKPOINT_PATH,
    JSON.stringify({ lastPage: page, totalSaved, updatedAt: new Date().toISOString() }, null, 2)
  );
}

// Hàm tải và bóc tách dữ liệu 1 trang
async function fetchPage(page, retries = 3) {
  const url = `https://cadao.me/page/${page}/`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      const articleRegex = /<article[\s\S]*?<\/article>/g;
      const articles = html.match(articleRegex) || [];

      const items = [];
      for (const art of articles) {
        const idMatch = art.match(/data-post-id="(\d+)"/);
        const titleMatch = art.match(/<h1 class="post-title[^"]*">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
        const contentMatch = art.match(/<div class="entry-content">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/);
        const catMatch = art.match(/rel="category tag">([\s\S]*?)<\/a>/);

        const id = idMatch ? parseInt(idMatch[1], 10) : null;
        if (!id) continue;

        const link = titleMatch ? titleMatch[1].trim() : '';
        const title = titleMatch ? titleMatch[2].replace(/<[^>]+>/g, '').trim() : '';

        let content = '';
        if (contentMatch) {
          content = contentMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
        } else {
          content = title;
        }

        const category = catMatch ? catMatch[1].trim() : 'Chung';
        items.push({ id, title, content, category, url: link });
      }

      return items;
    } catch (err) {
      if (attempt === retries) {
        console.error(`❌ Lỗi tải trang ${page} sau ${retries} lần thử:`, err.message);
        return [];
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

async function main() {
  const TOTAL_PAGES = 827;
  const startPage = getStartPage();
  console.log(`=======================================================`);
  console.log(`🚀 BẮT ĐẦU CÀO KHO TÀNG CA DAO TỪ CADAO.ME`);
  console.log(`📂 Output SQLite: ${DB_PATH}`);
  console.log(`📑 Bắt đầu từ trang: ${startPage} / ${TOTAL_PAGES}`);
  console.log(`=======================================================\n`);

  // Đếm số bản ghi hiện có trong DB
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM cadao').get();
  let totalSaved = countRow ? countRow.count : 0;
  console.log(`📊 Số bản ghi hiện có trong DB: ${totalSaved}\n`);

  const CONCURRENCY = 4; // Cào 4 trang cùng lúc để vừa nhanh vừa không bị block

  for (let page = startPage; page <= TOTAL_PAGES; page += CONCURRENCY) {
    const pageBatch = [];
    for (let i = 0; i < CONCURRENCY && page + i <= TOTAL_PAGES; i++) {
      pageBatch.push(page + i);
    }

    const results = await Promise.all(pageBatch.map((p) => fetchPage(p)));

    db.exec('BEGIN TRANSACTION');
    let batchCount = 0;
    for (const items of results) {
      for (const item of items) {
        insertStmt.run(item.id, item.title, item.content, item.category, item.url);
        batchCount++;
      }
    }
    db.exec('COMMIT');

    totalSaved += batchCount;
    const lastBatchPage = pageBatch[pageBatch.length - 1];
    saveCheckpoint(lastBatchPage, totalSaved);

    const percent = ((lastBatchPage / TOTAL_PAGES) * 100).toFixed(1);
    console.log(
      `[${percent}%] Đã xử lý đến trang ${lastBatchPage}/${TOTAL_PAGES} | Thêm ${batchCount} bài | Tổng DB: ${totalSaved} bài`
    );

    // Nghỉ nhẹ 150ms để lịch sự với server cadao.me
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 HOÀN TẤT CÀO TOÀN BỘ CADAO.ME!`);
  console.log(`✅ Tổng số bài ca dao trong SQLite: ${totalSaved}`);
  console.log(`📁 File SQLite sẵn sàng tại: ${DB_PATH}`);
  console.log(`=======================================================`);
}

main().catch(console.error);
