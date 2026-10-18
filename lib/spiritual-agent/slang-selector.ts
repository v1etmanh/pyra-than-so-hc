import { ALL_SLANGS } from './slang-corpus.ts';

export { ALL_SLANGS };

/**
 * Lấy ngẫu nhiên N câu/cụm từ lóng độc nhất từ kho dữ liệu mà không trùng nhau trong một lần gọi.
 * @param count Số lượng câu cần lấy ngẫu nhiên (mặc định 5)
 */
export function getRandomSlangSample(count = 5): string[] {
  const pool = [...ALL_SLANGS];
  const targetCount = Math.min(Math.max(1, count), pool.length);
  const selected: string[] = [];

  for (let i = 0; i < targetCount; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return selected;
}
