// scripts/test-stock-apis.ts

const pexelsKey = process.env.PEXELS_API_KEY || process.env.PEXEL_API_KEY;
const pixabayKey = process.env.PIXABAY_API_KEY;

console.log("=== KIỂM TRA API KEYS ===");
console.log("Pexels Key:", pexelsKey ? "Đã cấu hình" : "CHƯA CÓ");
console.log("Pixabay Key:", pixabayKey ? "Đã cấu hình" : "CHƯA CÓ");
console.log("==========================\n");

async function testPixabay() {
  console.log("--- Đang test Pixabay API ---");
  if (!pixabayKey) {
    console.error("❌ Thiếu PIXABAY_API_KEY");
    return;
  }
  const query = "mandala sacred geometry";
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(pixabayKey)}&q=${encodeURIComponent(query)}&image_type=illustration&orientation=vertical&per_page=3`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Pixabay lỗi HTTP ${res.status}:`, errText);
      return;
    }
    const data = await res.json();
    console.log(`✅ Pixabay thành công! Tìm thấy ${data.totalHits} ảnh cho từ khóa "${query}".`);
    if (data.hits && data.hits.length > 0) {
      console.log("Ví dụ ảnh đầu tiên:");
      console.log(" - Tác giả:", data.hits[0].user);
      console.log(" - Link xem trước:", data.hits[0].previewURL);
      console.log(" - Link tải lớn (webformatURL):", data.hits[0].webformatURL);
      console.log(" - Kích thước:", `${data.hits[0].imageWidth}x${data.hits[0].imageHeight}`);
    }
  } catch (err) {
    console.error("❌ Lỗi gọi Pixabay:", err);
  }
}

async function testPexels() {
  console.log("\n--- Đang test Pexels API ---");
  if (!pexelsKey) {
    console.error("❌ Thiếu PEXELS_API_KEY hoặc PEXEL_API_KEY");
    return;
  }
  const query = "cosmic galaxy nebula";
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=3`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: pexelsKey,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Pexels lỗi HTTP ${res.status}:`, errText);
      return;
    }
    const data = await res.json();
    console.log(`✅ Pexels thành công! Tìm thấy ${data.total_results} ảnh cho từ khóa "${query}".`);
    if (data.photos && data.photos.length > 0) {
      console.log("Ví dụ ảnh đầu tiên:");
      console.log(" - Nhiếp ảnh gia:", data.photos[0].photographer);
      console.log(" - Link xem trước (medium):", data.photos[0].src.medium);
      console.log(" - Link ảnh dọc điện thoại (portrait):", data.photos[0].src.portrait);
      console.log(" - Link gốc HD (original):", data.photos[0].src.original);
      console.log(" - Kích thước:", `${data.photos[0].width}x${data.photos[0].height}`);
    }
  } catch (err) {
    console.error("❌ Lỗi gọi Pexels:", err);
  }
}

async function main() {
  await testPixabay();
  await testPexels();
  console.log("\n=== HOÀN TẤT KIỂM TRA ===");
}

main();
